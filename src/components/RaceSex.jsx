import { RACES } from "../catalog.js";
import Seg from "./Seg.jsx";

const SEXES = [["m", "Masculino"], ["f", "Feminino"]];

// Em quem ver o item (fantasia, montaria, asa): fica entre a vitrine e a pintura.
export default function RaceSex({ dress, onDress }) {
  return (
    <div className="racebar" role="group" aria-label="Ver em">
      <span className="label">Ver em</span>
      <Seg label="Raça" options={RACES} value={dress.race} onChange={(race) => onDress({ race })} />
      <Seg label="Gênero" options={SEXES} value={dress.sex} onChange={(sex) => onDress({ sex })} />
    </div>
  );
}
