// Vitrine 3D: three.js + skinning na CPU (engine.js). Independente do React — o componente Stage cria um
// Viewer no canvas e chama build()/setMotion()/setDye() quando o estado muda.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { decodeMesh, decodeAnim, poseAt, frameAt, skinMesh, mul, translation, IDENT } from "./engine.js";
import { RACE_IX } from "./catalog.js";

const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
const PET_OFFSET = 1.1;
// pet = monstro do jogo: escala (sc do catálogo) e depois a posição ao lado do personagem
const petPlace = (s, x, y, z) => { const m = translation(x, y, z); m[0] = m[5] = m[10] = s; return m; };

class Actor {
  constructor(meshes, anims) {   // meshes: [{mesh, map, dyeable}]
    this.anims = anims || {}; this.anim = null; this.G = null; this.W = IDENT;
    this.parts = meshes.map(({ mesh, map, dyeable }) => {
      const g = new THREE.BufferGeometry();
      const P = new Float32Array(mesh.nv * 3), N = new Float32Array(mesh.nv * 3);
      g.setAttribute("position", new THREE.BufferAttribute(P, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
      g.setAttribute("uv", new THREE.BufferAttribute(mesh.uv, 2));
      g.setIndex(new THREE.BufferAttribute(mesh.idx, 1));
      const obj = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide }));
      obj.frustumCulled = false;
      return { mesh, g, P, N, obj, base: map, dyeable: dyeable !== false };
    });
  }
  setAnim(...keys) {
    for (const k of keys) if (k && this.anims[k]) { this.anim = this.anims[k]; return; }
    // sem a pedida: parado, ou outra que não seja a de morte (objeto que só tem "morrendo" fica parado na pose)
    const other = Object.entries(this.anims).find(([k]) => k !== "die");
    this.anim = this.anims.idle || (other ? other[1] : null);
  }
  update(sec, W) {
    this.W = W;
    this.G = this.anim ? poseAt(this.anim, frameAt(this.anim, sec)) : null;
    for (const p of this.parts) {
      skinMesh(p.mesh, this.G, W, p.P, p.N);
      p.g.attributes.position.needsUpdate = true; p.g.attributes.normal.needsUpdate = true;
    }
  }
  boneMatrix(k) {   // matriz do osso k no mundo (espaço DirectX, antes do espelho)
    return this.G && k < this.G.length ? mul(this.G[k], this.W, new Float32Array(16)) : this.W;
  }
  bonePos(k) { const m = this.boneMatrix(k); return [m[12], m[13], m[14]]; }
  addTo(group) { this.parts.forEach((p) => group.add(p.obj)); }
  dispose() { this.parts.forEach((p) => { p.g.dispose(); p.obj.material.dispose(); }); }
}

const disposeAll = (set) => Object.values(set).forEach((a) => a && a.dispose && a.dispose());

export class Viewer {
  // cb: { onStatus("loading" | "error" | null), onScene({anims, dyeKeys}), onMasks(masks) }
  constructor(canvas, stageEl, base, cb) {
    this.base = base; this.cb = cb; this.stageEl = stageEl;
    this.token = 0; this.dyeSeq = 0; this.actors = null; this.fit = null; this.spec = null;
    this.motion = "idle"; this.dye = {}; this.masks = null;
    this.fileCache = new Map(); this.texCache = new Map(); this.dyeCache = new Map(); this.imgCache = new Map();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.01, 500);
    // intensidades × π: three ≥ r155 usa luzes fisicamente corretas
    this.scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x26302d, 0.9 * Math.PI));
    const key = new THREE.DirectionalLight(0xfff0dc, 0.8 * Math.PI); key.position.set(1.5, 3, -2.5); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xffb066, 0.35 * Math.PI); rim.position.set(-2, 1, 3); this.scene.add(rim);
    this.root = new THREE.Group(); this.scene.add(this.root);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.08, autoRotateSpeed: 1.2, enablePan: false, autoRotate: true });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(stageEl); this.resize();

    this.clock0 = performance.now();
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      this.controls.update();
      this.step((now - this.clock0) / 1000);
      this.renderer.render(this.scene, this.camera);
    };
    this.raf = requestAnimationFrame(loop);
    this.loadMasks();
  }

  dispose() {
    cancelAnimationFrame(this.raf); this.ro.disconnect(); this.controls.dispose();
    this.token++; this.clear();
    this.texCache.forEach((t) => t.dispose()); this.dyeCache.forEach((t) => t.dispose());
    this.renderer.dispose();
  }

  clear() {
    if (this.actors) disposeAll(this.actors);
    this.actors = null;
    while (this.root.children.length) this.root.remove(this.root.children[0]);
  }

  // ── dados ──
  async getJSON(path) {
    if (!this.fileCache.has(path)) {
      this.fileCache.set(path, fetch(this.base + path).then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }).then((j) => this.decodeFile(j))
        .catch((e) => { this.fileCache.delete(path); throw e; }));
    }
    return this.fileCache.get(path);
  }
  decodeFile(j) {
    const out = { tex: j.tex || {}, anims: {}, ride: j.ride, back: j.back, wing: j.wing, stance: j.stance, att: j.att, parts: [] };
    for (const [k, a] of Object.entries(j.anims || {})) { try { out.anims[k] = decodeAnim(a); } catch (e) { /* animação corrompida: ignora */ } }
    if (j.parts) out.parts = j.parts.map(decodeMesh);
    return out;
  }
  texture(file, key, dataUri) {
    const id = file + "|" + key;
    if (!this.texCache.has(id)) {
      const t = new THREE.TextureLoader().load(dataUri);
      t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      t.userData = { id, key, uri: dataUri };   // a pintura precisa da imagem original e do nome (máscara)
      this.texCache.set(id, t);
    }
    return this.texCache.get(id);
  }
  actorFrom(file, d) {
    return new Actor(d.parts.map((mesh) => ({ mesh, map: this.texture(file, mesh.t, d.tex[mesh.t]) })), d.anims);
  }

  // ── cena ──
  // spec: { kind: "single", cat, file } | { kind: "char", code, race, costume?, set?, weapon?, shield?, wing?, pet?, petScale?, mount? }
  // (caminhos relativos a base; weapon/shield = { f, kind })
  async build(spec) {
    const my = ++this.token;
    this.spec = spec;
    this.cb.onStatus("loading");
    try {
      const next = {};
      if (spec && spec.kind === "single") {
        const d = await this.getJSON(spec.file);
        next.single = this.actorFrom(spec.file, d);
      } else if (spec) {
        const charFile = `c/${spec.code}.json`;
        const base = await this.getJSON(charFile);
        let meshes = base.parts.map((mesh) => ({ mesh, map: this.texture(charFile, mesh.t, base.tex[mesh.t]), dyeable: false }));   // corpo/rosto não recebem tintura
        if (spec.costume) {
          const cd = await this.getJSON(spec.costume);
          // A fantasia substitui a roupa inteira: os 3DC dela cobrem o corpo todo (uma camisa de futebol vai dos pés ao
          // pescoço) e uma vaga vazia no MLT não desenha nada — então as quatro peças da armadura base somem sempre.
          // Só o capacete da fantasia (quando existe) substitui o cabelo; o rosto fica.
          const hide = new Set(["upper", "hand", "lower", "foot"]);
          if (cd.parts.some((p) => p.part === "helmet")) hide.add("hair");
          meshes = meshes.filter((m) => !hide.has(m.mesh.part)).concat(cd.parts.map((mesh) => ({ mesh, map: this.texture(spec.costume, mesh.t, cd.tex[mesh.t]) })));
        } else if (spec.set) {
          // Armadura troca peça por peça (só as vagas que o set tem); elmo esconde o cabelo, como no jogo.
          const sd = await this.getJSON(spec.set);
          const hide = new Set(sd.parts.map((p) => p.part));
          if (hide.has("helmet")) hide.add("hair");
          meshes = meshes.filter((m) => !hide.has(m.mesh.part)).concat(sd.parts.map((mesh) => ({ mesh, map: this.texture(spec.set, mesh.t, sd.tex[mesh.t]), dyeable: false })));
        }
        let anims = base.anims;
        if (spec.weapon || spec.shield) {
          // Postura com arma (animações extras do personagem) + o encaixe que o próprio jogo usa (IT2, sub_14012D8C0):
          // cada arma traz, por raça/gênero, o osso e a matriz local; mundo = local · G[osso] · personagem.
          // a10 = 0 arma principal; 1 = arco/besta e mão esquerda (2ª arma, escudo).
          const stFile = `c/${spec.code}-st.json`, st = await this.getJSON(stFile);
          anims = { ...base.anims, ...st.anims };
          const kind = spec.weapon ? spec.weapon.kind : "sh";
          const [idleKey, runKey] = (st.stance && st.stance[kind]) || [];
          next.stanceKeys = { idle: idleKey, run: runKey };
          const fit = (d, a10) => {
            const e = d.att && d.att[spec.code] && d.att[spec.code][a10];
            return e ? { b: e.b, L: new Float32Array(e.m) } : null;
          };
          if (spec.weapon) {
            const wd = await this.getJSON(spec.weapon.f);
            const main = fit(wd, kind === "bow" || kind === "crbo" ? 1 : 0);
            if (main) { next.wr = this.actorFrom(spec.weapon.f, wd); next.wrFit = main; }
            if (kind === "du" || kind === "kn") {   // duas armas / garras: a mesma arma também na mão esquerda
              const left = fit(wd, 1);
              if (left) { next.wl = this.actorFrom(spec.weapon.f, wd); next.wlFit = left; }
            }
          }
          // escudo só com arma de uma mão (ou sem arma), como no jogo
          if (spec.shield && !next.wl && !["th", "du", "kn", "sp", "bow", "crbo"].includes(kind)) {
            const sd = await this.getJSON(spec.shield.f);
            const left = fit(sd, 1);
            if (left) { next.wl = this.actorFrom(spec.shield.f, sd); next.wlFit = left; }
          }
        }
        next.char = new Actor(meshes, anims); next.back = base.back;
        // matriz de encaixe emulada da função do jogo (WingPosition.xml): asa = M · osso · mundo
        next.wingFit = base.wing && base.wing.m ? { bone: base.wing.bone, L: new Float32Array(base.wing.m) } : null;
        for (const f of ["wing", "pet", "mount"]) {
          if (!spec[f]) continue;
          const d = await this.getJSON(spec[f]);
          next[f] = this.actorFrom(spec[f], d); if (f === "mount") next.ride = d.ride;
        }
      }
      if (my !== this.token) { disposeAll(next); return; }
      this.clear();
      this.actors = next;
      Object.values(next).forEach((a) => a && a.addTo && a.addTo(this.root));
      this.applyMotion();
      this.step(0);
      this.computeFit(); this.frame(true);
      this.cb.onStatus(null);
      this.cb.onScene(this.sceneInfo());
      this.applyDyes();
    } catch (e) {
      if (my === this.token) this.cb.onStatus("error");
    }
  }

  sceneInfo() {
    const a = this.actors, main = a && (a.single || a.char);
    const has = (k) => !!(main && main.anims && (main.anims[k] || (a.char && a.mount)));
    const dyeKeys = {};
    for (const [cat, actor] of this.dyeActors()) dyeKeys[cat] = actor.parts.filter((p) => p.dyeable && p.base.userData).map((p) => p.base.userData.key);
    return { anims: { idle: has("idle"), walk: has("walk"), run: has("run"), attack: has("attack"), die: has("die") }, dyeKeys };
  }

  setMotion(m) { this.motion = m; this.applyMotion(); }
  applyMotion() {
    const a = this.actors; if (!a) return;
    const m = this.motion;
    if (a.single) a.single.setAnim(m);
    if (a.mount) a.mount.setAnim(m);
    if (a.char) {
      if (a.mount) {
        const gc = a.ride ? a.ride.gc : 0;
        if (gc === 0) a.char.setAnim(m === "idle" ? "ride0" : "ride0run", "ride0");
        else if (gc === 2) a.char.setAnim("ride2", "ride0");
        else a.char.setAnim("ride1", "ride0");
      } else if (a.stanceKeys) {   // com arma: parado e correndo na postura da arma; andando é o mesmo de sempre
        const sk = a.stanceKeys;
        a.char.setAnim(m === "idle" ? sk.idle : m === "run" ? sk.run : null, m);
      } else a.char.setAnim(m);
    }
    if (a.wing) a.wing.setAnim(m === "run" ? "run" : "idle", "walk");
    if (a.pet) a.pet.setAnim(m);
  }

  step(sec) {
    const a = this.actors; if (!a) return;
    if (a.single) { a.single.update(sec, IDENT); return; }
    if (!a.char) return;
    let Wc = IDENT;
    if (a.mount) {
      a.mount.update(sec, IDENT);
      const rb = a.ride ? a.ride.bones[RACE_IX[this.spec.race] || 0] : 0;
      const p = a.mount.bonePos(rb);
      Wc = translation(p[0], p[1], p[2]);
    }
    a.char.update(sec, Wc);
    if (a.wr) a.wr.update(sec, mul(a.wrFit.L, a.char.boneMatrix(a.wrFit.b), new Float32Array(16)));
    if (a.wl) a.wl.update(sec, mul(a.wlFit.L, a.char.boneMatrix(a.wlFit.b), new Float32Array(16)));
    if (a.wing) {
      if (a.wingFit) a.wing.update(sec, mul(a.wingFit.L, a.char.boneMatrix(a.wingFit.bone), new Float32Array(16)));
      else { const p = a.char.bonePos(a.back); a.wing.update(sec, translation(p[0], p[1], p[2])); }
    }
    if (a.pet) a.pet.update(sec, petPlace(this.spec.petScale || 1, a.mount ? PET_OFFSET + 0.9 : PET_OFFSET, 0, 0.4));
  }

  // ── câmera ──
  computeFit() {
    const box = new THREE.Box3();
    // peça que a animação esconde jogando para longe (Bebê Panda: 1e6) não entra no enquadramento
    const near = (b) => Math.max(-b.min.x, -b.min.y, -b.min.z, b.max.x, b.max.y, b.max.z) < 1e4;
    for (const a of Object.values(this.actors || {})) if (a && a.parts) for (const p of a.parts) { p.g.computeBoundingBox(); if (near(p.g.boundingBox)) box.union(p.g.boundingBox); }
    if (box.isEmpty()) box.setFromCenterAndSize(new THREE.Vector3(0, 1, 0), new THREE.Vector3(2, 2, 2));
    this.fit = { size: box.getSize(new THREE.Vector3()), c: box.getCenter(new THREE.Vector3()) };
  }
  resize() {
    const st = this.stageEl, w = st.clientWidth || 1, h = st.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.fit) this.frame(false);
  }
  frame(resetDir) {
    if (!this.fit) return;
    const { size, c } = this.fit, cam = this.camera, vf = THREE.MathUtils.degToRad(cam.fov / 2), horiz = Math.max(size.x, size.z);
    const d = Math.max((size.y / 2) / Math.tan(vf), (horiz / 2) / (Math.tan(vf) * cam.aspect)) * 1.15 + horiz / 2;
    this.controls.target.copy(c); this.controls.minDistance = d * 0.25; this.controls.maxDistance = d * 2.5;
    cam.near = d / 200; cam.far = d * 20; cam.updateProjectionMatrix();
    const dir = resetDir ? new THREE.Vector3(0.55, 0.22, -1).normalize() : cam.position.clone().sub(c).normalize();
    cam.position.copy(c).addScaledVector(dir, d); cam.lookAt(c);
  }
  setView(v) {
    if (!this.fit) return;
    const d = this.camera.position.distanceTo(this.fit.c);
    const dir = v === "side" ? new THREE.Vector3(1, 0.1, 0) : v === "back" ? new THREE.Vector3(0, 0.1, 1) : new THREE.Vector3(0, 0.1, -1);
    this.camera.position.copy(this.fit.c).addScaledVector(dir.normalize(), d);
  }
  setSpin(on) { this.controls.autoRotate = !!on; }

  // Foto da cena em w×h (Full HD por padrão), com o ângulo e o zoom que a pessoa deixou. O canvas do palco é
  // transparente (o fundo é CSS), então o fundo do palco é pintado atrás. Tudo no mesmo tick: troca o tamanho
  // do buffer, desenha, copia e devolve — o laço de animação não chega a ver o tamanho grande.
  snapshot(w = 1920, h = 1080, mark = "") {
    const r = this.renderer, cam = this.camera;
    const pr = r.getPixelRatio(), size = r.getSize(new THREE.Vector2()), aspect = cam.aspect;
    const out = document.createElement("canvas"); out.width = w; out.height = h;
    const cx = out.getContext("2d");
    const css = getComputedStyle(this.stageEl);
    const top = css.getPropertyValue("--stage-top").trim() || "#23302d", bottom = css.getPropertyValue("--stage-bottom").trim() || "#0d1312";
    const lin = cx.createLinearGradient(0, 0, 0, h); lin.addColorStop(0, top); lin.addColorStop(1, bottom);
    cx.fillStyle = lin; cx.fillRect(0, 0, w, h);
    const glow = cx.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.9);   // o brilho quente do chão, como no palco
    glow.addColorStop(0, "rgba(220,154,82,0.16)"); glow.addColorStop(1, "rgba(220,154,82,0)");
    cx.fillStyle = glow; cx.fillRect(0, 0, w, h);
    try {
      r.setPixelRatio(1); r.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
      r.render(this.scene, cam);
      cx.drawImage(r.domElement, 0, 0, w, h);
    } finally {
      r.setPixelRatio(pr); r.setSize(size.x, size.y, false);
      cam.aspect = aspect; cam.updateProjectionMatrix();
    }
    if (mark) {   // assinatura discreta no canto
      cx.font = `500 ${Math.round(h / 54)}px system-ui, sans-serif`; cx.textAlign = "right"; cx.textBaseline = "bottom";
      cx.fillStyle = "rgba(223,230,225,0.45)"; cx.fillText(mark, w - h / 40, h - h / 45);
    }
    return out;
  }

  // ── pintura (tintura Crowly) ──
  // Replica o pixel shader do cliente (gDyeingHSVA/gDyeingMode): gira o matiz por uma matriz de rotação de cor,
  // escala a saturação em torno do cinza 0,299·(r+g+b) e multiplica pelo brilho. Onde existe a máscara
  // "<textura>_M.dds" (modos 2/4 do jogo), pixels com máscara > 0,1 ficam com a cor original.
  loadMasks() {
    if (!this.masksLoading) {
      this.masksLoading = fetch(this.base + "mask/masks.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
        .then((m) => { this.masks = m; this.cb.onMasks && this.cb.onMasks(m); return m; });
    }
    return this.masksLoading;
  }
  loadImg(src) {
    if (!this.imgCache.has(src)) this.imgCache.set(src, new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
    return this.imgCache.get(src);
  }
  async dyedTexture(base, p) {
    const ud = base.userData || {}, id = `${ud.id}|${p.h}|${p.s}|${p.v}`;
    if (this.dyeCache.has(id)) return this.dyeCache.get(id);
    const masks = await this.loadMasks();
    const im = await this.loadImg(ud.uri); if (!im) return base;
    const mk = masks && masks[ud.key] ? await this.loadImg(masks[ud.key]) : null;
    const w = im.naturalWidth, h = im.naturalHeight;
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const cx = cv.getContext("2d"); cx.drawImage(im, 0, 0);
    const img = cx.getImageData(0, 0, w, h), d = img.data;
    let md = null, mw = 0, mh = 0;
    if (mk) {
      const mc = document.createElement("canvas"); mw = mc.width = mk.naturalWidth; mh = mc.height = mk.naturalHeight;
      const mx = mc.getContext("2d"); mx.drawImage(mk, 0, 0); md = mx.getImageData(0, 0, mw, mh).data;
    }
    const th = (p.h * Math.PI) / 180, c = Math.cos(th), s = Math.sin(th);
    const A = c + (1 - c) / 3, B = (1 - c) / 3 - s * 0.57735, C = (1 - c) / 3 + s * 0.57735;
    for (let y = 0; y < h; y++) {
      const my = md ? Math.floor((y * mh) / h) * mw : 0;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (md && md[(my + Math.floor((x * mw) / w)) * 4] > 25) continue;   // máscara > 0,1: mantém a cor original
        const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        const rr = A * r + B * g + C * b, gg = C * r + A * g + B * b, bb = B * r + C * g + A * b;
        const gray = 0.299 * (r + g + b);
        d[i] = clamp255((gray + p.s * (rr - gray)) * p.v);
        d[i + 1] = clamp255((gray + p.s * (gg - gray)) * p.v);
        d[i + 2] = clamp255((gray + p.s * (bb - gray)) * p.v);
      }
    }
    cx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = base.anisotropy;
    if (this.dyeCache.size > 60) { const k0 = this.dyeCache.keys().next().value; this.dyeCache.get(k0).dispose(); this.dyeCache.delete(k0); }
    this.dyeCache.set(id, t);
    return t;
  }
  dyeActors() {
    const a = this.actors; if (!a) return [];
    const out = [["costume", a.char], ["wing", a.wing], ["pet", a.pet], ["mount", a.mount]];
    if (a.single && this.spec) out.push([this.spec.cat, a.single]);
    return out.filter((x) => x[1]);
  }
  setDye(dye) { this.dye = dye || {}; this.applyDyes(); }
  async applyDyes() {
    const my = this.token, seq = ++this.dyeSeq;
    for (const [cat, actor] of this.dyeActors()) {
      const p = this.dye[cat];
      for (const part of actor.parts) {
        if (!part.dyeable) continue;
        const map = p ? await this.dyedTexture(part.base, p) : part.base;
        if (my !== this.token || seq !== this.dyeSeq) return;
        if (part.obj.material.map !== map) { part.obj.material.map = map; part.obj.material.needsUpdate = true; }
      }
    }
  }
}
