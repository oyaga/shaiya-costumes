// Raiz do site e pasta dos dados (public/data), ABSOLUTAS e fixadas quando a página abre: o app troca o
// endereço (history.replaceState) para a página do item aberto, e um caminho relativo ("./data/") passaria a
// apontar para dentro dela. As páginas geradas (scripts/prerender.mjs) trazem <base href> apontando para a
// raiz, então document.baseURI é a raiz em qualquer página. BASE_URL vem do vite.config.js ("./").
const baseURI = typeof document !== "undefined" ? document.baseURI : "http://localhost/";
export const SITE_ROOT = new URL(import.meta.env.BASE_URL, baseURI).href;   // termina em "/"
export const ROOT_PATH = new URL(SITE_ROOT).pathname;
export const DATA_BASE = SITE_ROOT + "data/";
export const DATA_DATE = "12/10/2026";   // data.spk do cliente usado na extração
export const REPO_URL = "https://github.com/oyaga/shaiya-costumes";
