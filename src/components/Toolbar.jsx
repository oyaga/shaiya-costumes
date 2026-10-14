import { TABS } from "../catalog.js";

export default function Toolbar({ tab, onTab, counts, q, onQ, t }) {
  return (
    <div className="toolbar">
      <div className="tabs" role="tablist" aria-label={t("tabs")}>
        {TABS.map((c) => (
          <button key={c} type="button" className="tab" role="tab" aria-selected={tab === c} onClick={() => onTab(c)}>
            {t("tab." + c)}
            {c !== "dress" && <span className="n">{counts[c]}</span>}
          </button>
        ))}
      </div>
      {tab !== "dress" && (
        <input className="search" type="search" placeholder={t("search")} aria-label={t("search")} value={q} onChange={(e) => onQ(e.target.value)} />
      )}
    </div>
  );
}
