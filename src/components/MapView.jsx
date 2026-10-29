import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DATA_BASE } from "../config.js";

// Detalhe de cada mapa (map/<id>.json): áreas de nascimento, portais, NPCs. Fica em cache enquanto a página está aberta.
const cache = new Map();
function loadMap(id) {
  if (!cache.has(id)) {
    cache.set(id, fetch(`${DATA_BASE}map/${id}.json`)
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch((e) => { cache.delete(id); throw e; }));
  }
  return cache.get(id);
}

const LAYERS = ["mobs", "portals", "npcs"];

// Vista de cima do mapa: o terreno (minimapa desenhado dos arquivos do cliente) com as áreas onde os monstros
// nascem, os portais e os NPCs por cima. Roda para aproximar, arrasta para mover.
export default function MapView({ m, hl, mobName, mapsById, onGoMap, onHl, t, li }) {
  const [detail, setDetail] = useState(null);   // null = carregando, false = falhou
  const [layers, setLayers] = useState({ mobs: true, portals: true, npcs: false });
  const [view, setView] = useState({ x: 0, y: 0, w: m.size });
  const [cap, setCap] = useState(null);
  const svgRef = useRef(null), drag = useRef(null), moved = useRef(false);
  const size = m.size;

  useEffect(() => {
    let dead = false;
    setDetail(null); setCap(null); setView({ x: 0, y: 0, w: size });
    loadMap(m.id).then((d) => { if (!dead) setDetail(d); }).catch(() => { if (!dead) setDetail(false); });
    return () => { dead = true; };
  }, [m.id, size]);

  const clamp = useCallback((v) => {
    const w = Math.min(size, Math.max(size / 24, v.w));
    return { w, x: Math.min(size - w, Math.max(0, v.x)), y: Math.min(size - w, Math.max(0, v.y)) };
  }, [size]);

  // a roda precisa de ouvinte "não passivo" para não rolar a página junto
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect(), side = Math.min(r.width, r.height);
      const fx = (e.clientX - (r.left + (r.width - side) / 2)) / side, fy = (e.clientY - (r.top + (r.height - side) / 2)) / side;
      setView((v) => {
        const w = v.w * (e.deltaY > 0 ? 1.18 : 1 / 1.18);
        const nw = Math.min(size, Math.max(size / 24, w));
        return clamp({ w: nw, x: v.x + (v.w - nw) * fx, y: v.y + (v.w - nw) * fy });
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [size, clamp, detail]);

  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY, v: view }; moved.current = false; };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const r = svgRef.current.getBoundingClientRect(), side = Math.min(r.width, r.height);
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!moved.current && Math.abs(dx) + Math.abs(dy) > 4) { moved.current = true; e.currentTarget.setPointerCapture(e.pointerId); }
    if (moved.current) setView(clamp({ w: d.v.w, x: d.v.x - dx * d.v.w / side, y: d.v.y - dy * d.v.w / side }));
  };
  const onUp = () => { drag.current = null; };

  const u = view.w / 640;   // 1 px de tela em unidades do mapa
  const hlAreas = useMemo(() => (detail && hl != null ? detail.areas.filter((a) => a[4].some((x) => x[0] === hl)) : []), [detail, hl]);
  const names = (a) => a[4].map((x) => `${mobName(x[0])} ×${x[1]}`).join(" · ");
  const toggle = (k) => setLayers((s) => ({ ...s, [k]: !s[k] }));
  const text = (g) => (g.name ? g.name[li] || g.name[0] : t("map.n", { id: g.id }));

  return (
    <div className="mapstage">
      <svg ref={svgRef} className="mapsvg" viewBox={`${view.x} ${view.y} ${view.w} ${view.w}`} role="img" aria-label={t("map.mapview")}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={() => setCap(null)}>
        <rect x="0" y="0" width={size} height={size} className="mapbg" />
        {m.img
          ? <image href={`${DATA_BASE}map/${m.id}.webp`} x="0" y="0" width={size} height={size} />
          : [0.25, 0.5, 0.75].map((f) => <g key={f} className="mapgrid"><line x1={size * f} y1="0" x2={size * f} y2={size} /><line x1="0" y1={size * f} x2={size} y2={size * f} /></g>)}
        {detail && layers.mobs && detail.areas.map((a, i) => {
          const on = hl != null && a[4].some((x) => x[0] === hl);
          if (hl != null && !on) return <rect key={i} className="area dim" x={a[0]} y={a[1]} width={Math.max(a[2] - a[0], 2)} height={Math.max(a[3] - a[1], 2)} />;
          return <rect key={i} className={on ? "area hl" : "area"} x={a[0]} y={a[1]} width={Math.max(a[2] - a[0], 2)} height={Math.max(a[3] - a[1], 2)}
            onPointerEnter={() => setCap(names(a))} onPointerLeave={() => setCap(null)} />;
        })}
        {detail && layers.npcs && detail.npcs.flatMap(([k, pts]) => pts.map((p, i) => (
          <circle key={k + "-" + i} className="npc" cx={p[0]} cy={p[1]} r={3 * u} onPointerEnter={() => setCap(`NPC ${k}`)} onPointerLeave={() => setCap(null)} />
        )))}
        {detail && layers.portals && detail.spawns.map((s, i) => (
          <rect key={"s" + i} className="spawn" x={s.box[0]} y={s.box[1]} width={s.box[2] - s.box[0]} height={s.box[3] - s.box[1]}
            onPointerEnter={() => setCap(t("map.start", { f: t(s.f === "Light" ? "fac.light" : "fac.fury") }))} onPointerLeave={() => setCap(null)} />
        ))}
        {detail && layers.portals && detail.portals.map((p, i) => {
          const to = mapsById[p.to], self = p.to === m.id;
          const label = to ? text(to) : t("map.n", { id: p.to });
          return (
            <g key={"p" + i} className={self || !to ? "portal off" : "portal"} transform={`translate(${p.p[0]} ${p.p[1]})`}
              onPointerEnter={() => setCap(`→ ${label}${p.lv[1] < 999 || p.lv[0] > 0 ? ` · ${t("mob.lvs", { a: p.lv[0], b: p.lv[1] })}` : ""}`)} onPointerLeave={() => setCap(null)}
              onClick={() => { if (!moved.current && to && !self) onGoMap(to.k); }}>
              <circle r={9 * u} className="ring" />
              <circle r={4 * u} className="core" />
              <text y={-13 * u} fontSize={11 * u} textAnchor="middle">{p.to}</text>
            </g>
          );
        })}
      </svg>
      {detail === null && <div className="msg">{t("map.loading")}</div>}
      {detail === false && <div className="msg">{t("load.error", { e: `map/${m.id}.json` })}</div>}
      {hl != null && <button type="button" className="hlpill" onClick={() => onHl(null)} title={t("map.clear")}>{t("map.hl", { name: mobName(hl) })}{hlAreas.length ? ` · ${t("map.areas", { n: hlAreas.length })}` : ""} ×</button>}
      {cap && <div className="mapcap">{cap}</div>}
      <div className="bar">
        <span className="vbtns" role="group" aria-label={t("map.layers")}>
          {LAYERS.map((k) => <button key={k} type="button" className="vbtn" aria-pressed={layers[k]} onClick={() => toggle(k)}>{t("map.l." + k)}</button>)}
        </span>
        <span className="vbtns">
          <span className="maphint">{m.img ? t("map.zoom") : t("map.noimg")}</span>
          <button type="button" className="vbtn" disabled={view.w === size} onClick={() => setView({ x: 0, y: 0, w: size })}>{t("map.reset")}</button>
        </span>
      </div>
    </div>
  );
}
