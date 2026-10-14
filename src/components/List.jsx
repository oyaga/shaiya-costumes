import { useEffect, useRef } from "react";

export default function List({ tab, rows, cur, onSelect, t }) {
  const ref = useRef(null);
  useEffect(() => {   // ao trocar de aba, mostra o item selecionado
    const el = ref.current && ref.current.querySelector('[aria-current="true"]');
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [tab]);

  return (
    <ul className="list" ref={ref}>
      {rows.length ? rows.map((g) => {
        const n = (g.items || []).length;
        return (
          <li key={g.k}>
            <button type="button" className="row" aria-current={g.k === cur} onClick={() => onSelect(g.k)}>
              <span className="nm">{g.name}</span>
              <span className="sub">{n === 1 ? t("list.one") : t("list.many", { n })}</span>
              <span className="cnt">#{String(g.k).padStart(3, "0")}</span>
            </button>
          </li>
        );
      }) : <li className="empty">{t("list.empty")}</li>}
    </ul>
  );
}
