import { statChips } from "../catalog.js";

const nameOf = (list, k) => { const g = list.find((x) => x.k === k); return g ? g.name : null; };

function Items({ items, t }) {
  return (
    <ul className="itemlist">
      {items.map((x, i) => (
        <li key={i}>
          <div className="ithead"><code>{x[0]}/{x[1]}</code><span>{x[2]}</span></div>
          <div className="chips">
            {statChips(x[3], x[0], t).map((c, j) => <span key={j} className={c.good ? "stat good" : "stat"}>{c.text}</span>)}
          </div>
          {x[4] && <p className="itdesc">{x[4]}</p>}
        </li>
      ))}
    </ul>
  );
}

// catalog = lista localizada (mesmos índices k do catálogo bruto)
export default function Details({ tab, catalog, lists, sel, dress, onTry, t }) {
  const who = t("who", { race: t("race." + dress.race), sex: t("who." + dress.sex) });

  if (tab === "dress") {
    const chips = ["costume", "wing", "pet", "mount"].map((c) => [c, nameOf(lists[c], dress[c])]).filter((c) => c[1]);
    return (
      <section className="details" aria-live="polite">
        <div className="label">{t("det.dress", { who })}</div>
        <h2>{nameOf(lists.costume, dress.costume) || t("det.starter")}</h2>
        <div className="chips">
          {chips.length ? chips.map((c) => <span key={c[0]} className="chip"><b>{t("cat." + c[0])}</b>{c[1]}</span>) : <span className="chip">{t("det.nothing")}</span>}
        </div>
      </section>
    );
  }

  if (tab === "costume") {
    const c = lists.costume.find((x) => x.k === sel.costume);
    if (!c) return null;
    return (
      <section className="details" aria-live="polite">
        <div className="label">{t("cat.costume")} · {who}</div>
        <h2>{c.name}</h2>
        <div className="label">{t("det.items")}</div>
        <Items items={c.items || [[c.t, c.i, c.name]]} t={t} />
        <div className="btnrow"><button type="button" className="btn primary" onClick={() => onTry("costume", c.k)}>{t("btn.try")}</button></div>
      </section>
    );
  }

  const g = catalog[sel[tab]];
  if (!g) return null;
  return (
    <section className="details" aria-live="polite">
      <div className="label">{t("cat." + g.cat)}{g.cat !== "pet" && ` · ${who}`}</div>
      <h2>{g.name}</h2>
      {g.desc && <p className="desc">{g.desc}</p>}
      <div className="label">{t("det.items")}</div>
      <Items items={g.items} t={t} />
      <div className="model">{t("det.model", { m: g.entry, a: g.anims.length ? g.anims.map((a) => t("mol." + a)).join(", ") : t("det.noanim") })}</div>
      <div className="btnrow"><button type="button" className="btn primary" onClick={() => onTry(g.cat, g.k)}>{t("btn.try")}</button></div>
    </section>
  );
}
