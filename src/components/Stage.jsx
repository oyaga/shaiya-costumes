import { useEffect, useRef, useState } from "react";
import { Viewer } from "../viewer.js";
import { DATA_BASE } from "../config.js";
import { MAIN_SITE } from "../routes.js";

const MARK = "Galeria Shaiya · " + new URL(MAIN_SITE).host;   // assinatura do "Baixar imagem"

const MOTIONS = ["idle", "walk", "run", "attack", "die"];
const EXTRA = ["attack", "die"];   // só monstros têm: o botão aparece apenas quando o modelo traz a animação

export default function Stage({ spec, motion, spin, dye, anims, onMotion, onSpin, onScene, onMasks, side, active, onActivate, t }) {
  const canvasRef = useRef(null), stageRef = useRef(null), viewerRef = useRef(null);
  const [status, setStatus] = useState("start");   // chave de texto (st.*) ou null
  const cbRef = useRef(null);
  cbRef.current = { onScene, onMasks };

  useEffect(() => {
    let v;
    try {
      v = new Viewer(canvasRef.current, stageRef.current, DATA_BASE, {
        onStatus: setStatus,
        onScene: (info) => cbRef.current.onScene(info),
        onMasks: (m) => cbRef.current.onMasks(m),
      });
    } catch (e) {
      setStatus("webgl");
      return undefined;
    }
    viewerRef.current = v;
    if (/[?&]debug\b/.test(location.search)) window.__viewer = v;   // testes automáticos inspecionam a cena
    return () => { v.dispose(); viewerRef.current = null; };
  }, []);

  const specKey = JSON.stringify(spec);
  useEffect(() => { const v = viewerRef.current; if (v && spec) { v.motion = motion; v.dye = dye; v.build(spec); } }, [specKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { viewerRef.current?.setMotion(motion); }, [motion]);
  useEffect(() => { viewerRef.current?.setSpin(spin); }, [spin]);
  useEffect(() => {   // sliders disparam muito: espera 120 ms antes de recolorir texturas
    const h = setTimeout(() => viewerRef.current?.setDye(dye), 120);
    return () => clearTimeout(h);
  }, [dye]);

  const view = (v) => { viewerRef.current?.setView(v); onSpin(false); };
  // Baixa a cena em Full HD (PNG), do jeito que está na tela
  const shot = () => {
    const v = viewerRef.current;
    if (!v || status) return;
    const cv = v.snapshot(1920, 1080, MARK);
    cv.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      const d = new Date(), p = (n) => String(n).padStart(2, "0");
      a.download = `galeria-shaiya-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
      a.href = URL.createObjectURL(b);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, "image/png");
  };

  const cls = "stage" + (side ? " withSide" : "") + (active ? " active" : "");
  return (
    <div className={cls} ref={stageRef} onPointerDown={onActivate}>
      <canvas ref={canvasRef} aria-label={t("view3d")} />
      {side && (
        <button type="button" className="sidetag" aria-pressed={!!active} onClick={(e) => { e.stopPropagation(); onActivate && onActivate(); }}>
          {t("cmp.tag_" + side.toLowerCase())}
        </button>
      )}
      {status && <div className="msg">{t("st." + status)}</div>}
      <div className="bar">
        <span className="vbtns" role="group" aria-label={t("motion")}>
          {MOTIONS.filter((m) => !EXTRA.includes(m) || (anims && anims[m])).map((m) => (
            <button key={m} type="button" className="vbtn" aria-pressed={motion === m} disabled={anims ? !anims[m] : false} onClick={() => onMotion(m)}>{t("mo." + m)}</button>
          ))}
        </span>
        <span className="vbtns" role="group" aria-label={t("camera")}>
          {["front", "side", "back"].map((c) => <button key={c} type="button" className="vbtn" onClick={() => view(c)}>{t("cam." + c)}</button>)}
          <button type="button" className="vbtn" aria-pressed={spin} onClick={() => onSpin(!spin)}>{t("cam.spin")}</button>
          <button type="button" className="vbtn" disabled={!!status} title={t("cam.shot_hint")} onClick={shot}>{t("cam.shot")}</button>
        </span>
      </div>
    </div>
  );
}
