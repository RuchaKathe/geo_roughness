import { useState } from "react";

export default function MaterialPanel({ material }) {
  const [open, setOpen] = useState(false);

  if (!material) return null;

  const GPa = (v) => (v / 1e9).toFixed(2) + " GPa";
  const MPa = (v) => (v / 1e6).toFixed(0) + " MPa";

  return (
    <div
      style={{
        backgroundColor: "#262626",
        border: "1px solid #444",
        borderRadius: "8px",
        marginBottom: "1rem",
        maxWidth: "420px",
      }}
    >
      {/* Header (clickable) */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "0.8rem 1rem",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
        }}
      >
        <b>Material</b>
        <span style={{ opacity: 0.8 }}>
          {material.name} {open ? "▲" : "▼"}
        </span>
      </div>

      {/* Content */}
      {open && (
        <div
          style={{
            padding: "0.8rem 1rem",
            borderTop: "1px solid #444",
            fontSize: "0.9rem",
          }}
        >
          <table style={{ width: "100%" }}>
            <tbody>
              <tr>
                <td>Density</td>
                <td style={{ textAlign: "right" }}>
                  {material.density} kg/m³
                </td>
              </tr>
              <tr>
                <td>Elastic Modulus</td>
                <td style={{ textAlign: "right" }}>
                  {GPa(material.elastic_modulus)}
                </td>
              </tr>
              <tr>
                <td>Yield Strength</td>
                <td style={{ textAlign: "right" }}>
                  {MPa(material.yield_strength)}
                </td>
              </tr>
              <tr>
                <td>Tensile Strength</td>
                <td style={{ textAlign: "right" }}>
                  {MPa(material.tensile_strength)}
                </td>
              </tr>
              <tr>
                <td>Poisson’s Ratio</td>
                <td style={{ textAlign: "right" }}>
                  {material.poisson_ratio}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
