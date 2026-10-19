import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

// Ícone com endereço absoluto: o app troca o endereço da página (history.replaceState, ver App.jsx) e o
// navegador buscaria "./favicon.svg" de novo a partir do endereço novo.
for (const l of document.querySelectorAll('link[rel~="icon"]')) l.href = l.href;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
