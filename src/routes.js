// Endereço de cada item (uma página por item, para buscadores e para compartilhar):
//   <idioma>/<categoria>/<nome>-<id>/   — o português fica na raiz, sem prefixo.
// O id vem do jogo (tipo-id do 1º item; set = id do set), então o endereço não muda quando os dados são regerados.
// Usado pelo app (abre o item do endereço e mantém o endereço em dia) e por scripts/prerender.mjs (gera as páginas).
import { norm } from "./catalog.js";

export const ROUTE_LANGS = ["pt", "es", "en"];
export const ROUTE_CATS = ["costume", "set", "weapon", "mount", "wing", "pet"];
export const CAT_SEG = {
  pt: { costume: "fantasia", set: "set", weapon: "arma", mount: "montaria", wing: "asa", pet: "pet" },
  es: { costume: "disfraz", set: "conjunto", weapon: "arma", mount: "montura", wing: "alas", pet: "mascota" },
  en: { costume: "costume", set: "set", weapon: "weapon", mount: "mount", wing: "wings", pet: "pet" },
};

export const langPrefix = (lang) => (lang === "pt" ? "" : lang + "/");

export function slugify(s) {
  const out = norm(s).replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return out.slice(0, 60).replace(/-+$/, "") || "item";
}

/** Id estável do item no jogo. Serve para as linhas das listas (que guardam os campos originais). */
export function itemId(cat, g) {
  if (!g) return "";
  if (cat === "set") return String(g.id);
  if (cat === "costume") return `${g.t}-${g.i}`;
  const x = g.items && g.items[0];
  return x ? `${x[0]}-${x[1]}` : "";
}

export const homePath = (lang) => langPrefix(lang);
export const catPath = (lang, cat) => `${langPrefix(lang)}${CAT_SEG[lang][cat]}/`;
export const itemPath = (lang, cat, name, id) => `${catPath(lang, cat)}${slugify(name)}-${id}/`;

/**
 * Caminho relativo à raiz do site → { lang, cat, id }. Raiz ("") = { lang: null } (vale o idioma do navegador);
 * sem categoria conhecida = só o idioma.
 */
export function parseRoute(rel) {
  const parts = rel.split("/").filter((p) => p && p !== "index.html");
  if (!parts.length) return { lang: null };
  let lang = "pt";
  if (parts[0] === "es" || parts[0] === "en") lang = parts.shift();
  const cat = ROUTE_CATS.find((c) => CAT_SEG[lang][c] === parts[0]);
  if (!cat) return { lang };
  const m = (parts[1] || "").match(cat === "set" ? /-(\d+)$/ : /-(\d+-\d+)$/);
  return { lang, cat, id: m ? m[1] : null };
}
