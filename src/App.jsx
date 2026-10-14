import { useCallback, useEffect, useMemo, useState } from "react";
import { TABS, CODE, norm } from "./catalog.js";
import { DATA_BASE, DATA_DATE, REPO_URL } from "./config.js";
import Toolbar from "./components/Toolbar.jsx";
import List from "./components/List.jsx";
import DressForm from "./components/DressForm.jsx";
import Stage from "./components/Stage.jsx";
import DyePanel from "./components/DyePanel.jsx";
import Details from "./components/Details.jsx";
import RaceSex from "./components/RaceSex.jsx";

const RIDER_TABS = ["costume", "mount", "wing"];   // abas que mostram o item num personagem (raça/gênero à escolha)
const DYE_CATS = ["costume", "wing", "pet", "mount"];
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function App() {
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

  // catálogo + estado inicial (hash e um visual de exemplo no provador)
  useEffect(() => {
    let dead = false;
    fetch(DATA_BASE + "catalog.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then((d) => {
        if (dead) return;
        const catalog = d.catalog.map((g, k) => ({ ...g, k, hay: norm(g.name + " " + g.items.map((x) => x[2]).join(" ")) }));
        const costumes = d.costumes.map((c, k) => ({ ...c, k, cat: "costume", hay: norm(c.name + " " + (c.items || []).map((x) => x[2]).join(" ")) }));
        const byCat = (c) => (c === "costume" ? costumes : catalog.filter((g) => g.cat === c));
        const pick = (name, list) => { const x = list.find((i) => norm(i.name).includes(norm(name))); return x ? x.k : null; };
        setDress((s) => ({ ...s, costume: pick("Bobo", costumes), wing: pick("Pesadelo antes", byCat("wing")), pet: pick("Espantalho de Halloween", byCat("pet")) }));
        const first = (c) => (byCat(c)[0] ? byCat(c)[0].k : null);
        const next = { costume: 0, mount: first("mount"), wing: first("wing"), pet: first("pet") };
        const h = location.hash.slice(1), m = h.match(/^(costume|mount|wing|pet)-(\d+)$/);
        if (m) { setTab(m[1]); next[m[1]] = +m[2]; }
        else if (TABS.some((t) => t[0] === h)) setTab(h);
        setSel(next);
        setData({ catalog, costumes, chars: d.chars });
      })
      .catch((e) => { if (!dead) setError(e); });
    return () => { dead = true; };
  }, []);

  const lists = useMemo(() => data && {
    costume: data.costumes,
    mount: data.catalog.filter((g) => g.cat === "mount"),
    wing: data.catalog.filter((g) => g.cat === "wing"),
    pet: data.catalog.filter((g) => g.cat === "pet"),
  }, [data]);

  // endereço reflete o item aberto (#mount-12, #dress…)
  useEffect(() => {
    if (!data) return;
    const h = tab === "dress" ? "dress" : sel[tab] != null ? `${tab}-${sel[tab]}` : tab;
    history.replaceState(null, "", "#" + h);
  }, [data, tab, sel]);

  const rows = useMemo(() => {
    if (!lists || tab === "dress") return [];
    const nq = norm(q.trim());
    const r = lists[tab].filter((g) => !nq || g.hay.includes(nq));
    if (tab === "costume") r.sort((a, b) => a.name.localeCompare(b.name, "pt"));
    return r;
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
        <div className="eyebrow">Catálogo não oficial · dados do cliente de {DATA_DATE}</div>
        <h1>Galeria Shaiya</h1>
        <p className="lede">Fantasias, montarias, asas e pets do jogo em 3D e animados. No provador você monta o visual completo: escolha raça, fantasia, asa, pet e montaria e veja tudo junto.</p>
      </header>

      {error && <p className="notice">Não foi possível carregar o catálogo ({String(error.message || error)}). Recarregue a página.</p>}
      {!data && !error && <p className="notice">Carregando catálogo…</p>}

      {data && (
        <>
          <Toolbar tab={tab} onTab={onTab} q={q} onQ={setQ} counts={{ costume: lists.costume.length, mount: lists.mount.length, wing: lists.wing.length, pet: lists.pet.length }} />
          <div className="layout">
            <div className="leftcol">
              {tab === "dress"
                ? <DressForm dress={dress} lists={lists} onChange={onDress} />
                : <List tab={tab} rows={rows} cur={sel[tab]} onSelect={(k) => setSel((s) => ({ ...s, [tab]: k }))} />}
            </div>
            <div className="viewcol">
              <Stage spec={spec} motion={motion} spin={spin} dye={dye} anims={scene && scene.anims} onMotion={setMotion} onSpin={setSpin} onScene={onScene} onMasks={onMasks} />
              {RIDER_TABS.includes(tab) && <RaceSex dress={dress} onDress={onDress} />}
              <DyePanel targets={dyeTargets} target={target} onTarget={setDyeTarget} dye={dye} onChange={onDye} hasMask={hasMask} />
              <Details tab={tab} data={data} lists={lists} sel={sel} dress={dress} onTry={onTry} />
            </div>
          </div>
        </>
      )}

      <footer className="foot">
        <p>Arraste para girar, role ou pince para aproximar. Rostos padrão de cada raça; efeitos de partícula não incluídos; montarias na variação humana.</p>
        <p>Projeto de fã, sem ligação com o jogo ou a publisher. Shaiya e seus modelos pertencem aos respectivos donos. <a href={REPO_URL} target="_blank" rel="noopener noreferrer">Código no GitHub</a></p>
      </footer>
    </div>
  );
}
