import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TABS, charCode, raceClasses, LANG_IX, CLASSES, gearFits, norm, visualName, isTransform, mapName } from "./catalog.js";
import { DATA_BASE, DATA_DATE, REPO_URL, ROOT_PATH } from "./config.js";
import { LANGS, HTML_LANG, makeT, initialLang, saveLang } from "./i18n.js";
import { ROUTE_CATS, parseRoute, itemId, itemPath, catPath, homePath } from "./routes.js";
import Toolbar from "./components/Toolbar.jsx";
import List from "./components/List.jsx";
import DressForm from "./components/DressForm.jsx";
import Stage from "./components/Stage.jsx";
import DyePanel from "./components/DyePanel.jsx";
import Details from "./components/Details.jsx";
import RaceSex from "./components/RaceSex.jsx";
import Seg from "./components/Seg.jsx";
import MapView from "./components/MapView.jsx";

const RIDER_TABS = ["costume", "set", "weapon", "mount", "wing"];   // abas que mostram o item num personagem (raça/gênero à escolha)
const GEAR_TABS = ["set", "weapon"];                                // vêm de gear.json (carregado à parte)
const LAZY_TABS = [...GEAR_TABS, "monster", "map"];                 // + monsters.json e maps.json: listas que chegam depois do catálogo
const DYE_CATS = ["costume", "wing", "pet", "mount"];
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const getJSON = (path) => fetch(DATA_BASE + path).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
// Página de item (routes.js): idioma, aba e item vêm do endereço em que o site foi aberto.
const START = parseRoute(location.pathname.startsWith(ROOT_PATH) ? location.pathname.slice(ROOT_PATH.length) : "");

// Troca nomes/descrições dos itens pelos do idioma (tabelas de texto do cliente). Sem tradução: fica o PT.
function localizeItems(items, tr) {
  if (!tr) return items;
  return items.map((x) => { const l = tr.items[`${x[0]}-${x[1]}`]; return l ? [x[0], x[1], l[0], x[3], l[1]] : x; });
}

export default function App() {
  const [lang, setLang] = useState(() => START.lang || initialLang());
  const routeRef = useRef(START.cat ? START : null);   // item do endereço ainda não aberto (sets/armas esperam o gear.json)
  const [tr, setTr] = useState(null);           // public/data/i18n/<lang>.json (null = português)
  const [search, setSearch] = useState(null);   // nomes nos 3 idiomas, para a busca
  const [data, setData] = useState(null);
  const [gear, setGear] = useState(null);       // gear.json: sets e armas (null = carregando, false = falhou)
  const [mobs, setMobs] = useState(null);       // monsters.json: monstros (null = carregando, false = falhou)
  const [maps, setMaps] = useState(null);       // maps.json: mapas (null = carregando, false = falhou)
  const [hl, setHl] = useState(null);           // monstro (id do grupo) destacado no mapa
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("dress");
  const [q, setQ] = useState("");
  const [cls, setCls] = useState(null);         // filtro de classe dos sets/armas (id de CLASSES ou null)
  const [motion, setMotion] = useState("idle");
  const [spin, setSpin] = useState(() => !reducedMotion());
  // comparar: dois lados A e B lado a lado; o lado "ativo" recebe os cliques da lista, do provador, da pintura e da raça/classe.
  const [cmp, setCmp] = useState(false);
  const [side, setSide] = useState("A");
  const [sel, setSel] = useState({ costume: 0, set: null, weapon: null, mount: null, wing: null, pet: null, monster: null, map: null });   // seleção das abas de catálogo
  const [selB, setSelB] = useState({ costume: 0, set: null, weapon: null, mount: null, wing: null, pet: null, monster: null, map: null });
  // Sem ?cls=/?sex= no endereço, o provador abre com classe e gênero sorteados (e visual sorteado, ver abaixo);
  // com eles, abre exatamente na classe/gênero pedidos.
  const initialDress = () => {
    const p = new URLSearchParams(location.search);
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    const c = CLASSES.find((x) => x.id === p.get("cls")) || (p.has("cls") ? CLASSES[0] : rnd(CLASSES));
    const sex = p.get("sex") === "f" || p.get("sex") === "m" ? p.get("sex") : rnd(["m", "f"]);
    return { race: c.race, cls: c.id, sex, costume: null, set: null, weapon: null, shield: null, wing: null, pet: null, mount: null };
  };
  // cls = classe do personagem (escolhe o corpo: ver CODES em catalog.js). ?cls=mage&sex=f no endereço abre nela.
  const [dress, setDress] = useState(initialDress);
  const [dressB, setDressB] = useState(() => dress);   // o lado B de Comparar começa igual ao A
  const [dye, setDye] = useState({ costume: null, wing: null, pet: null, mount: null });   // {h, s, v} ou null, por categoria
  const [dyeB, setDyeB] = useState({ costume: null, wing: null, pet: null, mount: null });
  const [dyeTarget, setDyeTarget] = useState("costume");
  const [scene, setScene] = useState(null);   // {anims, dyeKeys} da cena montada
  const [sceneB, setSceneB] = useState(null);
  const [masks, setMasks] = useState(null);
  const [masksB, setMasksB] = useState(null);
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
        // provador de abertura: fantasia, asa e pet sorteados a cada visita
        const rndK = (list) => (list.length ? list[Math.floor(Math.random() * list.length)].k : null);
        const dressSeed = { costume: rndK(costumes), wing: rndK(byCat("wing")), pet: rndK(byCat("pet")) };
        setDress((s) => ({ ...s, ...dressSeed }));
        setDressB((s) => ({ ...s, ...dressSeed }));
        const first = (c) => (byCat(c)[0] ? byCat(c)[0].k : null);
        const next = { costume: 0, set: null, weapon: null, mount: first("mount"), wing: first("wing"), pet: first("pet"), monster: null, map: null };
        const h = location.hash.slice(1), m = h.match(/^(costume|set|weapon|mount|wing|pet)-(\d+)$/);
        if (m) { setTab(m[1]); next[m[1]] = +m[2]; }
        else if (TABS.includes(h)) setTab(h);
        const r = routeRef.current;
        if (r) {
          setTab(r.cat);
          if (!LAZY_TABS.includes(r.cat)) {
            const g = r.id && byCat(r.cat).find((x) => itemId(r.cat, x) === r.id);
            if (g) next[r.cat] = g.k;
            routeRef.current = null;
          }
        }
        setSel(next);
        setSelB(next);
        setData({ catalog, costumes, chars: d.chars });
      })
      .catch((e) => { if (!dead) setError(e); });
    getJSON("i18n/search.json").then(setSearch).catch(() => { /* busca fica só em PT */ });
    getJSON("gear.json").then((g) => { if (!dead) setGear(g); }).catch(() => { if (!dead) setGear(false); });
    getJSON("monsters.json").then((j) => { if (!dead) setMobs(j); }).catch(() => { if (!dead) setMobs(false); });
    getJSON("maps.json").then((j) => { if (!dead) setMaps(j); }).catch(() => { if (!dead) setMaps(false); });
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
      const own = l ? l.name : g.name;
      // asa/pet: um visual com vários níveis e apelidos vira "Mochi / Tama" (o endereço segue o nome do cliente).
      // Montaria fica de fora: os itens dela são pedras de invocação de montarias diferentes.
      return { ...g, name: g.cat === "wing" || g.cat === "pet" ? visualName(own, items) : own, slug: own, desc: l && l.desc != null ? l.desc : g.desc, items, hay };
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

  // monstros: monsters.json traz o nome em [pt, es, en] (tabelas DBMonsterText do cliente)
  const mobL = useMemo(() => (mobs
    ? mobs.mobs.map((g, k) => ({ ...g, k, cat: "monster", name: g.name[li] || g.name[0], hay: norm(g.name.join(" ")) }))
    : null), [mobs, li]);

  // mapas: maps.json (índice) + nomes do idioma; a busca acha pelo nome em qualquer idioma, pelo número e pelas regiões
  const mapL = useMemo(() => (maps
    ? maps.maps.map((m, k) => ({ ...m, k, cat: "map", name: mapName(m, t, li), hay: norm([...(m.name || []), String(m.id), ...m.reg, "mapa map"].join(" ")) }))
    : null), [maps, li, t]);
  const mapsById = useMemo(() => (mapL ? Object.fromEntries(mapL.map((m) => [m.id, m])) : {}), [mapL]);
  const mobById = useMemo(() => (mobL ? Object.fromEntries(mobL.map((g) => [g.id, { ...g, lv: [Math.min(...g.v.map((v) => v[1])), Math.max(...g.v.map((v) => v[1]))] }])) : {}), [mobL]);
  // monstro → mapas onde aparece, do que tem mais para o que tem menos
  const appears = useMemo(() => {
    const o = {};
    if (mapL) for (const m of mapL) for (const [id, c, a] of m.m) (o[id] ||= []).push([m, c, a]);
    for (const id in o) o[id].sort((x, y) => y[1] - x[1]);
    return o;
  }, [mapL]);

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
      monster: mobL ? sorted(mobL) : [],
      map: mapL || [],
    };
  }, [loc, gearL, mobL, mapL, lang]);

  // set/arma/monstro do endereço: abre quando o gear.json / monsters.json chega (null = carregando, false = falhou)
  useEffect(() => {
    const r = routeRef.current;
    if (!r || !LAZY_TABS.includes(r.cat)) return;
    const src = r.cat === "monster" ? mobs : r.cat === "map" ? maps : gear;
    if (src == null) return;
    routeRef.current = null;
    const arr = !src ? [] : r.cat === "set" ? src.sets : r.cat === "weapon" ? src.weapons : r.cat === "map" ? src.maps : src.mobs;
    const k = r.id ? arr.findIndex((g) => itemId(r.cat, g) === r.id) : -1;
    if (k >= 0) setSel((s) => ({ ...s, [r.cat]: k }));
  }, [gear, mobs, maps]);

  // aba de set/arma/monstro sem seleção (antes da lista chegar): escolhe o primeiro da lista. Confere o estado
  // ATUAL (não o do render) para não passar por cima do item que o endereço acabou de abrir.
  useEffect(() => {
    if (!lists) return;
    for (const c of LAZY_TABS) {
      const first = lists[c][0];
      if (!first) continue;
      setSel((s) => (s[c] == null ? { ...s, [c]: first.k } : s));
      setSelB((s) => (s[c] == null ? { ...s, [c]: first.k } : s));
    }
  }, [lists]);

  // endereço e título acompanham o item aberto do lado A: página do item (routes.js), da categoria ou a inicial
  useEffect(() => {
    if (!lists || routeRef.current) return;
    let path = homePath(lang), title = t("seo.home_title");
    if (ROUTE_CATS.includes(tab)) {
      const g = sel[tab] != null ? lists[tab].find((x) => x.k === sel[tab]) : null;
      if (g) {
        path = itemPath(lang, tab, g.slug || g.name, itemId(tab, g));
        title = t(tab === "map" ? "seo.item_title_map" : "seo.item_title", { name: g.name, cat: t("cat." + tab) });
      } else {
        path = catPath(lang, tab);
        title = t(tab === "map" ? "seo.cat_title_map" : "seo.cat_title", { tab: t("tab." + tab) });
      }
    }
    history.replaceState(null, "", ROOT_PATH + path + location.search + (tab === "dress" ? "#dress" : ""));
    document.title = title;
  }, [lists, tab, sel, lang, t]);

  const clsObj = cls ? CLASSES.find((c) => c.id === cls) : null;
  const rows = useMemo(() => {
    if (!lists || tab === "dress") return [];
    const nq = norm(q.trim());
    const byCls = clsObj && GEAR_TABS.includes(tab);
    return lists[tab].filter((g) => (!nq || g.hay.includes(nq)) && (!byCls || gearFits(g, clsObj)));
  }, [lists, tab, q, clsObj]);

  // o que a vitrine mostra (A ou B — a fórmula é a mesma, muda a seleção/provador do lado)
  const buildSpec = useCallback((selX, dressX) => {
    if (!data) return null;
    if (tab === "pet") {
      const g = data.catalog[selX.pet];
      return g ? { kind: "single", cat: "pet", file: "m/" + g.f } : null;
    }
    if (tab === "map") return null;   // o mapa tem a própria vista (MapView), sem 3D
    if (tab === "monster") {   // como o pet: o modelo sozinho (mob/NNN.json, um arquivo por modelo do Monster.MON)
      const g = mobs && selX.monster != null ? mobs.mobs[selX.monster] : null;
      return g ? { kind: "single", cat: "monster", file: "mob/" + g.f } : null;
    }
    const code = charCode(dressX.race, dressX.cls, dressX.sex);
    const s = { kind: "char", code, race: dressX.race, costume: null };
    const setPath = (k) => { const g = gear && k != null ? gear.sets[k] : null; return g && g.f && g.codes.includes(code) ? `s/${g.f}/${code}.json` : null; };
    const wpn = (k) => { const g = gear && k != null ? gear.weapons[k] : null; return g ? { f: "w/" + g.f, kind: g.kind } : null; };
    if (tab === "mount" || tab === "wing") {
      const g = data.catalog[selX[tab]];
      if (!g) return null;
      if (isTransform(g)) return { kind: "single", cat: "mount", file: "m/" + g.f };   // transformação: só a criatura, sem o avatar
      s[tab] = "m/" + g.f;
      return s;
    }
    if (tab === "set") { if (!gear) return null; s.set = setPath(selX.set); return s; }
    if (tab === "weapon") {
      const w = wpn(selX.weapon);
      if (!w) return gear ? s : null;
      if (w.kind === "sh") s.shield = w; else s.weapon = w;
      return s;
    }
    const costumeK = tab === "costume" ? selX.costume : dressX.costume;
    const c = costumeK != null ? data.costumes.find((x) => x.k === costumeK) : null;
    s.costume = c ? `k/${c.f}/${code}.json` : null;
    if (tab === "dress") {
      const mt = dressX.mount != null ? data.catalog[dressX.mount] : null;
      if (isTransform(mt)) return { kind: "single", cat: "mount", file: "m/" + mt.f };   // a transformação substitui o personagem
      for (const f of ["wing", "pet", "mount"]) { const k = dressX[f]; if (k != null && data.catalog[k]) s[f] = "m/" + data.catalog[k].f; }
      if (s.pet) s.petScale = data.catalog[dressX.pet].sc || 1;   // escala do jogo (pets: modelo grande × escala pequena)
      if (!s.costume) s.set = setPath(dressX.set);   // a fantasia cobre a armadura, como no jogo
      const w = wpn(dressX.weapon), sh = wpn(dressX.shield);
      if (w) s.weapon = w;
      if (sh) s.shield = sh;
    }
    return s;
  }, [data, gear, mobs, tab]);
  const spec = useMemo(() => buildSpec(sel, dress), [buildSpec, sel, dress]);
  const specB = useMemo(() => cmp ? buildSpec(selB, dressB) : null, [cmp, buildSpec, selB, dressB]);

  // "lado ativo": tudo o que o usuário clica fora da vitrine (lista, provador, pintura, raça/classe) vai pra cá.
  const isB = cmp && side === "B";
  const curSel = isB ? selB : sel;
  const setCurSel = isB ? setSelB : setSel;
  const curDress = isB ? dressB : dress;
  const setCurDress = isB ? setDressB : setDress;
  const curDye = isB ? dyeB : dye;
  const curScene = isB ? sceneB : scene;
  const curMasks = isB ? masksB : masks;

  // ao escolher uma classe: abre o primeiro set e a primeira arma dela (só no lado ativo)
  const clsApplied = useRef(null);
  useEffect(() => {
    if (!lists || !clsObj || !lists.set.length) return;
    const key = clsObj.id + "/" + (isB ? "B" : "A");
    if (clsApplied.current === key) return;
    clsApplied.current = key;
    const sets = lists.set.filter((g) => gearFits(g, clsObj));
    const set = sets.find((g) => g.f) || sets[0];
    const wpn = lists.weapon.find((g) => gearFits(g, clsObj));
    setCurSel((s) => ({ ...s, set: set ? set.k : s.set, weapon: wpn ? wpn.k : s.weapon }));
  }, [clsObj, lists, isB, setCurSel]);

  const dyeTargets = tab === "dress" ? DYE_CATS.filter((c) => curDress[c] != null) : tab === "costume" ? ["costume"] : DYE_CATS.includes(tab) ? [tab] : [];
  const target = dyeTargets.includes(dyeTarget) ? dyeTarget : dyeTargets[0];
  const hasMask = !!(curScene && curMasks && target && (curScene.dyeKeys[target] || []).some((k) => curMasks[k]));

  // atacando/morrendo só existem nos monstros: fora da aba, volta para parado
  const onTab = useCallback((c) => {
    setTab(c); setQ("");
    if (c !== "monster") setMotion((m) => (m === "attack" || m === "die" ? "idle" : m));
  }, []);
  const onCmp = useCallback((v) => {
    setCmp(v);
    if (!v) setSide("A");
  }, []);
  // troca os dois lados inteiros (item, provador e pintura); as vitrines remontam sozinhas pelo spec novo
  const onSwap = useCallback(() => {
    setSel(selB); setSelB(sel);
    setDress(dressB); setDressB(dress);
    setDye(dyeB); setDyeB(dye);
  }, [sel, selB, dress, dressB, dye, dyeB]);
  // escolher a classe já mostra o item na raça e no corpo dela (o gênero fica), no lado ativo
  const onCls = useCallback((id) => {
    setCls(id);
    if (!id) clsApplied.current = null;
    const c = CLASSES.find((x) => x.id === id);
    if (c) setCurDress((s) => ({ ...s, race: c.race, cls: c.id }));
  }, [setCurDress]);
  // trocar a raça mantém o tipo de corpo quando dá (Mago → Pagão), senão cai na 1ª classe da raça
  const onDress = useCallback((patch) => setCurDress((s) => {
    const n = { ...s, ...patch };
    if (patch.race && patch.race !== s.race && !patch.cls) {
      const body = (CLASSES.find((c) => c.id === s.cls) || {}).body || 0;
      const opts = raceClasses(patch.race);
      n.cls = (opts.find((c) => c.body === body) || opts[0]).id;
    }
    return n;
  }), [setCurDress]);
  const onTry = useCallback((cat, k) => { setCurDress((s) => ({ ...s, [cat]: k })); setTab("dress"); }, [setCurDress]);
  const setCurDye = isB ? setDyeB : setDye;
  const onDye = useCallback((cat, p) => setCurDye((s) => ({ ...s, [cat]: p })), [setCurDye]);
  const onSelect = useCallback((k) => setCurSel((s) => ({ ...s, [tab]: k })), [setCurSel, tab]);

  const lazySrc = (c) => (c === "monster" ? mobs : c === "map" ? maps : gear);   // null = carregando, false = falhou
  // monstro ↔ mapa: "Ver no mapa" abre o mapa com o monstro destacado; "Ver monstro" faz o caminho de volta
  const onGoMap = useCallback((k, gid) => { setTab("map"); setQ(""); setSel((s) => ({ ...s, map: k })); setHl(gid); }, []);
  const onGoMob = useCallback((k) => { setTab("monster"); setQ(""); setSel((s) => ({ ...s, monster: k })); }, []);
  const curMap = tab === "map" && mapL ? mapL.find((x) => x.k === curSel.map) : null;
  const hlHere = curMap && hl != null && curMap.m.some((x) => x[0] === hl) ? hl : null;   // só destaca onde o monstro aparece
  const mapsApi = { byId: mapsById, mobById, appears, hl: hlHere, onHl: setHl, onGoMap, onGoMob };
  const lazyWait = LAZY_TABS.includes(tab) && !lazySrc(tab);
  const counts = Object.fromEntries(["costume", "set", "weapon", "mount", "wing", "pet", "monster", "map"].map((c) => [c, LAZY_TABS.includes(c) && !lazySrc(c) ? "…" : lists ? lists[c].length : 0]));

  return (
    <div className="wrap">
      <div className="top">
        <header className="brand">
          <svg className="logo" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 35 11.5v17L20 37 5 28.5v-17z" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M20 11 28 15.5v9L20 29 12 24.5v-9z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.2" /></svg>
          <div>
            <h1>Galeria Shaiya</h1>
            <div className="eyebrow">{t("eyebrow", { date: DATA_DATE })}</div>
          </div>
        </header>
        {data && lists && <Toolbar t={t} tab={tab} onTab={onTab} q={q} onQ={setQ} cls={cls} onCls={onCls} counts={counts} cmp={cmp} onCmp={onCmp} side={side} onSide={setSide} onSwap={onSwap} />}
        <Seg className="langs" label={t("lang")} options={LANGS} value={lang} onChange={setLang} />
      </div>

      {error && <p className="notice">{t("load.error", { e: String(error.message || error) })}</p>}
      {!data && !error && <p className="notice">{t("load.catalog")}</p>}

      {data && lists && (
        <>
          <div className="layout">
            <div className="leftcol">
              {tab === "dress"
                ? <DressForm t={t} dress={curDress} lists={lists} gear={!!gear} onChange={onDress} />
                : lazyWait
                  ? <p className="notice">{lazySrc(tab) === false
                    ? t("load.error", { e: tab === "monster" ? "monsters.json" : tab === "map" ? "maps.json" : "gear.json" })
                    : t(tab === "monster" ? "load.mobs" : tab === "map" ? "load.maps" : "load.gear")}</p>
                  : <List t={t} tab={tab} rows={rows} cur={curSel[tab]} onSelect={onSelect} />}
            </div>
            <div className="viewcol">
              {tab === "map"
                ? (curMap
                  ? <MapView key={curMap.id} m={curMap} hl={hlHere} mobName={(id) => (mobById[id] ? mobById[id].name : "?")} mapsById={mapsById} onGoMap={(k) => onGoMap(k, null)} onHl={setHl} t={t} li={li} />
                  : <div className="mapstage" />)
                : (
                  <>
                    <div className={cmp ? "stages two" : "stages"}>
                      <Stage t={t} spec={spec} motion={motion} spin={spin} dye={dye} anims={scene && scene.anims} onMotion={setMotion} onSpin={setSpin} onScene={setScene} onMasks={setMasks} side={cmp ? "A" : null} active={cmp && side === "A"} onActivate={cmp ? () => setSide("A") : undefined} />
                      {cmp && <Stage t={t} spec={specB} motion={motion} spin={spin} dye={dyeB} anims={sceneB && sceneB.anims} onMotion={setMotion} onSpin={setSpin} onScene={setSceneB} onMasks={setMasksB} side="B" active={side === "B"} onActivate={() => setSide("B")} />}
                    </div>
                    {cmp && <p className="cmphint">{t(side === "B" ? "cmp.hint_b" : "cmp.hint_a")}</p>}
                  </>
                )}
              {RIDER_TABS.includes(tab) && !(tab === "mount" && isTransform(data.catalog[curSel.mount])) && <RaceSex t={t} dress={curDress} onDress={onDress} />}
            </div>
            <aside className="sidecol">
              {dyeTargets.length > 0 && <DyePanel t={t} targets={dyeTargets} target={target} onTarget={setDyeTarget} dye={curDye} onChange={onDye} hasMask={hasMask} />}
              {!lazyWait && <Details t={t} lang={lang} tab={tab} catalog={loc.catalog} lists={lists} gear={gearL} sel={curSel} dress={curDress} onTry={onTry} maps={mapsApi} />}
            </aside>
          </div>
        </>
      )}

      <footer className="foot">
        <p className="lede">{t("lede")}</p>
        <p>{t("foot.hint")}</p>
        <p>{t("foot.legal")} <a href={REPO_URL} target="_blank" rel="noopener noreferrer">{t("foot.code")}</a></p>
      </footer>
    </div>
  );
}
