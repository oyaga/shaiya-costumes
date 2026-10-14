import { useEffect, useRef, useState } from "react";
import { Viewer } from "../viewer.js";
import { DATA_BASE } from "../config.js";

const MOTIONS = [["idle", "Parado"], ["walk", "Andando"], ["run", "Correndo"]];

export default function Stage({ spec, motion, spin, dye, anims, onMotion, onSpin, onScene, onMasks }) {
  const canvasRef = useRef(null), stageRef = useRef(null), viewerRef = useRef(null);
  const [status, setStatus] = useState("Carregando…");
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
      setStatus("Seu navegador não conseguiu iniciar o WebGL, então a visualização 3D não está disponível aqui.");
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
    const t = setTimeout(() => viewerRef.current?.setDye(dye), 120);
    return () => clearTimeout(t);
  }, [dye]);

  const view = (v) => { viewerRef.current?.setView(v); onSpin(false); };

  return (
    <div className="stage" ref={stageRef}>
      <canvas ref={canvasRef} aria-label="Visualização 3D" />
      {status && <div className="msg">{status}</div>}
      <div className="bar">
        <span className="vbtns" role="group" aria-label="Animação">
          {MOTIONS.map(([m, label]) => (
            <button key={m} type="button" className="vbtn" aria-pressed={motion === m} disabled={anims ? !anims[m] : false} onClick={() => onMotion(m)}>{label}</button>
          ))}
        </span>
        <span className="vbtns" role="group" aria-label="Câmera">
          <button type="button" className="vbtn" onClick={() => view("front")}>Frente</button>
          <button type="button" className="vbtn" onClick={() => view("side")}>Lado</button>
          <button type="button" className="vbtn" onClick={() => view("back")}>Costas</button>
          <button type="button" className="vbtn" aria-pressed={spin} onClick={() => onSpin(!spin)}>Girar</button>
        </span>
      </div>
    </div>
  );
}
