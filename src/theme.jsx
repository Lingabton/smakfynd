// src/theme.jsx
// ── Design system ──
const t = {
  // Backgrounds
  bg: "#f5f1ea",
  surface: "#fdfbf7",
  card: "#ffffff",
  // Borders
  bdr: "#e2d8c8",
  bdrL: "#ede6da",
  // Brand — reserved for primary CTAs + brand mark only
  wine: "#8b2332",
  wineD: "#6b1a27",
  wineL: "#8b233210",
  // Text
  tx: "#1a1510",
  txM: "#3a2a1f",      // warm near-black for body links
  txL: "#6b6355",
  txF: "#9e9588",
  // Semantic
  green: "#3d7a4a",    // olive-green for positive signals (comparisons)
  greenL: "#3d7a4a10",
  deal: "#c44020",
  dealL: "#c4402010",
  gold: "#b08d40",
  // Shadows
  sh1: "0 1px 3px rgba(26,21,16,0.04)",
  sh2: "0 4px 12px rgba(26,21,16,0.06)",
  sh3: "0 8px 24px rgba(26,21,16,0.08)",
  shHover: "0 8px 28px rgba(26,21,16,0.10)",
  // Typography
  serif: "'Newsreader', Georgia, serif",
  sans: "'Inter', -apple-system, sans-serif",
};

// ── Shared styles ──
// STATUS pills: filled, one per card (Toppköp, Starkt fynd, EKO)
const statusPill = (label, color = t.green) => ({
  fontSize: 9, fontWeight: 700, fontFamily: t.sans,
  padding: "3px 8px", borderRadius: 6,
  background: color, color: "#fff",
  textTransform: "uppercase", letterSpacing: "0.04em",
  whiteSpace: "nowrap",
});

// VIBE pills: outlined, multiple per card (Prisvärt, Tryggt vardagsvin)
const vibePill = (color = t.txM) => ({
  fontSize: 9, fontFamily: t.sans,
  padding: "2px 7px", borderRadius: 100,
  background: "transparent",
  border: `1px solid ${color}30`,
  color: color, whiteSpace: "nowrap",
});

const pill = (active, accent = t.wine) => ({
  padding: "8px 16px", borderRadius: 100, cursor: "pointer", fontSize: 13,
  fontWeight: active ? 600 : 400, whiteSpace: "nowrap", fontFamily: "inherit",
  transition: "all 0.2s ease",
  border: active ? `1.5px solid ${accent}` : `1px solid ${t.bdr}`,
  background: active ? accent + "0c" : "transparent",
  color: active ? accent : t.txM,
  boxShadow: active ? `0 0 0 3px ${accent}08` : "none",
});
