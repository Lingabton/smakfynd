// src/utils.jsx
function rescale(raw) {
  if (raw >= 16) return Math.min(99, 90 + Math.round((raw - 16) * 5));
  if (raw >= 14) return Math.round(75 + (raw - 14) * 7.5);
  if (raw >= 12) return Math.round(60 + (raw - 12) * 7.5);
  if (raw >= 10) return Math.round(42 + (raw - 10) * 9);
  if (raw >= 8) return Math.round(22 + (raw - 8) * 10);
  return Math.max(1, Math.round(raw * 2.75));
}

function getScoreInfo(s100) {
  if (s100 >= 90) return ["Exceptionellt fynd", "#1a7a2e", "🏆"];
  if (s100 >= 80) return ["Toppköp", t.green, "⭐"];
  if (s100 >= 70) return ["Starkt fynd", "#5a7542", ""];
  if (s100 >= 60) return ["Bra köp", "#7a7054", ""];
  if (s100 >= 50) return ["Okej värde", "#8a7a6a", ""];
  return ["Svagt värde", "#8a7a6a", ""];
}
