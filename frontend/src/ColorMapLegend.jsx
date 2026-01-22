import React from "react";

export default function ColorMapLegend({ min, max, unit, title, type = "spectral" }) {
  const format = (v) => {
    if (v === undefined || v === null) return "0";
    if (Math.abs(v) < 0.001 && Math.abs(v) > 0) {
        return v.toExponential(2);
    }
    return v.toFixed(2);
  };

  const gradients = {
    diverging: "linear-gradient(to right, #0000ff, #00ffff, #ffffff, #ffff00, #ff0000)",
    spectral: "linear-gradient(to right, blue, cyan, lime, yellow, red)"
  };

  const background = gradients[type] || gradients.spectral;

  return (
    <div
      style={{
        marginTop: "10px",
        background: "#262626",
        border: "1px solid #444",
        padding: "10px",
        borderRadius: "4px",
        color: "#eee",
        fontSize: "0.85rem",
        display: "flex",
        flexDirection: "column",
        gap: "5px"
      }}
    >
      <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "4px" }}>
        {title} ({unit})
      </div>

      <div
        style={{
          height: "15px",
          width: "100%",
          background: background,
          borderRadius: "2px",
          border: "1px solid #555"
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
        <span>{format(min)}</span>
        <span>{format((min + max) / 2)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}