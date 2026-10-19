import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// Ícone com endereço absoluto: o app troca o endereço da página (history.replaceState, ver App.jsx) e o
// navegador buscaria "./favicon.svg" de novo a partir do endereço novo.
for (const l of document.querySelectorAll('link[rel~="icon"]')) l.href = l.href;

// Vercel Web Analytics, só no build da Vercel (o script /_vercel/insights só existe lá). Conta UMA visita por
// página aberta — o endereço em que a pessoa chegou, guardado antes de o app trocar o endereço —, não cada item
// clicado: o plano grátis tem 50 mil eventos/mês para a conta toda. route agrupa as páginas de item por categoria.
if (import.meta.env.VITE_VERCEL) {
  const path = location.pathname;
  const route = path.replace(/[^/]+-\d+(?:-\d+)?\/$/, "[item]/");
  import("@vercel/analytics").then(({ inject, pageview }) => {
    inject({ disableAutoTrack: true });
    pageview({ route, path });
  });
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
