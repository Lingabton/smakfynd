// src/utils.jsx
function rescale(raw) {
  if (raw >= 16) return Math.min(99, 90 + Math.round((raw - 16) * 5));
  if (raw >= 14) return Math.round(75 + (raw - 14) * 7.5);
  if (raw >= 12) return Math.round(60 + (raw - 12) * 7.5);
  if (raw >= 10) return Math.round(42 + (raw - 10) * 9);
  if (raw >= 8) return Math.round(22 + (raw - 8) * 10);
  return Math.max(1, Math.round(raw * 2.75));
}

// Shared wine similarity scoring — used by Card, StoreMode, and FoodMatch
function wineSimilarity(a, b) {
  const aGrapes = (a.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
  const bGrapes = (b.grape || "").toLowerCase().split(",").map(g => g.trim()).filter(Boolean);
  let sim = 0;
  // Grape is strongest signal
  if (aGrapes.length > 0 && bGrapes.some(g => aGrapes.includes(g))) sim += 40;
  // Region
  if (a.region && b.region && a.region.toLowerCase() === b.region.toLowerCase()) sim += 20;
  // Style category
  if (a.cat3 && b.cat3 && a.cat3.toLowerCase() === b.cat3.toLowerCase()) sim += 15;
  // Taste profile
  if (a.taste_body && b.taste_body) sim += (1 - Math.abs(a.taste_body - b.taste_body) / 12) * 15;
  if (a.taste_fruit && b.taste_fruit) sim += (1 - Math.abs(a.taste_fruit - b.taste_fruit) / 12) * 5;
  // Country
  if (a.country && b.country && a.country === b.country) sim += 5;
  return sim;
}

function getScoreInfo(s100) {
  if (s100 >= 90) return ["Exceptionellt fynd", "#1a7a2e", "🏆"];
  if (s100 >= 80) return ["Toppköp", t.green, "⭐"];
  if (s100 >= 70) return ["Starkt fynd", "#5a7542", ""];
  if (s100 >= 60) return ["Bra köp", "#7a7054", ""];
  if (s100 >= 50) return ["Okej värde", "#8a7a6a", ""];
  return ["Svagt värde", "#8a7a6a", ""];
}
