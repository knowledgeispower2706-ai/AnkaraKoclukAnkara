import React from "react";

const PALETTE = ["#1E6E63", "#E3A21A", "#C1483C", "#3D5A80", "#8A5A44", "#7A4E8C", "#2E7DA6", "#A64E6B"];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ name, size = 40, ring = false }) {
  const initials = (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const color = colorFor(name || "?");
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-display font-semibold"
      style={{
        width: size,
        height: size,
        background: `${color}22`,
        color,
        fontSize: size * 0.4,
        border: ring ? `2px solid ${color}55` : "none",
      }}
    >
      {initials}
    </div>
  );
}
