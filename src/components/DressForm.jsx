import { RACES } from "../catalog.js";
import Seg from "./Seg.jsx";

const SEXES = [["m", "Masculino"], ["f", "Feminino"]];

function Pick({ id, label, list, value, none, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : +e.target.value)}>
        <option value="">{none}</option>
        {list.map((g) => <option key={g.k} value={g.k}>{g.name}</option>)}
      </select>
    </div>
  );
}

export default function DressForm({ dress, lists, onChange }) {
  const rnd = (a) => a[Math.floor(Math.random() * a.length)].k;
  return (
    <div className="form">
      <div className="field"><span className="label">Raça</span><Seg label="Raça" options={RACES} value={dress.race} onChange={(race) => onChange({ race })} /></div>
      <div className="field"><span className="label">Gênero</span><Seg label="Gênero" options={SEXES} value={dress.sex} onChange={(sex) => onChange({ sex })} /></div>
      <Pick id="d-costume" label="Fantasia" list={lists.costume} value={dress.costume} none="Sem fantasia (armadura inicial)" onChange={(costume) => onChange({ costume })} />
      <Pick id="d-wing" label="Asa" list={lists.wing} value={dress.wing} none="Sem asa" onChange={(wing) => onChange({ wing })} />
      <Pick id="d-pet" label="Pet" list={lists.pet} value={dress.pet} none="Sem pet" onChange={(pet) => onChange({ pet })} />
      <Pick id="d-mount" label="Montaria" list={lists.mount} value={dress.mount} none="A pé" onChange={(mount) => onChange({ mount })} />
      <div className="btnrow">
        <button type="button" className="btn primary" onClick={() => onChange({ costume: rnd(lists.costume), wing: rnd(lists.wing), pet: rnd(lists.pet), mount: Math.random() < 0.5 ? rnd(lists.mount) : null })}>Visual aleatório</button>
        <button type="button" className="btn" onClick={() => onChange({ costume: null, wing: null, pet: null, mount: null })}>Limpar</button>
      </div>
    </div>
  );
}
