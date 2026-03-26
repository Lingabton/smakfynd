// src/theme.jsx
// ── Color system ──
const t = {
  bg: "#f7f3ec",
  surface: "#fefcf8",
  card: "#ffffff",
  bdr: "#e6ddd0",
  bdrL: "#efe8dc",
  wine: "#8b2332",
  wineD: "#6b1a27",
  wineL: "#8b233212",
  tx: "#1e1710",
  txM: "#4a4238",
  txL: "#7a7060",
  txF: "#a89e8e",
  green: "#3d7a3e",
  greenL: "#3d7a3e10",
  deal: "#c44020",
  dealL: "#c4402010",
  gold: "#b08d40",
};

// ── Shared styles ──
const pill = (active, accent = t.wine) => ({
  padding: "8px 16px", borderRadius: 100, cursor: "pointer", fontSize: 13,
  fontWeight: active ? 600 : 400, whiteSpace: "nowrap", fontFamily: "inherit",
  transition: "all 0.2s ease",
  border: active ? `1.5px solid ${accent}` : `1px solid ${t.bdr}`,
  background: active ? accent + "0c" : "transparent",
  color: active ? accent : t.txM,
});

// Rescale raw score to 1-100 for display
// Uses piecewise mapping so scores spread across full range
