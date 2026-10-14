import { RACES, SEXES } from "../catalog.js";
import Seg from "./Seg.jsx";

function Pick({ id, label, list, value, none, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : +e.target.value)}>
        <option value="">{none}</option>
        {list.map((g) => <option key={g.k} value={g.k}>{g.name}</option>)}
      </select>
    </div>
  );
}

export default function DressForm({ dress, lists, onChange, t }) {
  const rnd = (a) => a[Math.floor(Math.random() * a.length)].k;
  return (
    <div className="form">
      <div className="field"><span className="label">{t("race")}</span><Seg label={t("race")} options={RACES.map((r) => [r, t("race." + r)])} value={dress.race} onChange={(race) => onChange({ race })} /></div>
      <div className="field"><span className="label">{t("sex")}</span><Seg label={t("sex")} options={SEXES.map((s) => [s, t("sex." + s)])} value={dress.sex} onChange={(sex) => onChange({ sex })} /></div>
      {["costume", "wing", "pet", "mount"].map((c) => (
        <Pick key={c} id={"d-" + c} label={t("cat." + c)} list={lists[c]} value={dress[c]} none={t("none." + c)} onChange={(v) => onChange({ [c]: v })} />
      ))}
      <div className="btnrow">
        <button type="button" className="btn primary" onClick={() => onChange({ costume: rnd(lists.costume), wing: rnd(lists.wing), pet: rnd(lists.pet), mount: Math.random() < 0.5 ? rnd(lists.mount) : null })}>{t("btn.random")}</button>
        <button type="button" className="btn" onClick={() => onChange({ costume: null, wing: null, pet: null, mount: null })}>{t("btn.clear")}</button>
      </div>
    </div>
  );
}
