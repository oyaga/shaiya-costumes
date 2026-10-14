import { DYE_PRESETS, swatchCss } from "../catalog.js";
import Seg from "./Seg.jsx";

// Pintura (tintura Crowly). Os três controles são os mesmos parâmetros que o servidor manda ao cliente:
// matiz em graus, saturação (byte × 0,02) e brilho (1 + byte × 0,002).
export default function DyePanel({ targets, target, onTarget, dye, onChange, hasMask, t }) {
  if (!targets.length) return null;
  const p = dye[target] || { h: 0, s: 1, v: 1 }, on = !!dye[target];
  const set = (patch) => onChange(target, { ...p, ...patch });
  const pct = (x) => Math.round(x * 100);

  return (
    <section className="dyebox">
      <div className="dyerow">
        <span className="label">{t("dye.title")}</span>
        <button type="button" className="btn" disabled={!on} onClick={() => onChange(target, null)}>{t("dye.off")}</button>
      </div>
      {targets.length > 1 && (
        <Seg label={t("dye.piece")} options={targets.map((c) => [c, t("cat." + c) + (dye[c] ? " ●" : "")])} value={target} onChange={onTarget} />
      )}
      <div className="swatches">
        {DYE_PRESETS.map((pr) => {
          const label = t("dye.preset", { h: pr.h });
          return <button key={pr.h} type="button" className="sw" title={label} aria-label={label} style={{ background: swatchCss(pr) }} onClick={() => onChange(target, { h: pr.h, s: pr.s, v: pr.v })} />;
        })}
      </div>
      <div className="sliders">
        <label>{t("dye.h")}<input type="range" min="0" max="359" step="1" value={p.h} onChange={(e) => set({ h: +e.target.value })} /><span>{p.h}°</span></label>
        <label>{t("dye.s")}<input type="range" min="0" max="300" step="2" value={pct(p.s)} onChange={(e) => set({ s: +e.target.value / 100 })} /><span>{pct(p.s)}%</span></label>
        <label>{t("dye.v")}<input type="range" min="100" max="151" step="1" value={pct(p.v)} onChange={(e) => set({ v: +e.target.value / 100 })} /><span>{pct(p.v)}%</span></label>
      </div>
      <p className="dyenote">{on ? t(hasMask ? "dye.mask" : "dye.nomask") : t("dye.hint")}</p>
    </section>
  );
}
