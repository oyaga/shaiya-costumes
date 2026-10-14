import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TABS, charCode, raceClasses, LANG_IX, CLASSES, gearFits, norm } from "./catalog.js";
import { DATA_BASE, DATA_DATE, REPO_URL } from "./config.js";
import { LANGS, HTML_LANG, makeT, initialLang, saveLang } from "./i18n.js";
import Toolbar from "./components/Toolbar.jsx";
import List from "./components/List.jsx";
import DressForm from "./components/DressForm.jsx";
import Stage from "./components/Stage.jsx";
import DyePanel from "./components/DyePanel.jsx";
import Details from "./components/Details.jsx";
import RaceSex from "./components/RaceSex.jsx";
import Seg from "./components/Seg.jsx";

const RIDER_TABS = ["costume", "set", "weapon", "mount", "wing"];   // abas que mostram o item num personagem (raça/gênero à escolha)
const GEAR_TABS = ["set", "weapon"];                                // vêm de gear.json (carregado à parte)
const DYE_CATS = ["costume", "wing", "pet", "mount"];
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const getJSON = (path) => fetch(DATA_BASE + path).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });

// Troca nomes/descrições dos itens pelos do idioma (tabelas de texto do cliente). Sem tradução: fica o PT.
function localizeItems(items, tr) {
  if (!tr) return items;
  return items.map((x) => { const l = tr.items[`${x[0]}-${x[1]}`]; return l ? [x[0], x[1], l[0], x[3], l[1]] : x; });
}

export default function App() {
  const [lang, setLang] = useState(initialLang);
  const [tr, setTr] = useState(null);           // public/data/i18n/<lang>.json (null = português)
  const [search, setSearch] = useState(null);   // nomes nos 3 idiomas, para a busca
  const [data, setData] = useState(null);
  const [gear, setGear] = useState(null);       // gear.json: sets e armas (null = carregando, false = falhou)
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("dress");
  const [q, setQ] = useState("");
  const [cls, setCls] = useState(null);         // filtro de classe dos sets/armas (id de CLASSES ou null)
  const [motion, setMotion] = useState("idle");
  const [spin, setSpin] = useState(() => !reducedMotion());
  const [sel, setSel] = useState({ costume: 0, set: null, weapon: null, mount: null, wing: null, pet: null });   // seleção das abas de catálogo
  // cls = classe do personagem (escolhe o corpo: ver CODES em catalog.js). ?cls=mage&sex=f no endereço abre nela.
  const [dress, setDress] = useState(() => {
    const p = new URLSearchParams(location.search);
    const c = CLASSES.find((x) => x.id === p.get("cls")) || CLASSES[0];
    return { race: c.race, cls: c.id, sex: p.get("sex") === "f" ? "f" : "m", costume: null, set: null, weapon: null, shield: null, wing: null, pet: null, mount: null };
  });
  const [dye, setDye] = useState({ costume: null, wing: null, pet: null, mount: null });   // {h, s, v} ou null, por categoria
  const [dyeTarget, setDyeTarget] = useState("costume");
  const [scene, setScene] = useState(null);   // {anims, dyeKeys} da cena montada
  const [masks, setMasks] = useState(null);
  const t = useMemo(() => makeT(lang), [lang]);
  const li = LANG_IX[lang] ?? 0;

  // catálogo + estado inicial (hash e um visual de exemplo no provador)
  useEffect(() => {
    let dead = false;
    getJSON("catalog.json")
      .then((d) => {
        if (dead) return;
        const catalog = d.catalog.map((g, k) => ({ ...g, k }));
        const costumes = d.costumes.map((c, k) => ({ ...c, k, cat: "costume" }));
        const byCat = (c) => (c === "costume" ? costumes : catalog.filter((g) => g.cat === c));
        const pick = (name, list) => { const x = list.find((i) => norm(i.name).includes(norm(name))); return x ? x.k : null; };
        setDress((s) => ({ ...s, costume: pick("Bobo", costumes), wing: pick("Pesadelo antes", byCat("wing")), pet: pick("Espantalho de Halloween", byCat("pet")) }));
        const first = (c) => (byCat(c)[0] ? byCat(c)[0].k : null);
        const next = { costume: 0, set: null, weapon: null, mount: first("mount"), wing: first("wing"), pet: first("pet") };
        const h = location.hash.slice(1), m = h.match(/^(costume|set|weapon|mount|wing|pet)-(\d+)$/);
        if (m) { setTab(m[1]); next[m[1]] = +m[2]; }
        else if (TABS.includes(h)) setTab(h);
        setSel(next);
        setData({ catalog, costumes, chars: d.chars });
      })
      .catch((e) => { if (!dead) setError(e); });
    getJSON("i18n/search.json").then(setSearch).catch(() => { /* busca fica só em PT */ });
    getJSON("gear.json").then((g) => { if (!dead) setGear(g); }).catch(() => { if (!dead) setGear(false); });
    return () => { dead = true; };
  }, []);

  // idioma: textos dos itens + <html lang> + lembra a escolha
  useEffect(() => {
    saveLang(lang);
    document.documentElement.lang = HTML_LANG[lang];
    if (lang === "pt") { setTr(null); return undefined; }
    let dead = false;
    getJSON(`i18n/${lang}.json`).then((j) => { if (!dead) setTr(j); }).catch(() => { if (!dead) setTr(null); });
    return () => { dead = true; };
  }, [lang]);

  // catálogo no idioma escolhido (mesmos índices k); hay = nomes nos 3 idiomas
  const loc = useMemo(() => {
    if (!data) return null;
    const mk = (rows, kind) => rows.map((g, k) => {
      const l = tr && tr[kind][k];
      const items = localizeItems(g.items || [[g.t, g.i, g.name]], tr);
      const hay = norm([g.name, ...(g.items || []).map((x) => x[2]), search ? search[kind][k] : ""].join(" "));
      return { ...g, name: l ? l.name : g.name, desc: l && l.desc != null ? l.desc : g.desc, items, hay };
    });
    return { catalog: mk(data.catalog, "catalog"), costumes: mk(data.costumes, "costumes") };
  }, [data, tr, search]);

  // sets e armas: gear.json já traz nome/descrição em [pt, es, en]; nome de set só existe em inglês no cliente
  const gearL = useMemo(() => {
    if (!gear) return null;
    const it = (x) => [x[0], x[1], x[2][li] || x[2][0], x[3], x[4][li] || x[4][0]];
    const names = (g) => g.items.flatMap((x) => x[2]);
    return {
      set: gear.sets.map((g, k) => ({ ...g, k, cat: "set", items: g.items.map(it), hay: norm([g.name, ...names(g)].join(" ")) })),
      weapon: gear.weapons.map((g, k) => ({ ...g, k, cat: "weapon", name: g.name[li] || g.name[0], items: g.items.map(it), hay: norm([...g.name, ...names(g)].join(" ")) })),
    };
  }, [gear, li]);

  // ordem alfabética do idioma escolhido (ignora o prefixo [SP]/(SP))
  const lists = useMemo(() => {
    if (!loc) return null;
    const key = (g) => g.name.replace(/^[[(]SP[\])]\s*/i, "");
    const sorted = (a) => [...a].sort((x, y) => key(x).localeCompare(key(y), lang, { sensitivity: "base" }));
    const weapons = gearL ? sorted(gearL.weapon) : [];
    return {
      costume: sorted(loc.costumes),
      set: gearL ? sorted(gearL.set) : [],
      weapon: weapons,
      wpn: weapons.filter((g) => g.kind !== "sh"),
      shield: weapons.filter((g) => g.kind === "sh"),
      mount: sorted(loc.catalog.filter((g) => g.cat === "mount")),
      wing: sorted(loc.catalog.filter((g) => g.cat === "wing")),
      pet: sorted(loc.catalog.filter((g) => g.cat === "pet")),
    };
  }, [loc, gearL, lang]);

  // aba de set/arma aberta sem seleção (antes do gear.json chegar): escolhe o primeiro da lista
  useEffect(() => {
    if (!lists) return;
    for (const c of GEAR_TABS) if (sel[c] == null && lists[c][0]) setSel((s) => ({ ...s, [c]: lists[c][0].k }));
  }, [lists, sel]);

  // endereço reflete o item aberto (#mount-12, #dress…)
  useEffect(() => {
    if (!data) return;
    const h = tab === "dress" ? "dress" : sel[tab] != null ? `${tab}-${sel[tab]}` : tab;
    history.replaceState(null, "", "#" + h);
  }, [data, tab, sel]);

  const clsObj = cls ? CLASSES.find((c) => c.id === cls) : null;
  const rows = useMemo(() => {
    if (!lists || tab === "dress") return [];
    const nq = norm(q.trim());
    const byCls = clsObj && GEAR_TABS.includes(tab);
    return lists[tab].filter((g) => (!nq || g.hay.includes(nq)) && (!byCls || gearFits(g, clsObj)));
  }, [lists, tab, q, clsObj]);

  // ao escolher uma classe: abre o primeiro set de armadura e a primeira arma dela (só na troca, não a cada busca)
  const clsApplied = useRef(null);
  useEffect(() => {
    if (!lists || !clsObj || !lists.set.length || clsApplied.current === clsObj.id) return;
    clsApplied.current = clsObj.id;
    const sets = lists.set.filter((g) => gearFits(g, clsObj));
    const set = sets.find((g) => g.f) || sets[0];
    const wpn = lists.weapon.find((g) => gearFits(g, clsObj));
    setSel((s) => ({ ...s, set: set ? set.k : s.set, weapon: wpn ? wpn.k : s.weapon }));
  }, [clsObj, lists]);

  // o que a vitrine mostra
  const spec = useMemo(() => {
    if (!data) return null;
    if (tab === "pet") {   // pet aparece sozinho
      const g = data.catalog[sel.pet];
      return g ? { kind: "single", cat: "pet", file: "m/" + g.f } : null;
    }
    const code = charCode(dress.race, dress.cls, dress.sex);
    const s = { kind: "char", code, race: dress.race, costume: null };
    const setPath = (k) => { const g = gear && k != null ? gear.sets[k] : null; return g && g.f && g.codes.includes(code) ? `s/${g.f}/${code}.json` : null; };
    const wpn = (k) => { const g = gear && k != null ? gear.weapons[k] : null; return g ? { f: "w/" + g.f, kind: g.kind } : null; };
    if (tab === "mount" || tab === "wing") {   // corpo base (armadura inicial) + o item
      const g = data.catalog[sel[tab]];
      if (!g) return null;
      s[tab] = "m/" + g.f;
      return s;
    }
    if (tab === "set") { if (!gear) return null; s.set = setPath(sel.set); return s; }
    if (tab === "weapon") {
      const w = wpn(sel.weapon);
      if (!w) return gear ? s : null;
      if (w.kind === "sh") s.shield = w; else s.weapon = w;
      return s;
    }
    const costumeK = tab === "costume" ? sel.costume : dress.costume;
    const c = costumeK != null ? data.costumes.find((x) => x.k === costumeK) : null;
    s.costume = c ? `k/${c.f}/${code}.json` : null;
    if (tab === "dress") {
      for (const f of ["wing", "pet", "mount"]) { const k = dress[f]; if (k != null && data.catalog[k]) s[f] = "m/" + data.catalog[k].f; }
      if (!s.costume) s.set = setPath(dress.set);   // a fantasia cobre a armadura, como no jogo
      const w = wpn(dress.weapon), sh = wpn(dress.shield);
      if (w) s.weapon = w;
      if (sh) s.shield = sh;
    }
    return s;
  }, [data, gear, tab, sel, dress]);

  const dyeTargets = tab === "dress" ? DYE_CATS.filter((c) => dress[c] != null) : tab === "costume" ? ["costume"] : DYE_CATS.includes(tab) ? [tab] : [];
  const target = dyeTargets.includes(dyeTarget) ? dyeTarget : dyeTargets[0];
  const hasMask = !!(scene && masks && target && (scene.dyeKeys[target] || []).some((k) => masks[k]));

  const onTab = useCallback((c) => { setTab(c); setQ(""); }, []);
  // escolher a classe já mostra o item na raça e no corpo dela (o gênero fica)
  const onCls = useCallback((id) => {
    setCls(id);
    if (!id) clsApplied.current = null;
    const c = CLASSES.find((x) => x.id === id);
    if (c) setDress((s) => ({ ...s, race: c.race, cls: c.id }));
  }, []);
  // trocar a raça mantém o tipo de corpo quando dá (Mago → Pagão), senão cai na 1ª classe da raça
  const onDress = useCallback((patch) => setDress((s) => {
    const n = { ...s, ...patch };
    if (patch.race && patch.race !== s.race && !patch.cls) {
      const body = (CLASSES.find((c) => c.id === s.cls) || {}).body || 0;
      const opts = raceClasses(patch.race);
      n.cls = (opts.find((c) => c.body === body) || opts[0]).id;
    }
    return n;
  }), []);
  const onTry = useCallback((cat, k) => { setDress((s) => ({ ...s, [cat]: k })); setTab("dress"); }, []);
  const onDye = useCallback((cat, p) => setDye((s) => ({ ...s, [cat]: p })), []);
  const onScene = useCallback((info) => setScene(info), []);
  const onMasks = useCallback((m) => setMasks(m), []);

  const gearWait = GEAR_TABS.includes(tab) && !gear;
  const counts = Object.fromEntries(["costume", "set", "weapon", "mount", "wing", "pet"].map((c) => [c, GEAR_TABS.includes(c) && !gear ? "…" : lists ? lists[c].length : 0]));

  return (
    <div className="wrap">
      <header>
        <div className="toprow">
          <div className="eyebrow">{t("eyebrow", { date: DATA_DATE })}</div>
          <Seg className="langs" label={t("lang")} options={LANGS} value={lang} onChange={setLang} />
        </div>
        <h1>Galeria Shaiya</h1>
        <p className="lede">{t("lede")}</p>
      </header>

      {error && <p className="notice">{t("load.error", { e: String(error.message || error) })}</p>}
      {!data && !error && <p className="notice">{t("load.catalog")}</p>}

      {data && lists && (
        <>
          <Toolbar t={t} tab={tab} onTab={onTab} q={q} onQ={setQ} cls={cls} onCls={onCls} counts={counts} />
          <div className="layout">
            <div className="leftcol">
              {tab === "dress"
                ? <DressForm t={t} dress={dress} lists={lists} gear={!!gear} onChange={onDress} />
                : gearWait
                  ? <p className="notice">{gear === false ? t("load.error", { e: "gear.json" }) : t("load.gear")}</p>
                  : <List t={t} tab={tab} rows={rows} cur={sel[tab]} onSelect={(k) => setSel((s) => ({ ...s, [tab]: k }))} />}
            </div>
            <div className="viewcol">
              <Stage t={t} spec={spec} motion={motion} spin={spin} dye={dye} anims={scene && scene.anims} onMotion={setMotion} onSpin={setSpin} onScene={onScene} onMasks={onMasks} />
              {RIDER_TABS.includes(tab) && <RaceSex t={t} dress={dress} onDress={onDress} />}
              {dyeTargets.length > 0 && <DyePanel t={t} targets={dyeTargets} target={target} onTarget={setDyeTarget} dye={dye} onChange={onDye} hasMask={hasMask} />}
              {!gearWait && <Details t={t} tab={tab} catalog={loc.catalog} lists={lists} gear={gearL} sel={sel} dress={dress} onTry={onTry} />}
            </div>
          </div>
        </>
      )}

      <footer className="foot">
        <p>{t("foot.hint")}</p>
        <p>{t("foot.legal")} <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{t("foot.code")}</a></p>
      </footer>
    </div>
  );
}
