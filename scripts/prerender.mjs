// Páginas para buscadores e para compartilhar, geradas DEPOIS do `vite build` (npm/bun run build):
//   - uma por item, uma por categoria e a inicial, nos 3 idiomas (endereços em src/routes.js);
//   - sitemap.xml (com as versões de cada idioma), robots.txt e 404.html.
// Cada página é o dist/index.html do build com título, descrição, links canônicos/alternativos e um conteúdo
// estático dentro de #root (nome, atributos, versões, links) — é o que o buscador lê sem rodar JavaScript; o
// app troca esse conteúdo ao montar e abre o item pelo endereço. Usa os mesmos textos, rotas e atributos do app.
// Endereço dos links absolutos (canônico, sitemap, imagem): SITE_URL (env) > domínio de produção que a Vercel
// informa no build (VERCEL_PROJECT_PRODUCTION_URL — acompanha um domínio próprio, se um dia tiver) > MAIN_SITE.
// O build do GitHub Pages também aponta para a Vercel: lá é só uma cópia.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { makeT, HTML_LANG } from "../src/i18n.js";
import { statChips, mobSummary, mobVariant, LANG_IX } from "../src/catalog.js";
import { MAIN_SITE, ROUTE_LANGS, ROUTE_CATS, itemId, itemPath, catPath, homePath } from "../src/routes.js";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(repo, "dist");
const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const SITE = (process.env.SITE_URL || (vercelProd ? `https://${vercelProd}/` : MAIN_SITE)).replace(/\/?$/, "/");
const LANG_NAME = { pt: "Português", es: "Español", en: "English" };
const OG_LOCALE = { pt: "pt_BR", es: "es_ES", en: "en_US" };
const HREFLANG = { pt: "pt-BR", es: "es", en: "en" };
const NEIGHBORS = 12;   // links "mais itens" em cada página de item

const readJSON = (f) => JSON.parse(fs.readFileSync(path.join(dist, "data", f), "utf8"));
const catalog = readJSON("catalog.json");
const gear = readJSON("gear.json");
const TR = { pt: null, es: readJSON("i18n/es.json"), en: readJSON("i18n/en.json") };
const MOBS = fs.existsSync(path.join(dist, "data", "monsters.json")) ? readJSON("monsters.json").mobs : [];
const TPL = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const HAS_OG = fs.existsSync(path.join(dist, "og.jpg"));   // imagem de compartilhamento (public/og.jpg, 1200x630)

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const oneLine = (s) => String(s || "").replace(/\s+/g, " ").trim();
const clip = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");
const sortKey = (g) => g.name.replace(/^[[(]SP[\])]\s*/i, "");

// ── catálogo por idioma (mesma montagem do App: loc / gearL / lists) ──────────────────────────
function localizeItems(items, tr) {
  if (!tr) return items;
  return items.map((x) => { const l = tr.items[`${x[0]}-${x[1]}`]; return l ? [x[0], x[1], l[0], x[3], l[1]] : x; });
}

function buildLists(lang) {
  const tr = TR[lang], li = LANG_IX[lang];
  const mk = (rows, kind, cat) => rows.map((g, k) => {
    const l = tr && tr[kind][k];
    const items = localizeItems(g.items || [[g.t, g.i, g.name]], tr);
    const desc = l && l.desc != null ? l.desc : g.desc;
    return { cat: cat || g.cat, raw: g, name: l ? l.name : g.name, desc: desc || (items[0] && items[0][4]) || "", items };
  });
  const it = (x) => [x[0], x[1], x[2][li] || x[2][0], x[3], x[4][li] || x[4][0]];
  const costumes = mk(catalog.costumes, "costumes", "costume");
  const other = mk(catalog.catalog, "catalog");
  const out = {
    costume: costumes,
    set: gear.sets.map((g) => ({ cat: "set", raw: g, name: g.name, desc: "", items: g.items.map(it) })),
    weapon: gear.weapons.map((g) => {
      const items = g.items.map(it);
      return { cat: "weapon", raw: g, name: g.name[li] || g.name[0], desc: (items[0] && items[0][4]) || "", items };
    }),
    mount: other.filter((g) => g.cat === "mount"),
    wing: other.filter((g) => g.cat === "wing"),
    pet: other.filter((g) => g.cat === "pet"),
    monster: MOBS.map((g) => ({ cat: "monster", raw: g, name: g.name[li] || g.name[0], desc: "", items: [] })),
  };
  for (const c of ROUTE_CATS) {
    out[c].sort((x, y) => sortKey(x).localeCompare(sortKey(y), lang, { sensitivity: "base" }));
    for (const g of out[c]) {
      g.id = itemId(c, g.raw);
      g.rel = itemPath(lang, c, g.name, g.id);
    }
  }
  return out;
}

const LISTS = Object.fromEntries(ROUTE_LANGS.map((l) => [l, buildLists(l)]));
// id → endereço em cada idioma (links alternativos)
const ALT = Object.fromEntries(ROUTE_CATS.map((c) => [c, {}]));
for (const l of ROUTE_LANGS) for (const c of ROUTE_CATS) for (const g of LISTS[l][c]) (ALT[c][g.id] ||= {})[l] = g.rel;

// ── montagem da página ────────────────────────────────────────────────────────────────────────
const pages = new Map();   // rel → html
const sitemap = [];        // { alts: {lang: rel} }

function swap(html, re, to, what) {
  if (!re.test(html)) throw new Error(`index.html sem ${what} — o template mudou?`);
  return html.replace(re, to);
}

function render({ lang, rel, title, desc, alts, crumbs, body }) {
  const depth = rel.split("/").filter(Boolean).length;
  const url = SITE + rel;
  const head = [];
  head.push(`<link rel="canonical" href="${esc(url)}" />`);
  for (const l of ROUTE_LANGS) if (alts[l] != null) head.push(`<link rel="alternate" hreflang="${HREFLANG[l]}" href="${esc(SITE + alts[l])}" />`);
  if (alts.pt != null) head.push(`<link rel="alternate" hreflang="x-default" href="${esc(SITE + alts.pt)}" />`);
  head.push(`<meta property="og:type" content="website" />`, `<meta property="og:site_name" content="Galeria Shaiya" />`,
    `<meta property="og:title" content="${esc(title)}" />`, `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`, `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    `<meta name="twitter:card" content="${HAS_OG ? "summary_large_image" : "summary"}" />`);
  if (HAS_OG) head.push(`<meta property="og:image" content="${esc(SITE)}og.jpg" />`, `<meta property="og:image:width" content="1200" />`, `<meta property="og:image:height" content="630" />`);
  if (crumbs.length > 1) {
    const ld = { "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: SITE + c.rel })) };
    head.push(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`);
  }
  let html = TPL;
  html = swap(html, /<html lang="[^"]*">/, `<html lang="${HTML_LANG[lang]}">`, "<html lang>");
  // <base> logo no começo do <head>: tudo que é relativo (./assets, ./favicon.svg, links do conteúdo) aponta p/ a raiz
  if (depth) html = swap(html, /<head>/, `<head>\n    <base href="${"../".repeat(depth)}" />`, "<head>");
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`, "<title>");
  html = swap(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(desc)}" />`, "meta description");
  html = swap(html, /<\/head>/, `    ${head.join("\n    ")}\n  </head>`, "</head>");
  html = swap(html, /<div id="root"><\/div>/, `<div id="root">${body}</div>`, '<div id="root">');
  if (pages.has(rel)) throw new Error(`endereço repetido: ${rel}`);
  pages.set(rel, html);
}

const crumbHtml = (crumbs) => `<nav class="crumbs">${crumbs.map((c, i) => (i < crumbs.length - 1 ? `<a href="${esc(c.rel || "./")}">${esc(c.name)}</a>` : esc(c.name))).join(" › ")}</nav>`;
const langLinks = (t, alts, lang) => {
  const links = ROUTE_LANGS.filter((l) => l !== lang && alts[l] != null)
    .map((l) => `<a href="${esc(alts[l] || "./")}" hreflang="${HREFLANG[l]}" lang="${HTML_LANG[l]}">${LANG_NAME[l]}</a>`);
  return links.length ? `<p class="crumbs">${esc(t("seo.langs"))}: ${links.join(" · ")}</p>` : "";
};

// ── páginas ───────────────────────────────────────────────────────────────────────────────────
const homeAlts = Object.fromEntries(ROUTE_LANGS.map((l) => [l, homePath(l)]));
for (const lang of ROUTE_LANGS) {
  const t = makeT(lang), L = LISTS[lang];
  const home = { name: "Galeria Shaiya", rel: homePath(lang) };

  // inicial
  const cats = ROUTE_CATS.map((c) => `<li><a href="${esc(catPath(lang, c))}">${esc(t("tab." + c))}</a> (${L[c].length})</li>`).join("");
  render({
    lang, rel: home.rel, title: t("seo.home_title"), desc: t("seo.home_desc"), alts: homeAlts, crumbs: [home],
    body: `<div class="wrap seo"><header><h1>Galeria Shaiya</h1><p class="lede">${esc(t("lede"))}</p></header>`
      + `<section><h2>${esc(t("seo.categories"))}</h2><ul>${cats}</ul></section>${langLinks(t, homeAlts, lang)}</div>`,
  });
  if (lang === "pt") sitemap.push({ alts: homeAlts });   // o sitemap lista os 3 idiomas de cada página de uma vez

  for (const c of ROUTE_CATS) {
    const list = L[c];
    const catCrumb = { name: t("tab." + c), rel: catPath(lang, c) };
    const catAlts = Object.fromEntries(ROUTE_LANGS.map((l) => [l, catPath(l, c)]));

    // categoria: todos os itens
    render({
      lang, rel: catCrumb.rel,
      title: t("seo.cat_title", { tab: t("tab." + c) }),
      desc: t("seo.cat_desc", { tab: t("tab." + c), n: list.length }),
      alts: catAlts, crumbs: [home, catCrumb],
      body: `<div class="wrap seo"><header>${crumbHtml([home, catCrumb])}<h1>${esc(t("tab." + c))}</h1>`
        + `<p class="lede">${esc(t("seo.cat_desc", { tab: t("tab." + c), n: list.length }))}</p></header>`
        + `<ul class="cols">${list.map((g) => `<li><a href="${esc(g.rel)}">${esc(g.name)}</a></li>`).join("")}</ul>`
        + `${langLinks(t, catAlts, lang)}</div>`,
    });
    if (lang === "pt") sitemap.push({ alts: catAlts });

    // item
    list.forEach((g, i) => {
      const crumbs = [home, catCrumb, { name: g.name, rel: g.rel }];
      const gearCat = c === "set" || c === "weapon", isMob = c === "monster";
      const versions = isMob
        ? g.raw.v.map((v) => `<li>${esc(mobVariant(v, t, lang))}</li>`).join("")
        : g.items.map((x) => {
          const chips = statChips(x[3], x[0], t, gearCat).map((s) => s.text).join(" · ");
          return `<li>${esc(x[2])}${chips ? ` — ${esc(chips)}` : ""}</li>`;
        }).join("");
      const gdesc = isMob ? `${mobSummary(g.raw, t)}. ${g.raw.el ? t("mob.el", { e: t("el." + g.raw.el) }) : t("mob.noel")}.` : g.desc;
      const near = [];
      for (let d = 1; near.length < Math.min(NEIGHBORS, list.length - 1); d++) {
        near.push(list[(i + d) % list.length]);
        if (near.length < Math.min(NEIGHBORS, list.length - 1)) near.push(list[(i - d + list.length) % list.length]);
      }
      const intro = t(isMob ? "seo.item_desc_mob" : "seo.item_desc", { name: g.name, cat: t("cat." + c) });
      const desc = clip(oneLine(`${intro} ${oneLine(gdesc)}`), 158);
      const alts = ALT[c][g.id];
      render({
        lang, rel: g.rel, title: t("seo.item_title", { name: g.name, cat: t("cat." + c) }), desc, alts, crumbs,
        body: `<div class="wrap seo"><header>${crumbHtml(crumbs)}<h1>${esc(g.name)}</h1>`
          + `<p class="lede">${esc(intro)}</p></header>`
          + (gdesc ? `<p class="desc">${esc(gdesc)}</p>` : "")
          + `<section><h2>${esc(t(isMob ? "mob.variants" : "seo.versions"))}</h2><ul>${versions}</ul></section>`
          + `<section><h2>${esc(t("seo.more", { tab: t("tab." + c) }))}</h2><ul class="cols">`
          + near.map((n) => `<li><a href="${esc(n.rel)}">${esc(n.name)}</a></li>`).join("")
          + `</ul><p><a href="${esc(catCrumb.rel)}">${esc(t("seo.all"))}</a></p></section>`
          + `${langLinks(t, alts, lang)}</div>`,
      });
      if (lang === "pt") sitemap.push({ alts });
    });
  }
}

// ── grava ─────────────────────────────────────────────────────────────────────────────────────
for (const [rel, html] of pages) {
  const dir = path.join(dist, ...rel.split("/").filter(Boolean));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}

// 404: qualquer endereço desconhecido abre o app na inicial (base ABSOLUTA, serve em qualquer profundidade).
// A base é a raiz DESTE build (/shaiya-costumes/ no Pages, / na Vercel), não a do endereço principal.
const rootPath = process.env.GITHUB_ACTIONS ? `/${(process.env.GITHUB_REPOSITORY || "/shaiya-costumes").split("/")[1]}/` : "/";
const notFound = TPL.replace(/<head>/, `<head>\n    <base href="${rootPath}" />\n    <meta name="robots" content="noindex" />`);
fs.writeFileSync(path.join(dist, "404.html"), notFound);

const today = new Date().toISOString().slice(0, 10);
const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const { alts } of sitemap) {
  const links = ROUTE_LANGS.filter((l) => alts[l] != null)
    .map((l) => `<xhtml:link rel="alternate" hreflang="${HREFLANG[l]}" href="${esc(SITE + alts[l])}"/>`)
    .concat(alts.pt != null ? [`<xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE + alts.pt)}"/>`] : []);
  for (const l of ROUTE_LANGS) {
    if (alts[l] == null) continue;
    xml.push(`<url><loc>${esc(SITE + alts[l])}</loc><lastmod>${today}</lastmod>${links.join("")}</url>`);
  }
}
xml.push("</urlset>");
fs.writeFileSync(path.join(dist, "sitemap.xml"), xml.join("\n") + "\n");
fs.writeFileSync(path.join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

const counts = ROUTE_CATS.map((c) => `${c} ${LISTS.pt[c].length}`).join(", ");
console.log(`prerender: ${pages.size} páginas (${counts} × ${ROUTE_LANGS.length} idiomas), sitemap ${xml.length - 3} URLs, base ${SITE}${HAS_OG ? "" : " — sem og.jpg"}`);
