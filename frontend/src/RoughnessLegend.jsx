import React from "react";

export default function RoughnessLegend({ min, max, units = "m" }) {
  const format = (v) =>
    units === "m"
      ? (v * 1e6).toFixed(2) + " µm"
      : v.toFixed(6) + " " + units;

  return (
    <div
      style={{
        position: "absolute",
        right: "20px",
        top: "120px",
        background: "#1e1e1e",
        border: "1px solid #444",
        padding: "12px",
        color: "white",
        fontSize: "13px",
        width: "160px",
      }}
    >
      <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
        Surface Roughness
      </div>

      {/* Color bar */}
      <div
        style={{
          height: "120px",
          width: "20px",
          background:
            "linear-gradient(to top, red, yellow, lime, cyan, blue)",
          border: "1px solid #555",
          float: "left",
          marginRight: "10px",
        }}
      />

      {/* Labels */}
      <div style={{ lineHeight: "1.6" }}>
        <div>Max</div>
        <div style={{ marginBottom: "80px" }} />
        <div>Min</div>
      </div>

      <div style={{ clear: "both", marginTop: "10px" }}>
        <div><b>Max:</b> {format(max)}</div>
        <div><b>Min:</b> {format(min)}</div>
      </div>
    </div>
  );
}
