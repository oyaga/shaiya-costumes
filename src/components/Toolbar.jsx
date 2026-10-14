import { TABS } from "../catalog.js";

export default function Toolbar({ tab, onTab, counts, q, onQ }) {
  return (
    <div className="toolbar">
      <div className="tabs" role="tablist" aria-label="Seção">
        {TABS.map(([c, label]) => (
          <button key={c} type="button" className="tab" role="tab" aria-selected={tab === c} onClick={() => onTab(c)}>
            {label}
            {c !== "dress" && <span className="n">{counts[c]}</span>}
          </button>
        ))}
      </div>
      {tab !== "dress" && (
        <input className="search" type="search" placeholder="Buscar pelo nome" aria-label="Buscar pelo nome" value={q} onChange={(e) => onQ(e.target.value)} />
      )}
    </div>
  );
}
