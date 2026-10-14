import { TABS, CLASSES, LIGHT } from "../catalog.js";

const GEAR_TABS = ["set", "weapon"];

// Filtro de classe (sets e armas): agrupado por facção, como na criação de personagem do jogo.
function ClassFilter({ cls, onCls, t }) {
  const opt = (c) => <option key={c.id} value={c.id}>{t("cls." + c.id)}</option>;
  return (
    <select className="clsfilter" aria-label={t("cls.label")} value={cls || ""} onChange={(e) => onCls(e.target.value || null)}>
      <option value="">{t("cls.all")}</option>
      <optgroup label={t("fac.light")}>{CLASSES.filter((c) => LIGHT.includes(c.race)).map(opt)}</optgroup>
      <optgroup label={t("fac.fury")}>{CLASSES.filter((c) => !LIGHT.includes(c.race)).map(opt)}</optgroup>
    </select>
  );
}

export default function Toolbar({ tab, onTab, counts, q, onQ, cls, onCls, t }) {
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
        <div className="filters">
          {GEAR_TABS.includes(tab) && <ClassFilter cls={cls} onCls={onCls} t={t} />}
          <input className="search" type="search" placeholder={t("search")} aria-label={t("search")} value={q} onChange={(e) => onQ(e.target.value)} />
        </div>
      )}
    </div>
  );
}
