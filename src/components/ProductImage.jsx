// src/components/ProductImage.jsx
function getImageUrl(p, size = 200) {
  if (p.image_url) return p.image_url;
  if (p.nr) return `https://product-cdn.systembolaget.se/productimages/${p.nr}/${p.nr}_400.png`;
  return null;
}

function ProductImage({ p, size = 52, style: extraStyle = {} }) {
  const [err, setErr] = useState(false);
  const url = getImageUrl(p);
  const icon = ({ Rött: "🍷", Vitt: "🥂", Rosé: "🌸", Mousserande: "🍾", Öl: "🍺" })[p.category] || "✦";

  if (!url || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 10, flexShrink: 0,
        background: t.bg, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, ...extraStyle,
      }}>{icon}</div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: t.bg, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      ...extraStyle,
    }}>
      <img
        src={url}
        alt={p.name}
        onError={() => setErr(true)}
        style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }}
      />
    </div>
  );
}

// Saved wines hook
const LISTS = [
  { k: "favoriter", l: "Favoriter", i: "♥" },
  { k: "att-testa", l: "Att testa", i: "🔖" },
  { k: "budget", l: "Bra köp", i: "💰" },
  { k: "middag", l: "Middag", i: "🍽" },
  { k: "helg", l: "Helg", i: "🥂" },
  { k: "fest", l: "Fest", i: "🎉" },
];
