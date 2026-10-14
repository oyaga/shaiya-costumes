import { useEffect, useRef, useState } from "react";
import { Viewer } from "../viewer.js";
import { DATA_BASE } from "../config.js";

const MOTIONS = ["idle", "walk", "run"];

export default function Stage({ spec, motion, spin, dye, anims, onMotion, onSpin, onScene, onMasks, t }) {
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

  return (
    <div className="stage" ref={stageRef}>
      <canvas ref={canvasRef} aria-label={t("view3d")} />
      {status && <div className="msg">{t("st." + status)}</div>}
      <div className="bar">
        <span className="vbtns" role="group" aria-label={t("motion")}>
          {MOTIONS.map((m) => (
            <button key={m} type="button" className="vbtn" aria-pressed={motion === m} disabled={anims ? !anims[m] : false} onClick={() => onMotion(m)}>{t("mo." + m)}</button>
          ))}
        </span>
        <span className="vbtns" role="group" aria-label={t("camera")}>
          {["front", "side", "back"].map((c) => <button key={c} type="button" className="vbtn" onClick={() => view(c)}>{t("cam." + c)}</button>)}
          <button type="button" className="vbtn" aria-pressed={spin} onClick={() => onSpin(!spin)}>{t("cam.spin")}</button>
        </span>
      </div>
    </div>
  );
}
