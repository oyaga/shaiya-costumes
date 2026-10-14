// Botões segmentados (raça, gênero, alvo da pintura…): options = [[value, label]]
export default function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  );
}
