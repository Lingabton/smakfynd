#!/usr/bin/env python3
"""Add food and country filters to smakfynd-v7-slim.jsx"""

path = 'site/smakfynd-v7-slim.jsx'

with open(path, 'r') as f:
    code = f.read()

# 1. Add state variables after showEco
code = code.replace(
    'const [showEco, setShowEco] = useState(false);',
    'const [showEco, setShowEco] = useState(false);\n  const [food, setFood] = useState("all");\n  const [country, setCountry] = useState("all");'
)

# 2. Add filter logic after showEco filter
code = code.replace(
    'if (showEco) r = r.filter(p => p.organic);',
    'if (showEco) r = r.filter(p => p.organic);\n    if (food !== "all") r = r.filter(p => (p.food_pairings || []).includes(food));\n    if (country !== "all") r = r.filter(p => p.country === country);'
)

# 3. Update useMemo dependencies
code = code.replace(
    '[products, cat, price, search, showNew, showDeals, pkg, showEco]',
    '[products, cat, price, search, showNew, showDeals, pkg, showEco, food, country]'
)

# 4. Update hasFilters
code = code.replace(
    'const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco;',
    'const hasFilters = search || cat !== "all" || price !== "all" || showNew || showDeals || showEco || food !== "all" || country !== "all";'
)

# 5. Add food and country selects before Eko button
old_eko = '<button onClick={() => setShowEco(!showEco)} style={pill(showEco, t.green)}>'

food_select = """<select value={food} onChange={e => setFood(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: 100, border: `1px solid ${t.bdr}`,
              background: "transparent", color: food !== "all" ? t.tx : t.txM, fontSize: 13, cursor: "pointer",
              outline: "none", fontFamily: "inherit", appearance: "none",
              backgroundImage: "url(\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6' fill='%239a8e7e'/%3E%3C/svg%3E\\")",
              backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 30,
            }}>
            <option value="all">Passar till...</option>
            {["Fisk","Lamm","N\\u00f6t","F\\u00e5gel","Fl\\u00e4sk","Skaldjur","Gr\\u00f6nsaker"].map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={country} onChange={e => setCountry(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: 100, border: `1px solid ${t.bdr}`,
              background: "transparent", color: country !== "all" ? t.tx : t.txM, fontSize: 13, cursor: "pointer",
              outline: "none", fontFamily: "inherit", appearance: "none",
              backgroundImage: "url(\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6' fill='%239a8e7e'/%3E%3C/svg%3E\\")",
              backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 30,
            }}>
            <option value="all">Land</option>
            {["Italien","Frankrike","Spanien","USA","Tyskland","Sydafrika","Portugal","Chile","Australien","Nya Zeeland","\\u00d6sterrike","Argentina"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          """

code = code.replace(old_eko, food_select + old_eko, 1)

# 6. Update reset button to include food and country
code = code.replace(
    'setShowEco(false); }}',
    'setShowEco(false); setFood("all"); setCountry("all"); }}',
    1  # Only first occurrence
)

with open(path, 'w') as f:
    f.write(code)

print("Done! Food and country filters added.")
