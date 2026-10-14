// Textos da interface em pt / es / en. Os nomes e descrições dos itens vêm do próprio cliente do jogo
// (public/data/i18n/<lang>.json); aqui só ficam os textos do site. Termos seguem o cliente de cada idioma
// (es: Disfraz, Montura, Mascota, Alas, "Tinte de Crowlis"; en: Costume, Mount, Pet, Wing, "Crowly Dye").
export const LANGS = [["pt", "PT"], ["es", "ES"], ["en", "EN"]];
export const HTML_LANG = { pt: "pt-BR", es: "es", en: "en" };

const STR = {
  pt: {
    "lang": "Idioma",
    "eyebrow": "Catálogo não oficial · dados do cliente de {date}",
    "lede": "Fantasias, montarias, asas e pets do jogo em 3D e animados. No provador você monta o visual completo: escolha raça, fantasia, asa, pet e montaria e veja tudo junto.",
    "load.catalog": "Carregando catálogo…",
    "load.error": "Não foi possível carregar o catálogo ({e}). Recarregue a página.",
    "tabs": "Seção",
    "tab.dress": "Provador", "tab.costume": "Fantasias", "tab.mount": "Montarias", "tab.wing": "Asas", "tab.pet": "Pets",
    "cat.costume": "Fantasia", "cat.mount": "Montaria", "cat.wing": "Asa", "cat.pet": "Pet",
    "search": "Buscar pelo nome (em qualquer idioma)",
    "race": "Raça", "sex": "Gênero",
    "race.hu": "Humano", "race.el": "Elfo", "race.vi": "Vail", "race.de": "Deatheater",
    "sex.m": "Masculino", "sex.f": "Feminino",
    "who": "{race} {sex}", "who.m": "masculino", "who.f": "feminino",
    "none.costume": "Sem fantasia (armadura inicial)", "none.wing": "Sem asa", "none.pet": "Sem pet", "none.mount": "A pé",
    "btn.random": "Visual aleatório", "btn.clear": "Limpar", "btn.try": "Usar no provador",
    "list.one": "1 item", "list.many": "{n} itens", "list.empty": "Nada encontrado para essa busca nesta categoria.",
    "view.on": "Ver em",
    "det.dress": "Provador · {who}", "det.starter": "Armadura inicial", "det.nothing": "Nada equipado além da armadura inicial",
    "det.items": "Itens com este visual", "det.model": "Modelo: {m} · animações: {a}", "det.noanim": "nenhuma",
    "motion": "Animação", "mo.idle": "Parado", "mo.walk": "Andando", "mo.run": "Correndo",
    "mol.idle": "parado", "mol.walk": "andando", "mol.run": "correndo",
    "camera": "Câmera", "cam.front": "Frente", "cam.side": "Lado", "cam.back": "Costas", "cam.spin": "Girar",
    "view3d": "Visualização 3D",
    "st.loading": "Carregando modelo…", "st.start": "Carregando…",
    "st.error": "Não foi possível carregar este modelo. Tente de novo ou escolha outro item.",
    "st.webgl": "Seu navegador não conseguiu iniciar o WebGL, então a visualização 3D não está disponível aqui.",
    "dye.title": "Pintura (tintura Crowly)", "dye.off": "Tirar pintura", "dye.piece": "Peça a pintar",
    "dye.h": "Giro de matiz", "dye.s": "Saturação", "dye.v": "Brilho", "dye.preset": "Giro {h}°",
    "dye.mask": "Este item tem máscara de pintura: só as partes que o jogo marca recebem a cor.",
    "dye.nomask": "Sem máscara: a cor se aplica à peça inteira, como o jogo faz.",
    "dye.hint": "Mova os controles para pintar. São os mesmos três parâmetros que o servidor manda ao cliente; as cores que cada tintura sorteia são decididas pelo servidor.",
    "foot.hint": "Arraste para girar, role ou pince para aproximar. Rostos padrão de cada raça; efeitos de partícula não incluídos; montarias na variação humana.",
    "foot.legal": "Projeto de fã, sem ligação com o jogo ou a publisher. Shaiya e seus modelos pertencem aos respectivos donos.",
    "foot.code": "Código no GitHub",
    "attr": "FOR,DES,REC,INT,SAB,SOR",
    "stat.all": "+{v} em todos os atributos", "stat.crit": "Dano crítico +{v}%", "stat.speed": "Velocidade {v} u/s (a pé: 5)",
    "stat.cast": "Invocação {v} s", "stat.seats": "2 assentos", "stat.level": "Nível {v}",
    "stat.day": "1 dia", "stat.days": "{v} dias", "stat.hours": "{v} h", "stat.perm": "Permanente",
  },
  es: {
    "lang": "Idioma",
    "eyebrow": "Catálogo no oficial · datos del cliente del {date}",
    "lede": "Disfraces, monturas, alas y mascotas del juego en 3D y animados. En el probador armas el look completo: elige raza, disfraz, alas, mascota y montura y míralo todo junto.",
    "load.catalog": "Cargando catálogo…",
    "load.error": "No se pudo cargar el catálogo ({e}). Recarga la página.",
    "tabs": "Sección",
    "tab.dress": "Probador", "tab.costume": "Disfraces", "tab.mount": "Monturas", "tab.wing": "Alas", "tab.pet": "Mascotas",
    "cat.costume": "Disfraz", "cat.mount": "Montura", "cat.wing": "Alas", "cat.pet": "Mascota",
    "search": "Buscar por nombre (cualquier idioma)",
    "race": "Raza", "sex": "Género",
    "race.hu": "Humano", "race.el": "Elfo", "race.vi": "Vail", "race.de": "Deatheater",
    "sex.m": "Masculino", "sex.f": "Femenino",
    "who": "{race} {sex}", "who.m": "masculino", "who.f": "femenino",
    "none.costume": "Sin disfraz (armadura inicial)", "none.wing": "Sin alas", "none.pet": "Sin mascota", "none.mount": "A pie",
    "btn.random": "Look aleatorio", "btn.clear": "Limpiar", "btn.try": "Usar en el probador",
    "list.one": "1 objeto", "list.many": "{n} objetos", "list.empty": "No hay resultados para esta búsqueda en esta categoría.",
    "view.on": "Ver en",
    "det.dress": "Probador · {who}", "det.starter": "Armadura inicial", "det.nothing": "Nada equipado además de la armadura inicial",
    "det.items": "Objetos con este aspecto", "det.model": "Modelo: {m} · animaciones: {a}", "det.noanim": "ninguna",
    "motion": "Animación", "mo.idle": "Quieto", "mo.walk": "Caminando", "mo.run": "Corriendo",
    "mol.idle": "quieto", "mol.walk": "caminando", "mol.run": "corriendo",
    "camera": "Cámara", "cam.front": "Frente", "cam.side": "Lado", "cam.back": "Espalda", "cam.spin": "Girar",
    "view3d": "Vista 3D",
    "st.loading": "Cargando modelo…", "st.start": "Cargando…",
    "st.error": "No se pudo cargar este modelo. Inténtalo de nuevo o elige otro objeto.",
    "st.webgl": "Tu navegador no pudo iniciar WebGL, así que la vista 3D no está disponible aquí.",
    "dye.title": "Tinte (tinte de Crowlis)", "dye.off": "Quitar tinte", "dye.piece": "Pieza a teñir",
    "dye.h": "Giro de matiz", "dye.s": "Saturación", "dye.v": "Brillo", "dye.preset": "Giro {h}°",
    "dye.mask": "Este objeto tiene máscara de tinte: solo las partes que marca el juego reciben el color.",
    "dye.nomask": "Sin máscara: el color se aplica a toda la pieza, como hace el juego.",
    "dye.hint": "Mueve los controles para teñir. Son los mismos tres parámetros que el servidor envía al cliente; los colores que sortea cada tinte los decide el servidor.",
    "foot.hint": "Arrastra para girar, usa la rueda o pellizca para acercar. Caras estándar de cada raza; sin efectos de partículas; monturas en la variante humana.",
    "foot.legal": "Proyecto de fans, sin vínculo con el juego ni con la editora. Shaiya y sus modelos pertenecen a sus respectivos dueños.",
    "foot.code": "Código en GitHub",
    "attr": "STR,DEX,REC,INT,WIS,LUC",
    "stat.all": "+{v} a todos los atributos", "stat.crit": "Daño crítico +{v}%", "stat.speed": "Velocidad {v} u/s (a pie: 5)",
    "stat.cast": "Invocación {v} s", "stat.seats": "2 asientos", "stat.level": "Nivel {v}",
    "stat.day": "1 día", "stat.days": "{v} días", "stat.hours": "{v} h", "stat.perm": "Permanente",
  },
  en: {
    "lang": "Language",
    "eyebrow": "Unofficial catalog · client data from {date}",
    "lede": "The game's costumes, mounts, wings and pets in animated 3D. In the fitting room you build the full look: pick race, costume, wings, pet and mount and see it all together.",
    "load.catalog": "Loading catalog…",
    "load.error": "Could not load the catalog ({e}). Reload the page.",
    "tabs": "Section",
    "tab.dress": "Fitting room", "tab.costume": "Costumes", "tab.mount": "Mounts", "tab.wing": "Wings", "tab.pet": "Pets",
    "cat.costume": "Costume", "cat.mount": "Mount", "cat.wing": "Wings", "cat.pet": "Pet",
    "search": "Search by name (any language)",
    "race": "Race", "sex": "Gender",
    "race.hu": "Human", "race.el": "Elf", "race.vi": "Vail", "race.de": "Deatheater",
    "sex.m": "Male", "sex.f": "Female",
    "who": "{race} {sex}", "who.m": "male", "who.f": "female",
    "none.costume": "No costume (starter armor)", "none.wing": "No wings", "none.pet": "No pet", "none.mount": "On foot",
    "btn.random": "Random look", "btn.clear": "Clear", "btn.try": "Try it in the fitting room",
    "list.one": "1 item", "list.many": "{n} items", "list.empty": "Nothing found for this search in this category.",
    "view.on": "View on",
    "det.dress": "Fitting room · {who}", "det.starter": "Starter armor", "det.nothing": "Nothing equipped besides the starter armor",
    "det.items": "Items with this look", "det.model": "Model: {m} · animations: {a}", "det.noanim": "none",
    "motion": "Animation", "mo.idle": "Idle", "mo.walk": "Walk", "mo.run": "Run",
    "mol.idle": "idle", "mol.walk": "walk", "mol.run": "run",
    "camera": "Camera", "cam.front": "Front", "cam.side": "Side", "cam.back": "Back", "cam.spin": "Spin",
    "view3d": "3D view",
    "st.loading": "Loading model…", "st.start": "Loading…",
    "st.error": "Could not load this model. Try again or pick another item.",
    "st.webgl": "Your browser couldn't start WebGL, so the 3D view isn't available here.",
    "dye.title": "Dye (Crowly dye)", "dye.off": "Remove dye", "dye.piece": "Piece to dye",
    "dye.h": "Hue shift", "dye.s": "Saturation", "dye.v": "Brightness", "dye.preset": "Shift {h}°",
    "dye.mask": "This item has a dye mask: only the parts the game marks get the color.",
    "dye.nomask": "No mask: the color applies to the whole piece, as the game does.",
    "dye.hint": "Move the sliders to dye. These are the same three parameters the server sends to the client; the colors each dye rolls are chosen by the server.",
    "foot.hint": "Drag to rotate, scroll or pinch to zoom. Default face for each race; particle effects not included; mounts shown in the human variant.",
    "foot.legal": "Fan project, not affiliated with the game or its publisher. Shaiya and its models belong to their respective owners.",
    "foot.code": "Code on GitHub",
    "attr": "STR,DEX,REC,INT,WIS,LUC",
    "stat.all": "+{v} to all stats", "stat.crit": "Critical damage +{v}%", "stat.speed": "Speed {v} u/s (on foot: 5)",
    "stat.cast": "Summon time {v} s", "stat.seats": "2 seats", "stat.level": "Level {v}",
    "stat.day": "1 day", "stat.days": "{v} days", "stat.hours": "{v} h", "stat.perm": "Permanent",
  },
};

export function makeT(lang) {
  const d = STR[lang] || STR.pt;
  return (key, vars) => {
    let s = d[key] ?? STR.pt[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}

const KEY = "galeria-lang";
export function initialLang() {
  try { const v = localStorage.getItem(KEY); if (STR[v]) return v; } catch (e) { /* sem storage */ }
  const nav = (typeof navigator !== "undefined" && (navigator.languages || [navigator.language])) || [];
  for (const l of nav) {
    const p = String(l || "").slice(0, 2).toLowerCase();
    if (STR[p]) return p;
  }
  return "en";
}
export function saveLang(lang) {
  try { localStorage.setItem(KEY, lang); } catch (e) { /* sem storage */ }
}
