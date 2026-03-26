// src/components/WeeklyPick.jsx
function WeeklyPick({ products }) {
  const pick = useMemo(() => {
    const candidates = products
      .filter(p => p.assortment === "Fast sortiment" && p.package === "Flaska" && p.price && p.price <= 150 && p.smakfynd_score >= 75)
      .sort((a, b) => {
        const aBonus = (a.crowd_score && a.expert_score) ? 5 : 0;
        const bBonus = (b.crowd_score && b.expert_score) ? 5 : 0;
        return (b.smakfynd_score + bBonus) - (a.smakfynd_score + aBonus);
      });
    return candidates[0] || null;
  }, [products]);

  if (!pick) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: t.wine, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Veckans fynd</div>
      <Card p={pick} rank={1} delay={0} allProducts={products} />
    </div>
  );
}
