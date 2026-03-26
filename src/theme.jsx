// src/theme.jsx
// ── Design system ──
const t = {
  // Backgrounds
  bg: "#f5f1ea",       // warmer, slightly darker
  surface: "#fdfbf7",
  card: "#ffffff",
  // Borders
  bdr: "#e2d8c8",      // warmer border
  bdrL: "#ede6da",
  // Brand
  wine: "#8b2332",
  wineD: "#6b1a27",
  wineL: "#8b233210",
  // Text
  tx: "#1a1510",       // slightly darker for better contrast
  txM: "#3d3830",      // darker mid-text
  txL: "#6b6355",      // darker light text
  txF: "#9e9588",
  // Semantic
  green: "#2d7a3e",    // slightly cooler green
  greenL: "#2d7a3e10",
  deal: "#c44020",
  dealL: "#c4402010",
  gold: "#b08d40",
  // Shadows
  sh1: "0 1px 3px rgba(26,21,16,0.04)",
  sh2: "0 4px 12px rgba(26,21,16,0.06)",
  sh3: "0 8px 24px rgba(26,21,16,0.08)",
  shHover: "0 8px 28px rgba(26,21,16,0.10)",
};

// ── Shared styles ──
const pill = (active, accent = t.wine) => ({
  padding: "8px 16px", borderRadius: 100, cursor: "pointer", fontSize: 13,
  fontWeight: active ? 600 : 400, whiteSpace: "nowrap", fontFamily: "inherit",
  transition: "all 0.2s ease",
  border: active ? `1.5px solid ${accent}` : `1px solid ${t.bdr}`,
  background: active ? accent + "0c" : "transparent",
  color: active ? accent : t.txM,
  boxShadow: active ? `0 0 0 3px ${accent}08` : "none",
});
