import { useState } from "react";
import ThreeViewer from "./ThreeViewer";
import ColorMapLegend from "./ColorMapLegend";
import MaterialPanel from "./MaterialPanel";

export default function App() {
  const [roughnessData, setRoughnessData] = useState(null);
  const [femData, setFemData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);      // Critical errors (blocks everything)
  const [feaError, setFeaError] = useState(null); // Non-critical FEA warning
  const [unit, setUnit] = useState("m"); // "m" | "um"

  const formatValue = (valueInMeters) => {
    if (unit === "um") {
      return (valueInMeters * 1e6).toFixed(3);
    }
    return valueInMeters.toExponential(3);
  };

  const analyzeMesh = async (e) => {
    e.preventDefault();
    setError(null);
    setFeaError(null);
    setRoughnessData(null);
    setFemData(null);
    setLoading(true);

    const file = e.target.file.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Trigger both requests in parallel, but handle them independently
      const pRough = fetch("http://127.0.0.1:3000/analyze", { method: "POST", body: formData })
        .then(async (res) => {
           if (!res.ok) throw new Error("Roughness API failed");
           return res.json();
        });

      const pFem = fetch("http://127.0.0.1:8000/analyze_physics", { method: "POST", body: formData })
        .then(async (res) => {
           if (!res.ok) throw new Error("FEM API failed");
           return res.json();
        });

      // 2. Wait for both to settle (succeed or fail)
      const [resRough, resFem] = await Promise.allSettled([pRough, pFem]);

      // 3. Handle Roughness (Critical)
      if (resRough.status === "fulfilled") {
        setRoughnessData(resRough.value);
      } else {
        // If roughness fails, the whole app basically fails
        throw new Error("Failed to analyze surface roughness. Please check the backend.");
      }

      // 4. Handle FEM (Optional)
      if (resFem.status === "fulfilled") {
        setFemData(resFem.value);
      } else {
        // If FEM fails, we DO NOT throw. We just warn and hide FEM views.
        console.warn("FEM Analysis failed:", resFem.reason);
        setFemData(null);
        setFeaError("The mesher logic failed to mesh the model, so please try another model.");
      }

    } catch (err) {
      console.error(err);
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const getMinMax = (min, max) => {
    if (unit === "um") {
        return { min: min * 1e6, max: max * 1e6 };
    }
    return { min, max };
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial", color: "white", backgroundColor: "#1e1e1e", minHeight: "100vh" }}>
      <h2>Geo & FEM Analyzer</h2>

      <form onSubmit={analyzeMesh} style={{ marginBottom: "1rem" }}>
        <input type="file" name="file" accept=".glb" required />
        <button type="submit" disabled={loading} style={{ marginLeft: "0.5rem", padding: "5px 15px", cursor: "pointer" }}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </form>

      {/* Critical Error (Red) */}
      {error && (
        <p style={{ color: "#ff6b6b", border: "1px solid #ff6b6b", background: "rgba(255,0,0,0.1)", padding: "10px", borderRadius: "4px" }}>
          {error}
        </p>
      )}

      {/* Non-Critical FEA Warning (Orange/Yellow) */}
      {feaError && !loading && (
        <p style={{ color: "#ffd700", border: "1px solid #ffd700", background: "rgba(255, 215, 0, 0.1)", padding: "10px", borderRadius: "4px" }}>
          ⚠ {feaError}
        </p>
      )}

      {(roughnessData || femData) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
            
            {roughnessData?.material && (
               <div style={{ flex: "0 0 auto" }}>
                 <MaterialPanel material={roughnessData.material} />
               </div>
            )}

            {roughnessData?.metrics && (
              <div style={{ background: "#262626", padding: "1rem", borderRadius: "8px", border: "1px solid #444", minWidth: "250px" }}>
                <h4 style={{ marginTop: 0 }}>Roughness Metrics</h4>
                
                <div style={{ marginBottom: "10px", fontSize: "0.9rem" }}>
                  <label style={{ marginRight: "10px", cursor: "pointer" }}>
                    <input type="radio" checked={unit === "m"} onChange={() => setUnit("m")} /> Meters (m)
                  </label>
                  <label style={{ cursor: "pointer" }}>
                    <input type="radio" checked={unit === "um"} onChange={() => setUnit("um")} /> Micrometers (µm)
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "5px 15px" }}>
                  <b>Sa:</b> <span>{formatValue(roughnessData.metrics.Sa)} {unit}</span>
                  <b>Sq:</b> <span>{formatValue(roughnessData.metrics.Sq)} {unit}</span>
                  <b>Sz:</b> <span>{formatValue(roughnessData.metrics.Sz)} {unit}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", justifyContent: "space-between" }}>
            
            {/* 1. Roughness View (Always shows if successful) */}
            {roughnessData && (
              <div style={{ flex: "1 1 30%", minWidth: "300px" }}>
                <ThreeViewer 
                  title="Surface Roughness"
                  geometry={{
                    vertices: roughnessData.mesh.vertices,
                    faces: roughnessData.mesh.faces
                  }}
                  data={roughnessData.roughness}
                  mode="scalar"
                />
                
                <ColorMapLegend 
                  title="Deviation"
                  type="diverging"
                  unit={unit}
                  {...getMinMax(roughnessData.roughness.min, roughnessData.roughness.max)}
                />
              </div>
            )}

            {/* 2. FEM Pressure View (Only shows if FEA succeeded) */}
            {femData && (
              <div style={{ flex: "1 1 30%", minWidth: "300px" }}>
                <ThreeViewer 
                  title="Pressure (5 MPa)"
                  geometry={femData.geometry}
                  data={femData.pressure}
                  mode="vector"
                />
                
                <ColorMapLegend 
                   title="Displacement"
                   type="spectral"
                   unit={unit}
                   min={0}
                   max={unit === "um" ? femData.pressure.max_disp * 1e6 : femData.pressure.max_disp}
                />
              </div>
            )}

            {/* 3. FEM Thermal View (Only shows if FEA succeeded) */}
            {femData && (
              <div style={{ flex: "1 1 30%", minWidth: "300px" }}>
                <ThreeViewer 
                  title="Thermal (300K → 600K)"
                  geometry={femData.geometry}
                  data={femData.thermal}
                  mode="vector"
                />
                
                <ColorMapLegend 
                   title="Displacement"
                   type="spectral"
                   unit={unit}
                   min={0}
                   max={unit === "um" ? femData.thermal.max_disp * 1e6 : femData.thermal.max_disp}
                />
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
