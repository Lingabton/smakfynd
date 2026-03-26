// src/hooks.jsx
function useSaved() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem("smakfynd_saved_v2");
      if (raw) return JSON.parse(raw);
      // Migrate from old format (flat array → favoriter list)
      const old = JSON.parse(localStorage.getItem("smakfynd_saved") || "[]");
      if (old.length) {
        const migrated = {};
        old.forEach(nr => { migrated[nr] = ["favoriter"]; });
        return migrated;
      }
      return {};
    } catch(e) { return {}; }
  });

  const save = (next) => {
    setData(next);
    try { localStorage.setItem("smakfynd_saved_v2", JSON.stringify(next)); } catch(e) {}
  };

  const toggle = (nr, list = "favoriter") => {
    const next = { ...data };
    const lists = next[nr] || [];
    if (lists.includes(list)) {
      const filtered = lists.filter(l => l !== list);
      if (filtered.length === 0) delete next[nr];
      else next[nr] = filtered;
    } else {
      next[nr] = [...lists, list];
    }
    save(next);
  };

  const isSaved = (nr) => !!(data[nr] && data[nr].length > 0);
  const isInList = (nr, list) => (data[nr] || []).includes(list);
  const getLists = (nr) => data[nr] || [];
  const allSaved = Object.keys(data).filter(nr => data[nr] && data[nr].length > 0);
  const inList = (list) => Object.keys(data).filter(nr => (data[nr] || []).includes(list));
  const count = allSaved.length;

  return { data, toggle, isSaved, isInList, getLists, allSaved, inList, count };
}

// Global saved state (shared between components)
const SavedContext = React.createContext(null);
