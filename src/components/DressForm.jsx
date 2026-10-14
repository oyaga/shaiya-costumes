import { RACES, SEXES, raceClasses } from "../catalog.js";
import Seg from "./Seg.jsx";

function Pick({ id, label, list, value, none, onChange, disabled }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value == null ? "" : String(value)} disabled={disabled} onChange={(e) => onChange(e.target.value === "" ? null : +e.target.value)}>
        <option value="">{none}</option>
        {list.map((g) => <option key={g.k} value={g.k}>{g.name}</option>)}
      </select>
    </div>
  );
}

// gear = sets/armas já carregados (gear.json chega depois do catálogo)
export default function DressForm({ dress, lists, gear, onChange, t }) {
  const rnd = (a) => (a.length ? a[Math.floor(Math.random() * a.length)].k : null);
  const armorSets = lists.set.filter((g) => g.f);
  const random = () => {
    const useSet = gear && Math.random() < 0.5;
    onChange({
      costume: useSet ? null : rnd(lists.costume), set: useSet ? rnd(armorSets) : null,
      weapon: gear && Math.random() < 0.7 ? rnd(lists.wpn) : null, shield: null,
      wing: rnd(lists.wing), pet: rnd(lists.pet), mount: Math.random() < 0.5 ? rnd(lists.mount) : null,
    });
  };
  return (
    <div className="form">
      <div className="field"><span className="label">{t("race")}</span><Seg label={t("race")} options={RACES.map((r) => [r, t("race." + r)])} value={dress.race} onChange={(race) => onChange({ race })} /></div>
      <div className="field"><span className="label">{t("cls.label")}</span><Seg label={t("cls.label")} options={raceClasses(dress.race).map((c) => [c.id, t("cls." + c.id)])} value={dress.cls} onChange={(cls) => onChange({ cls })} /></div>
      <div className="field"><span className="label">{t("sex")}</span><Seg label={t("sex")} options={SEXES.map((s) => [s, t("sex." + s)])} value={dress.sex} onChange={(sex) => onChange({ sex })} /></div>
      <Pick id="d-costume" label={t("cat.costume")} list={lists.costume} value={dress.costume} none={t("none.costume")} onChange={(v) => onChange({ costume: v })} />
      <Pick id="d-set" label={t("cat.set")} list={armorSets} value={dress.set} none={t("none.set")} disabled={!gear} onChange={(v) => onChange({ set: v })} />
      <Pick id="d-weapon" label={t("cat.weapon")} list={lists.wpn} value={dress.weapon} none={t("none.weapon")} disabled={!gear} onChange={(v) => onChange({ weapon: v })} />
      <Pick id="d-shield" label={t("cat.shield")} list={lists.shield} value={dress.shield} none={t("none.shield")} disabled={!gear} onChange={(v) => onChange({ shield: v })} />
      {["wing", "pet", "mount"].map((c) => (
        <Pick key={c} id={"d-" + c} label={t("cat." + c)} list={lists[c]} value={dress[c]} none={t("none." + c)} onChange={(v) => onChange({ [c]: v })} />
      ))}
      <div className="btnrow">
        <button type="button" className="btn primary" onClick={random}>{t("btn.random")}</button>
        <button type="button" className="btn" onClick={() => onChange({ costume: null, set: null, weapon: null, shield: null, wing: null, pet: null, mount: null })}>{t("btn.clear")}</button>
      </div>
    </div>
  );
}
