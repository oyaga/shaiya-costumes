// Motor de animação (Shaiya): decodifica malhas/animações do catálogo e faz skinning na CPU.
// Matrizes no estilo DirectX (vetor-linha, row-major: m[r*4+c]); a saída espelha o X para o three.js.
export const FPS = 30;
export const IDENT = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

function b64buf(s) {
  const bin = atob(s), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u.buffer;
}

// Layout de uma malha (ver scripts de extração): ib f32[nb*16] | pos i16[nv*3] | uv i16[nv*2] | idx u16[ni] |
// nrm i8[nv*3] | bi u8[nv*4] | bw u8[nv*4]. 4 ossos por vértice (o 3DC do jogo tem 4 índices).
export function decodeMesh(pm) {
  const buf = b64buf(pm.b), nv = pm.nv, nb = pm.nb, ni = pm.ni;
  let o = 0;
  const ib = new Float32Array(buf.slice(o, o + nb * 64)); o += nb * 64;
  const p16 = new Int16Array(buf.slice(o, o + nv * 6)); o += nv * 6;
  const u16 = new Int16Array(buf.slice(o, o + nv * 4)); o += nv * 4;
  const idx = new Uint16Array(buf.slice(o, o + ni * 2)); o += ni * 2;
  const n8 = new Int8Array(buf.slice(o, o + nv * 3)); o += nv * 3;
  const bi = new Uint8Array(buf.slice(o, o + nv * 4)); o += nv * 4;
  const bw8 = new Uint8Array(buf.slice(o, o + nv * 4));
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), bw = new Float32Array(nv * 4);
  for (let i = 0; i < nv * 3; i++) { pos[i] = p16[i] * pm.sp; nrm[i] = n8[i] / 127; }
  for (let i = 0; i < nv * 2; i++) uv[i] = u16[i] * pm.su;
  for (let i = 0; i < nv * 4; i++) bw[i] = bw8[i] / 255;
  return { nv, nb, ib, pos, nrm, uv, idx, bi, bw, t: pm.t, part: pm.part };
}

export function decodeAnim(a) {
  const dv = new DataView(b64buf(a.b));
  let o = 0;
  const nb = dv.getUint16(o, true); o += 4;
  const bones = [];
  for (let k = 0; k < nb; k++) {
    const parent = dv.getInt16(o, true), nr = dv.getUint16(o + 2, true), nt = dv.getUint16(o + 4, true); o += 8;
    const lb = new Float32Array(16); for (let j = 0; j < 16; j++) { lb[j] = dv.getFloat32(o, true); o += 4; }
    const rf = new Uint16Array(nr); for (let j = 0; j < nr; j++) { rf[j] = dv.getUint16(o, true); o += 2; }
    if (nr % 2) o += 2;
    const rq = new Float32Array(nr * 4); for (let j = 0; j < nr * 4; j++) { rq[j] = dv.getInt16(o, true) / 32767; o += 2; }
    const tf = new Uint16Array(nt); for (let j = 0; j < nt; j++) { tf[j] = dv.getUint16(o, true); o += 2; }
    if (nt % 2) o += 2;
    const tv = new Float32Array(nt * 3); for (let j = 0; j < nt * 3; j++) { tv[j] = dv.getFloat32(o, true); o += 4; }
    bones.push({ parent, lb, rf, rq, tf, tv });
  }
  return { s: a.s, e: a.e, bones };
}

// chave (frames f[], valores v[] com n componentes) no quadro t → out
function sampleKeys(f, v, n, t, out) {
  const c = f.length;
  if (!c) return false;
  if (t <= f[0] || c === 1) { for (let i = 0; i < n; i++) out[i] = v[i]; return true; }
  if (t >= f[c - 1]) { for (let i = 0; i < n; i++) out[i] = v[(c - 1) * n + i]; return true; }
  let j = 0; while (j < c - 1 && f[j + 1] < t) j++;
  const a = f[j], b = f[j + 1], u = (t - a) / Math.max(1, b - a);
  if (n === 4) {
    let d = 0; for (let i = 0; i < 4; i++) d += v[j * 4 + i] * v[(j + 1) * 4 + i];
    const sg = d < 0 ? -1 : 1; let len = 0;
    for (let i = 0; i < 4; i++) { out[i] = v[j * 4 + i] * (1 - u) + sg * v[(j + 1) * 4 + i] * u; len += out[i] * out[i]; }
    len = Math.sqrt(len) || 1; for (let i = 0; i < 4; i++) out[i] /= len;
  } else {
    for (let i = 0; i < n; i++) out[i] = v[j * n + i] * (1 - u) + v[(j + 1) * n + i] * u;
  }
  return true;
}

export function mul(a, b, out) {   // out = a * b (row-major)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++)
    out[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + a[r * 4 + 3] * b[12 + c];
  return out;
}

function quatInto(q, m) {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  m[0] = 1 - 2 * (y * y + z * z); m[1] = 2 * (x * y + z * w); m[2] = 2 * (x * z - y * w); m[3] = 0;
  m[4] = 2 * (x * y - z * w); m[5] = 1 - 2 * (x * x + z * z); m[6] = 2 * (y * z + x * w); m[7] = 0;
  m[8] = 2 * (x * z + y * w); m[9] = 2 * (y * z - x * w); m[10] = 1 - 2 * (x * x + y * y); m[11] = 0;
  m[15] = 1;
}

// Matrizes globais dos ossos no quadro t (chaves locais; G = L * G[pai]).
export function poseAt(anim, t) {
  const n = anim.bones.length, G = new Array(n), q = new Float32Array(4), v = new Float32Array(3);
  for (let k = 0; k < n; k++) {
    const b = anim.bones[k], L = new Float32Array(16);
    if (sampleKeys(b.rf, b.rq, 4, t, q)) quatInto(q, L); else L.set(b.lb);
    if (sampleKeys(b.tf, b.tv, 3, t, v)) { L[12] = v[0]; L[13] = v[1]; L[14] = v[2]; }
    else { L[12] = b.lb[12]; L[13] = b.lb[13]; L[14] = b.lb[14]; }
    L[15] = 1;
    G[k] = (b.parent >= 0 && b.parent < k) ? mul(L, G[b.parent], new Float32Array(16)) : L;
  }
  return G;
}

export function frameAt(anim, seconds) {
  const len = Math.max(1, anim.e - anim.s);
  return anim.s + ((seconds * FPS) % len);
}

// Skinning de uma malha: G = poses globais (ou null = pose de referência); W = mundo (row-major).
// Escreve posições/normais já espelhadas no X em outP/outN.
export function skinMesh(mesh, G, W, outP, outN) {
  const nb = mesh.nb, S = new Array(nb), tmp = new Float32Array(16);
  for (let k = 0; k < nb; k++) {
    if (G && k < G.length) { const sk = new Float32Array(16); mul(mesh.ib.subarray(k * 16, k * 16 + 16), G[k], tmp); mul(tmp, W, sk); S[k] = sk; }
    else S[k] = W;
  }
  const P = mesh.pos, N = mesh.nrm, bi = mesh.bi, bw = mesh.bw, nv = mesh.nv;
  for (let i = 0; i < nv; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2];
    let px = 0, py = 0, pz = 0, qx = 0, qy = 0, qz = 0, ws = 0;
    for (let j = 0; j < 4; j++) {
      const w = bw[i * 4 + j]; if (w <= 0) continue;
      const m = nb ? S[Math.min(bi[i * 4 + j], nb - 1)] : W;
      px += w * (x * m[0] + y * m[4] + z * m[8] + m[12]);
      py += w * (x * m[1] + y * m[5] + z * m[9] + m[13]);
      pz += w * (x * m[2] + y * m[6] + z * m[10] + m[14]);
      qx += w * (nx * m[0] + ny * m[4] + nz * m[8]);
      qy += w * (nx * m[1] + ny * m[5] + nz * m[9]);
      qz += w * (nx * m[2] + ny * m[6] + nz * m[10]);
      ws += w;
    }
    if (ws <= 0) {   // vértice sem peso: só a matriz de mundo
      const m = W;
      px = x * m[0] + y * m[4] + z * m[8] + m[12]; py = x * m[1] + y * m[5] + z * m[9] + m[13]; pz = x * m[2] + y * m[6] + z * m[10] + m[14];
      qx = nx * m[0] + ny * m[4] + nz * m[8]; qy = nx * m[1] + ny * m[5] + nz * m[9]; qz = nx * m[2] + ny * m[6] + nz * m[10];
    }
    outP[i * 3] = -px; outP[i * 3 + 1] = py; outP[i * 3 + 2] = pz;
    outN[i * 3] = -qx; outN[i * 3 + 1] = qy; outN[i * 3 + 2] = qz;
  }
}

export function translation(x, y, z) { const m = new Float32Array(IDENT); m[12] = x; m[13] = y; m[14] = z; return m; }
