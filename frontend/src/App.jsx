import { useState } from "react";
import ThreeViewer from "./ThreeViewer";
import RoughnessLegend from "./RoughnessLegend";
import MaterialPanel from "./MaterialPanel";

export default function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unit, setUnit] = useState("m"); // "m" | "um"

  // ----------------------------
  // Unit formatter (DISPLAY ONLY)
  // ----------------------------
  const formatValue = (valueInMeters) => {
    if (unit === "um") {
      return (valueInMeters * 1e6).toFixed(3);
    }
    return valueInMeters.toExponential(6);
  };

  // ----------------------------
  // Analyze mesh
  // ----------------------------
  const analyzeMesh = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const file = e.target.file.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Backend error");
      }

      const data = await res.json();
      console.log("API response:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze mesh");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "Arial",
        color: "white",
        backgroundColor: "#1e1e1e",
        minHeight: "100vh",
      }}
    >
      <h2>Geo Roughness Analyzer</h2>

      {/* ---------------- FILE INPUT ---------------- */}
      <form onSubmit={analyzeMesh} style={{ marginBottom: "1rem" }}>
        <input type="file" name="file" accept=".glb" />
        <button type="submit" style={{ marginLeft: "0.5rem" }}>
          Analyze
        </button>
      </form>

      {loading && <p>Analyzing…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ---------------- RESULTS ---------------- */}
      {result && result.metrics && (
        <>
          {/* -------- Material Panel -------- */}
          {result.material && (
            <MaterialPanel material={result.material} />
          )}

          {/* -------- Unit Toggle -------- */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ marginRight: "1rem" }}>
              <input
                type="radio"
                checked={unit === "m"}
                onChange={() => setUnit("m")}
              />{" "}
              meters (m)
            </label>

            <label>
              <input
                type="radio"
                checked={unit === "um"}
                onChange={() => setUnit("um")}
              />{" "}
              micrometers (µm)
            </label>
          </div>

          {/* -------- Metrics -------- */}
          <h3>Surface Roughness Metrics</h3>

          <p>
            <b>Sa (Arithmetic Mean Height):</b>{" "}
            {formatValue(result.metrics.Sa)} {unit}
          </p>

          <p>
            <b>Sq (Root Mean Square Height):</b>{" "}
            {formatValue(result.metrics.Sq)} {unit}
          </p>

          <p>
            <b>Sz (Maximum Height):</b>{" "}
            {formatValue(result.metrics.Sz)} {unit}
          </p>

          {/* -------- Viewer + Legend -------- */}
          <div style={{ position: "relative", marginTop: "1rem" }}>
            <ThreeViewer data={result} />

            <RoughnessLegend
              min={
                unit === "um"
                  ? result.roughness.min * 1e6
                  : result.roughness.min
              }
              max={
                unit === "um"
                  ? result.roughness.max * 1e6
                  : result.roughness.max
              }
              units={unit}
            />
          </div>
        </>
      )}
    </div>
  );
}
