import { statChips, synText, charCode, CLASSES, itemFits, mobVariant, isTransform, mapSummary, lvText } from "../catalog.js";
import Icon from "./Icon.jsx";

// Título do visual; com o ícone oficial do cliente ao lado, quando há
const Heading = ({ g }) => (g.ic
  ? <div className="hd"><Icon ic={g.ic} size={48} /><h2>{g.name}</h2></div>
  : <h2>{g.name}</h2>);

const nameOf =(list, k) => { const g = list.find((x) => x.k === k); return g ? g.name : null; };

// Classes que usam o item (bit de classe + raça/facção da ficha)
function classLine(st, t) {
  const ok = CLASSES.filter((c) => itemFits(st, c));
  if (!ok.length) return null;
  return t("cls.uses", { c: ok.length === CLASSES.length ? t("cls.all").toLowerCase() : ok.map((c) => t("cls." + c.id)).join(", ") });
}

function Items({ items, t, gear }) {
  return (
    <ul className="itemlist">
      {items.map((x, i) => (
        <li key={i}>
          <div className="ithead"><code>{x[0]}/{x[1]}</code><span>{x[2]}</span></div>
          <div className="chips">
            {statChips(x[3], x[0], t, gear).map((c, j) => <span key={j} className={c.good ? "stat good" : "stat"}>{c.text}</span>)}
          </div>
          {gear && classLine(x[3], t) && <div className="classes">{classLine(x[3], t)}</div>}
          {x[4] && <p className="itdesc">{x[4]}</p>}
        </li>
      ))}
    </ul>
  );
}

// Bônus do set por quantidade de peças vestidas (o "Synergy" do cliente)
function Synergy({ syn, t }) {
  return (
    <ul className="synlist">
      {syn.map(([n, b]) => (
        <li key={n}><b>{t("syn.n", { n })}</b><span>{synText(b, t).join(" · ")}</span></li>
      ))}
    </ul>
  );
}

// Monstro ↔ mapa: linhas que levam de um ao outro (maps = { byId, mobById, appears, hl, onHl, onGoMap, onGoMob })
function MapDetails({ g, lists, maps, t }) {
  const mobs = g.m.map(([id, c, a]) => [maps.mobById[id], c, a]).filter((x) => x[0]);
  const to = g.to.filter((id) => id !== g.id && maps.byId[id]);
  return (
    <section className="details" aria-live="polite">
      <div className="label">{t("cat.map")} · #{g.id}</div>
      <h2>{g.name}</h2>
      <div className="chips">
        <span className="stat">{mapSummary(g, t)}</span>
        {g.na > 0 && <span className="stat">{t("map.areas", { n: g.na })}</span>}
        {g.nn > 0 && <span className="stat">{t("map.npcs", { n: g.nn })}</span>}
      </div>
      {g.reg.length > 0 && <><div className="label">{t("map.regions")}</div><div className="chips">{g.reg.map((r) => <span key={r} className="chip">{r}</span>)}</div></>}
      {to.length > 0 && (
        <>
          <div className="label">{t("map.portals")}</div>
          <div className="chips">{to.map((id) => <button key={id} type="button" className="chip link" onClick={() => maps.onGoMap(maps.byId[id].k, null)}>→ {maps.byId[id].name}</button>)}</div>
        </>
      )}
      {mobs.length > 0 && (
        <>
          <div className="label">{t("map.monsters")}</div>
          <ul className="itemlist maplist">
            {mobs.map(([mob, c, a]) => (
              <li key={mob.id} className={maps.hl === mob.id ? "on" : ""}>
                <button type="button" className="rowbtn" aria-pressed={maps.hl === mob.id} onClick={() => maps.onHl(maps.hl === mob.id ? null : mob.id)}>
                  <span className="nm">{mob.name}</span>
                  <span className="sub">{lvText(mob.lv[0], mob.lv[1], t)} · {t("map.mob_row", { a, c })}</span>
                </button>
                <button type="button" className="mini" onClick={() => maps.onGoMob(mob.k)} title={t("map.seemob")}>↗</button>
              </li>
            ))}
          </ul>
        </>
      )}
      {g.unk > 0 && <p className="desc note">{t("map.unk", { n: g.unk })}</p>}
      <p className="desc note">{t("map.note")}</p>
    </section>
  );
}

// catalog = lista localizada (mesmos índices k do catálogo bruto); gear = sets/armas localizados; lang = números
export default function Details({ tab, catalog, lists, gear, sel, dress, onTry, lang, t, maps }) {
  if (tab === "map") {
    const g = lists.map.find((x) => x.k === sel.map);
    return g && maps ? <MapDetails g={g} lists={lists} maps={maps} t={t} /> : null;
  }
  if (tab === "monster") {
    const g = lists.monster.find((x) => x.k === sel.monster);
    if (!g) return null;
    return (
      <section className="details" aria-live="polite">
        <div className="label">{t("cat.monster")}</div>
        <h2>{g.name}</h2>
        <div className="chips"><span className="stat">{g.el ? t("mob.el", { e: t("el." + g.el) }) : t("mob.noel")}</span></div>
        <div className="label">{t("mob.variants")}</div>
        <p className="desc note">{t("mob.note")}</p>
        <ul className="itemlist">
          {g.v.map((v) => (
            <li key={v[0]}><div className="ithead"><code>{v[0]}</code><span>{mobVariant(v, t, lang)}</span></div></li>
          ))}
        </ul>
        {maps && maps.appears[g.id] && (
          <>
            <div className="label">{t("map.appears")}</div>
            <ul className="itemlist maplist">
              {maps.appears[g.id].map(([m, c, a]) => (
                <li key={m.id}>
                  <button type="button" className="rowbtn" onClick={() => maps.onGoMap(m.k, g.id)}>
                    <span className="nm">{m.name}</span>
                    <span className="sub">{t("map.mob_row", { a, c })}</span>
                  </button>
                  <button type="button" className="mini" onClick={() => maps.onGoMap(m.k, g.id)} title={t("map.seeon")}>↗</button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="model">{t("det.model", { m: g.f.replace(".json", ""), a: g.anims.length ? g.anims.map((a) => t("mol." + a)).join(", ") : t("det.noanim") })}</div>
      </section>
    );
  }

  const who = t("who", { race: t("race." + dress.race), sex: t("who." + dress.sex) }) + (dress.cls ? ` (${t("cls." + dress.cls)})` : "");

  if (tab === "dress") {
    const cats = ["costume", "set", "weapon", "shield", "wing", "pet", "mount"];
    const src = { weapon: lists.wpn, shield: lists.shield };
    const chips = cats.map((c) => [c, nameOf(src[c] || lists[c], dress[c])]).filter((c) => c[1]);
    const head = nameOf(lists.costume, dress.costume) || nameOf(lists.set, dress.set) || t("det.starter");
    return (
      <section className="details" aria-live="polite">
        <div className="label">{t("det.dress", { who })}</div>
        <h2>{head}</h2>
        <div className="chips">
          {chips.length ? chips.map((c) => <span key={c[0]} className="chip"><b>{t("cat." + c[0])}</b>{c[1]}</span>) : <span className="chip">{t("det.nothing")}</span>}
        </div>
        {dress.costume != null && dress.set != null && <p className="desc">{t("det.costume")}</p>}
      </section>
    );
  }

  if (tab === "costume") {
    const c = lists.costume.find((x) => x.k === sel.costume);
    if (!c) return null;
    return (
      <section className="details" aria-live="polite">
        <div className="label">{t("cat.costume")} · {who}</div>
        <Heading g={c} />
        <div className="label">{t("det.items")}</div>
        <Items items={c.items || [[c.t, c.i, c.name]]} t={t} />
        <div className="btnrow"><button type="button" className="btn primary" onClick={() => onTry("costume", c.k)}>{t("btn.try")}</button></div>
      </section>
    );
  }

  if (tab === "set") {
    const g = gear && gear.set[sel.set];
    if (!g) return null;
    const code = charCode(dress.race, dress.cls, dress.sex);
    return (
      <section className="details" aria-live="polite">
        <div className="label">{t("cat.set")} · {who}</div>
        <h2>{g.name}</h2>
        {!g.f && <p className="desc">{t("det.accessory")}</p>}
        {g.f && !g.codes.includes(code) && <p className="desc">{t("det.norace", { who })}</p>}
        {g.syn.length > 0 && <><div className="label">{t("det.syn")}</div><Synergy syn={g.syn} t={t} /></>}
        <div className="label">{t("det.pieces")}</div>
        <Items items={g.items} t={t} gear />
        {g.f && <div className="btnrow"><button type="button" className="btn primary" onClick={() => onTry("set", g.k)}>{t("btn.try")}</button></div>}
      </section>
    );
  }

  if (tab === "weapon") {
    const g = gear && gear.weapon[sel.weapon];
    if (!g) return null;
    const cat = g.kind === "sh" ? "shield" : "weapon";
    return (
      <section className="details" aria-live="polite">
        <div className="label">{t("cat." + cat)} · {who}</div>
        <h2>{g.name}</h2>
        <p className="desc">{t("det.stance", { k: t("kind." + g.kind) })}</p>
        <div className="label">{t("det.items")}</div>
        <Items items={g.items} t={t} gear />
        <div className="model">{t("det.model", { m: g.entry, a: t("kind." + g.kind) })}</div>
        <div className="btnrow"><button type="button" className="btn primary" onClick={() => onTry(cat, g.k)}>{t("btn.try")}</button></div>
      </section>
    );
  }

  const g = catalog[sel[tab]];
  if (!g) return null;
  return (
    <section className="details" aria-live="polite">
      <div className="label">{t("cat." + g.cat)}{g.cat !== "pet" && !isTransform(g) && ` · ${who}`}</div>
      <Heading g={g} />
      {g.desc && <p className="desc">{g.desc}</p>}
      <div className="label">{t("det.items")}</div>
      <Items items={g.items} t={t} />
      <div className="model">{t("det.model", { m: g.entry, a: g.anims.length ? g.anims.map((a) => t("mol." + a)).join(", ") : t("det.noanim") })}</div>
      <div className="btnrow"><button type="button" className="btn primary" onClick={() => onTry(g.cat, g.k)}>{t("btn.try")}</button></div>
    </section>
  );
}
