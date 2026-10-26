import { DATA_BASE } from "../config.js";

// Ícone oficial do item (public/data/icons/<atlas>.webp, scripts/prepare_icons.py): células de 32 px, 16 por
// linha; ic = [atlas, n] com n a partir de 1. O atlas é desenhado à escala do ícone e deslocado até a célula.
export default function Icon({ ic, size = 40 }) {
  if (!ic) return null;
  const n = ic[1] - 1;
  return (
    <span className="ico" aria-hidden="true" style={{
      width: size, height: size, backgroundImage: `url(${DATA_BASE}icons/${ic[0]}.webp)`,
      backgroundSize: `${size * 16}px auto`, backgroundPosition: `${-(n % 16) * size}px ${-Math.floor(n / 16) * size}px`,
    }} />
  );
}
