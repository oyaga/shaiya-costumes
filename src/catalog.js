// Constantes e helpers do catálogo (sem React, sem three). Rótulos vêm de i18n.js (t).
export const TABS = ["dress", "costume", "set", "weapon", "mount", "wing", "pet"];
export const RACES = ["hu", "el", "vi", "de"];
export const SEXES = ["m", "f"];
export const CODE = { hu: { m: "humf", f: "huwf" }, el: { m: "elmr", f: "elwr" }, vi: { m: "vimr", f: "viwr" }, de: { m: "demf", f: "dewf" } };
export const RACE_IX = { hu: 0, el: 1, vi: 2, de: 3 };
export const LANG_IX = { pt: 0, es: 1, en: 2 };   // ordem dos nomes [pt, es, en] em gear.json

export const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Atributos do DBItemData + buffs que só existem na descrição.
const ATTR = ["str", "dex", "rec", "int", "wis", "luc"];
export function statChips(st, type, t, gear) {
  st = st || {};
  const labels = t("attr").split(",");
  const out = [], vals = ATTR.map((a) => st[a] || 0);
  if (st.atk) out.push({ text: t("stat.atk", { a: st.atk[0], b: st.atk[1] }) });
  if (st.def) out.push({ text: t("stat.def", { v: st.def }) });
  if (st.mdef) out.push({ text: t("stat.mdef", { v: st.mdef }) });
  if (vals.some((v) => v) && vals.every((v) => v === vals[0])) out.push({ text: t("stat.all", { v: vals[0] }), good: true });
  else ATTR.forEach((k, j) => { if (st[k]) out.push({ text: `${labels[j]} +${st[k]}`, good: true }); });
  for (const [k, l] of [["hp", "HP"], ["sp", "SP"], ["mp", "MP"]]) if (st[k]) out.push({ text: `${l} +${st[k]}`, good: true });
  if (st.crit) out.push({ text: t("stat.crit", { v: st.crit }), good: true });
  if (type === 42 || type === 125) {
    out.push({ text: t("stat.speed", { v: 7 + (st.spd || 0) }) });
    out.push({ text: t("stat.cast", { v: st.cast || 1 }) });   // AttackTime do item; 0 = 1 s no servidor
    if (st.seats === 2) out.push({ text: t("stat.seats") });
  }
  if (st.lv) out.push({ text: t("stat.level", { v: st.lv }) });
  if (gear) return out;   // equipamento não vence: não precisa do selo "permanente"
  if (st.dur) {
    const d = Math.round(st.dur / 86400);
    out.push({ text: st.dur >= 86400 ? (d > 1 ? t("stat.days", { v: d }) : t("stat.day")) : t("stat.hours", { v: Math.round(st.dur / 3600) }) });
  } else out.push({ text: t("stat.perm") });
  return out;
}

// Bônus de set ("Synergy" do cliente) por quantidade de peças: {str: 70, hp: 500, patk: 5…} → textos.
export function synText(b, t) {
  const labels = t("attr").split(",");
  return Object.entries(b).map(([k, v]) => {
    const j = ATTR.indexOf(k);
    if (j >= 0) return `${labels[j]} +${v}`;
    if (k === "hp" || k === "sp" || k === "mp") return `${k.toUpperCase()} +${v}`;
    return t("syn." + k, { v });
  });
}

// Parâmetros da pintura como o cliente os recebe do servidor (sub_1403242E0): matiz u16 em graus,
// saturação = byte × 0,02 (0–5,1), brilho = 1 + byte × 0,002 (até 1,51). Os presets são giros de matiz de
// exemplo; as cores que cada tintura sorteia são decididas pelo servidor.
export const DYE_PRESETS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((h) => ({ h, s: 1, v: 1 }));
export const swatchCss = ({ h, s, v }) => `hsl(${h}, ${Math.round(Math.min(100, s * 70))}%, ${Math.round(Math.min(92, 45 * v))}%)`;
