import { RACES, SEXES, raceClasses } from "../catalog.js";
import Seg from "./Seg.jsx";

// Em quem ver o item (fantasia, set, arma, montaria, asa): fica entre a vitrine e a pintura.
// A classe escolhe o corpo do personagem (Mago e Ranger são Elfos, mas com corpo e armadura diferentes).
export default function RaceSex({ dress, onDress, t }) {
  return (
    <div className="racebar" role="group" aria-label={t("view.on")}>
      <span className="label">{t("view.on")}</span>
      <Seg label={t("race")} options={RACES.map((r) => [r, t("race." + r)])} value={dress.race} onChange={(race) => onDress({ race })} />
      <Seg label={t("cls.label")} options={raceClasses(dress.race).map((c) => [c.id, t("cls." + c.id)])} value={dress.cls} onChange={(cls) => onDress({ cls })} />
      <Seg label={t("sex")} options={SEXES.map((s) => [s, t("sex." + s)])} value={dress.sex} onChange={(sex) => onDress({ sex })} />
    </div>
  );
}
