import { RACES, CAT_LABEL, MOTION_LABEL, statChips } from "../catalog.js";
import Seg from "./Seg.jsx";

const SEXES = [["m", "Masculino"], ["f", "Feminino"]];
const nameOf = (list, k) => { const g = list.find((x) => x.k === k); return g ? g.name : null; };

function Items({ items }) {
  return (
    <ul className="itemlist">
      {items.map((x, i) => (
        <li key={i}>
          <div className="ithead"><code>{x[0]}/{x[1]}</code><span>{x[2]}</span></div>
          <div className="chips">
            {statChips(x[3], x[0]).map((c, j) => <span key={j} className={c.good ? "stat good" : "stat"}>{c.text}</span>)}
          </div>
          {x[4] && <p className="itdesc">{x[4]}</p>}
        </li>
      ))}
    </ul>
  );
}

function RaceSex({ dress, onDress }) {
  return (
    <div className="field">
      <span className="label">Ver em</span>
      <Seg label="Raça" options={RACES} value={dress.race} onChange={(race) => onDress({ race })} />
      <Seg label="Gênero" options={SEXES} value={dress.sex} onChange={(sex) => onDress({ sex })} />
    </div>
  );
}

export default function Details({ tab, data, lists, sel, dress, onDress, onTry }) {
  const who = `${RACES.find((r) => r[0] === dress.race)[1]} ${dress.sex === "m" ? "masculino" : "feminino"}`;

  if (tab === "dress") {
    const chips = [["Fantasia", nameOf(lists.costume, dress.costume)], ["Asa", nameOf(lists.wing, dress.wing)], ["Pet", nameOf(lists.pet, dress.pet)], ["Montaria", nameOf(lists.mount, dress.mount)]].filter((c) => c[1]);
    return (
      <section className="details" aria-live="polite">
        <div className="label">Provador · {who}</div>
        <h2>{nameOf(lists.costume, dress.costume) || "Armadura inicial"}</h2>
        <div className="chips">
          {chips.length ? chips.map((c) => <span key={c[0]} className="chip"><b>{c[0]}</b>{c[1]}</span>) : <span className="chip">Nada equipado além da armadura inicial</span>}
        </div>
      </section>
    );
  }

  if (tab === "costume") {
    const c = lists.costume.find((x) => x.k === sel.costume);
    if (!c) return null;
    return (
      <section className="details" aria-live="polite">
        <div className="label">Fantasia · {who}</div>
        <h2>{c.name}</h2>
        <div className="label">Itens com este visual</div>
        <Items items={c.items || [[c.t, c.i, c.name]]} />
        <RaceSex dress={dress} onDress={onDress} />
        <div className="btnrow"><button type="button" className="btn primary" onClick={() => onTry("costume", c.k)}>Usar no provador</button></div>
      </section>
    );
  }

  const g = data.catalog[sel[tab]];
  if (!g) return null;
  return (
    <section className="details" aria-live="polite">
      <div className="label">{CAT_LABEL[g.cat]}</div>
      <h2>{g.name}</h2>
      {g.desc && <p className="desc">{g.desc}</p>}
      <div className="label">Itens com este visual</div>
      <Items items={g.items} />
      <div className="model">Modelo: {g.entry} · animações: {g.anims.length ? g.anims.map((a) => MOTION_LABEL[a] || a).join(", ") : "nenhuma"}</div>
      <div className="btnrow"><button type="button" className="btn primary" onClick={() => onTry(g.cat, g.k)}>Usar no provador</button></div>
    </section>
  );
}
