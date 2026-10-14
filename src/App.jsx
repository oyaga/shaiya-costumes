import { useCallback, useEffect, useMemo, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { TABS, CODE, norm } from "./catalog.js";
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

const RIDER_TABS = ["costume", "mount", "wing"];   // abas que mostram o item num personagem (raça/gênero à escolha)
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
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("dress");
  const [q, setQ] = useState("");
  const [motion, setMotion] = useState("idle");
  const [spin, setSpin] = useState(() => !reducedMotion());
  const [sel, setSel] = useState({ costume: 0, mount: null, wing: null, pet: null });   // seleção das abas de catálogo
  const [dress, setDress] = useState({ race: "hu", sex: "m", costume: null, wing: null, pet: null, mount: null });
  const [dye, setDye] = useState({ costume: null, wing: null, pet: null, mount: null });   // {h, s, v} ou null, por categoria
  const [dyeTarget, setDyeTarget] = useState("costume");
  const [scene, setScene] = useState(null);   // {anims, dyeKeys} da cena montada
  const [masks, setMasks] = useState(null);
  const t = useMemo(() => makeT(lang), [lang]);

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
        const next = { costume: 0, mount: first("mount"), wing: first("wing"), pet: first("pet") };
        const h = location.hash.slice(1), m = h.match(/^(costume|mount|wing|pet)-(\d+)$/);
        if (m) { setTab(m[1]); next[m[1]] = +m[2]; }
        else if (TABS.includes(h)) setTab(h);
        setSel(next);
        setData({ catalog, costumes, chars: d.chars });
      })
      .catch((e) => { if (!dead) setError(e); });
    getJSON("i18n/search.json").then(setSearch).catch(() => { /* busca fica só em PT */ });
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

  // ordem alfabética do idioma escolhido (ignora o prefixo [SP]/(SP))
  const lists = useMemo(() => {
    if (!loc) return null;
    const key = (g) => g.name.replace(/^[[(]SP[\])]\s*/i, "");
    const sorted = (a) => [...a].sort((x, y) => key(x).localeCompare(key(y), lang, { sensitivity: "base" }));
    return {
      costume: sorted(loc.costumes),
      mount: sorted(loc.catalog.filter((g) => g.cat === "mount")),
      wing: sorted(loc.catalog.filter((g) => g.cat === "wing")),
      pet: sorted(loc.catalog.filter((g) => g.cat === "pet")),
    };
  }, [loc, lang]);

  // endereço reflete o item aberto (#mount-12, #dress…)
  useEffect(() => {
    if (!data) return;
    const h = tab === "dress" ? "dress" : sel[tab] != null ? `${tab}-${sel[tab]}` : tab;
    history.replaceState(null, "", "#" + h);
  }, [data, tab, sel]);

  const rows = useMemo(() => {
    if (!lists || tab === "dress") return [];
    const nq = norm(q.trim());
    return lists[tab].filter((g) => !nq || g.hay.includes(nq));
  }, [lists, tab, q]);

  // o que a vitrine mostra
  const spec = useMemo(() => {
    if (!data) return null;
    if (tab === "pet") {   // pet aparece sozinho
      const g = data.catalog[sel.pet];
      return g ? { kind: "single", cat: "pet", file: "m/" + g.f } : null;
    }
    const code = CODE[dress.race][dress.sex];
    const s = { kind: "char", code, race: dress.race, costume: null };
    if (tab === "mount" || tab === "wing") {   // corpo base (armadura inicial) + o item
      const g = data.catalog[sel[tab]];
      if (!g) return null;
      s[tab] = "m/" + g.f;
      return s;
    }
    const costumeK = tab === "costume" ? sel.costume : dress.costume;
    const c = costumeK != null ? data.costumes.find((x) => x.k === costumeK) : null;
    s.costume = c ? `k/${c.f}/${code}.json` : null;
    if (tab === "dress") for (const f of ["wing", "pet", "mount"]) { const k = dress[f]; if (k != null && data.catalog[k]) s[f] = "m/" + data.catalog[k].f; }
    return s;
  }, [data, tab, sel, dress]);

  const dyeTargets = tab === "dress" ? DYE_CATS.filter((c) => dress[c] != null) : tab === "costume" ? ["costume"] : [tab];
  const target = dyeTargets.includes(dyeTarget) ? dyeTarget : dyeTargets[0];
  const hasMask = !!(scene && masks && (scene.dyeKeys[target] || []).some((k) => masks[k]));

  const onTab = useCallback((c) => { setTab(c); setQ(""); }, []);
  const onDress = useCallback((patch) => setDress((s) => ({ ...s, ...patch })), []);
  const onTry = useCallback((cat, k) => { setDress((s) => ({ ...s, [cat]: k })); setTab("dress"); }, []);
  const onDye = useCallback((cat, p) => setDye((s) => ({ ...s, [cat]: p })), []);
  const onScene = useCallback((info) => setScene(info), []);
  const onMasks = useCallback((m) => setMasks(m), []);

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
          <Toolbar t={t} tab={tab} onTab={onTab} q={q} onQ={setQ} counts={{ costume: lists.costume.length, mount: lists.mount.length, wing: lists.wing.length, pet: lists.pet.length }} />
          <div className="layout">
            <div className="leftcol">
              {tab === "dress"
                ? <DressForm t={t} dress={dress} lists={lists} onChange={onDress} />
                : <List t={t} tab={tab} rows={rows} cur={sel[tab]} onSelect={(k) => setSel((s) => ({ ...s, [tab]: k }))} />}
            </div>
            <div className="viewcol">
              <Stage t={t} spec={spec} motion={motion} spin={spin} dye={dye} anims={scene && scene.anims} onMotion={setMotion} onSpin={setSpin} onScene={onScene} onMasks={onMasks} />
              {RIDER_TABS.includes(tab) && <RaceSex t={t} dress={dress} onDress={onDress} />}
              <DyePanel t={t} targets={dyeTargets} target={target} onTarget={setDyeTarget} dye={dye} onChange={onDye} hasMask={hasMask} />
              <Details t={t} tab={tab} catalog={loc.catalog} lists={lists} sel={sel} dress={dress} onTry={onTry} />
            </div>
          </div>
        </>
      )}

      <footer className="foot">
        <p>{t("foot.hint")}</p>
        <p>{t("foot.legal")} <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{t("foot.code")}</a></p>
      </footer>
      <Analytics />
    </div>
  );
}
