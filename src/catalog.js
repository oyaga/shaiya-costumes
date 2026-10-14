// Constantes e helpers do catálogo (sem React, sem three).
export const TABS = [["dress", "Provador"], ["costume", "Fantasias"], ["mount", "Montarias"], ["wing", "Asas"], ["pet", "Pets"]];
export const RACES = [["hu", "Humano"], ["el", "Elfo"], ["vi", "Vail"], ["de", "Deatheater"]];
export const CODE = { hu: { m: "humf", f: "huwf" }, el: { m: "elmr", f: "elwr" }, vi: { m: "vimr", f: "viwr" }, de: { m: "demf", f: "dewf" } };
export const RACE_IX = { hu: 0, el: 1, vi: 2, de: 3 };
export const CAT_LABEL = { costume: "Fantasia", mount: "Montaria", wing: "Asa", pet: "Pet" };
export const MOTION_LABEL = { idle: "parado", walk: "andando", run: "correndo" };

export const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Atributos do DBItemData (nomes como o cliente PT mostra) + buffs que só existem na descrição.
const ATTR = [["str", "FOR"], ["dex", "DES"], ["rec", "REC"], ["int", "INT"], ["wis", "SAB"], ["luc", "SOR"]];
export function statChips(st, type) {
  st = st || {};
  const out = [], vals = ATTR.map((a) => st[a[0]] || 0);
  if (vals.some((v) => v) && vals.every((v) => v === vals[0])) out.push({ text: `+${vals[0]} em todos os atributos`, good: true });
  else ATTR.forEach(([k, l]) => { if (st[k]) out.push({ text: `${l} +${st[k]}`, good: true }); });
  for (const [k, l] of [["hp", "HP"], ["sp", "SP"], ["mp", "MP"]]) if (st[k]) out.push({ text: `${l} +${st[k]}`, good: true });
  if (st.crit) out.push({ text: `Dano crítico +${st.crit}%`, good: true });
  if (type === 42 || type === 125) {
    out.push({ text: `Velocidade ${7 + (st.spd || 0)} u/s (a pé: 5)` });
    out.push({ text: `Invocação ${st.cast || 1} s` });   // AttackTime do item; 0 = 1 s no servidor
    if (st.seats === 2) out.push({ text: "2 assentos" });
  }
  if (st.lv) out.push({ text: `Nível ${st.lv}` });
  if (st.dur) {
    const d = st.dur / 86400;
    out.push({ text: d >= 1 ? `${Math.round(d)} dia${Math.round(d) > 1 ? "s" : ""}` : `${Math.round(st.dur / 3600)} h` });
  } else out.push({ text: "Permanente" });
  return out;
}

// Parâmetros da pintura como o cliente os recebe do servidor (sub_1403242E0): matiz u16 em graus,
// saturação = byte × 0,02 (0–5,1), brilho = 1 + byte × 0,002 (só clareia, até 1,51). Os presets são
// giros de matiz de exemplo; as cores que cada tintura sorteia são decididas pelo servidor.
export const DYE_PRESETS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((h) => ({ label: `Giro ${h}°`, h, s: 1, v: 1 }));
export const DYE_LABEL = { costume: "Fantasia", wing: "Asa", pet: "Pet", mount: "Montaria" };
export const swatchCss = ({ h, s, v }) => `hsl(${h}, ${Math.round(Math.min(100, s * 70))}%, ${Math.round(Math.min(92, 45 * v))}%)`;
