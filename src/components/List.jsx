import { useEffect, useRef } from "react";
import { mobSummary } from "../catalog.js";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Linha de baixo: tipo (armadura/acessórios no set, postura na arma) + quantos itens têm o visual; no monstro,
// nível e elemento
function sub(g, t) {
  if (g.cat === "monster") return mobSummary(g, t);
  const n = (g.items || []).length;
  const count = n === 1 ? t("list.one") : t("list.many", { n });
  if (g.cat === "set") return `${t(g.f ? "set.armor" : "set.acc")} · ${count}`;
  if (g.cat === "weapon") return `${cap(t("kind." + g.kind))} · ${count}`;
  return count;
}

export default function List({ tab, rows, cur, onSelect, t }) {
  const ref = useRef(null);
  useEffect(() => {   // ao trocar de aba, mostra o item selecionado
    const el = ref.current && ref.current.querySelector('[aria-current="true"]');
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [tab]);

  return (
    <ul className="list" ref={ref}>
      {rows.length ? rows.map((g) => (
        <li key={g.k}>
          <button type="button" className="row" aria-current={g.k === cur} onClick={() => onSelect(g.k)}>
            <span className="nm">{g.name}</span>
            <span className="sub">{sub(g, t)}</span>
            <span className="cnt">#{String(g.k).padStart(3, "0")}</span>
          </button>
        </li>
      )) : <li className="empty">{t("list.empty")}</li>}
    </ul>
  );
}
