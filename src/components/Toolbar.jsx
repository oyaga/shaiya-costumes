import { TABS, RACES, raceClasses } from "../catalog.js";
import Seg from "./Seg.jsx";

const GEAR_TABS = ["set", "weapon"];

// Filtro de classe (sets e armas): agrupado por raça, como na criação de personagem do jogo.
function ClassFilter({ cls, onCls, t }) {
  const opt = (c) => <option key={c.id} value={c.id}>{t("cls." + c.id)}</option>;
  return (
    <select className="clsfilter" aria-label={t("cls.label")} value={cls || ""} onChange={(e) => onCls(e.target.value || null)}>
      <option value="">{t("cls.all")}</option>
      {RACES.map((r) => <optgroup key={r} label={t("race." + r)}>{raceClasses(r).map(opt)}</optgroup>)}
    </select>
  );
}

export default function Toolbar({ tab, onTab, counts, q, onQ, cls, onCls, cmp, onCmp, side, onSide, onSwap, t }) {
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
      <div className="filters">
        {tab !== "dress" && GEAR_TABS.includes(tab) && <ClassFilter cls={cls} onCls={onCls} t={t} />}
        {tab !== "dress" && <input className="search" type="search" placeholder={t("search")} aria-label={t("search")} value={q} onChange={(e) => onQ(e.target.value)} />}
        <button type="button" className="btn" aria-pressed={cmp} onClick={() => onCmp(!cmp)}>{t("cmp.on")}</button>
        {cmp && <Seg className="sideseg" label={t("cmp.aria")} options={[["A", t("cmp.tag_a")], ["B", t("cmp.tag_b")]]} value={side} onChange={onSide} />}
        {cmp && <button type="button" className="btn" onClick={onSwap}>{t("cmp.swap")}</button>}
      </div>
    </div>
  );
}
