# Galeria Shaiya

Catálogo 3D não oficial de **fantasias, sets, armas, montarias, asas e pets** de Shaiya, com animação, provador (monte o visual completo por raça, classe e gênero, com set, arma e escudo na mão) e pintura (a tintura do jogo, reproduzida do shader do cliente).

Cada raça joga três classes, e a classe escolhe o corpo do personagem — por isso o mesmo set veste diferente no Ranger e no Mago, que são Elfos:

| Raça | Corpo 0 | Corpo 1 |
|---|---|---|
| Humano | Lutador, Defensor (humf/huwf) | Clérigo (humm/huwm) |
| Elfo | Ranger, Arqueiro (elmr/elwr) | Mago (elmm/elwm) |
| Vail | Assassino (vimr/viwr) | Pagão, Oráculo (vimm/viwm) |
| Deatheater | Guerreiro, Guardião (demf/dewf) | Caçador (demr/dewr) |

`?cls=mage&sex=f` no endereço abre o site já nessa classe e gênero.

Site: https://oyaga.github.io/shaiya-costumes/

## Rodar localmente

```sh
bun install
bun run dev
```

`bun run build` gera a versão estática em `dist/`. O deploy no GitHub Pages é automático a cada push na `main` (`.github/workflows/deploy.yml`). O build usa caminhos relativos (`base: "./"`), então a mesma `dist/` funciona na raiz de qualquer host estático (Vercel, Netlify…).

## Dados

`public/data/` contém os modelos e texturas extraídos do cliente do jogo (data.spk de 12/10/2026), já convertidos:

- `catalog.json` — índice: visuais (montarias, asas, pets), fantasias, personagens base e os itens com cada visual (atributos e descrição em PT).
- `m/NNN.json` — montaria/asa/pet: malhas com esqueleto, animações (parado/andando/correndo), texturas em JPEG embutido e, nas montarias, o osso da sela por raça.
- `c/<code>.json` — personagem base por raça/corpo/gênero (os 16 códigos da tabela acima): corpo, animações e a matriz de encaixe da asa.
- `k/NNN/<code>.json` — fantasia por variante de raça/corpo/gênero.
- `mask/masks.json` — máscaras de pintura (`<textura>_M.dds` do jogo, canal vermelho).
- `gear.json` — sets (peças, bônus por quantidade de peças vestidas) e armas/escudos agrupados por visual, com nomes e descrições em PT/ES/EN. O cliente só tem o nome do set em inglês.
- `s/NNN/<code>.json` — peças de armadura de um set por raça/gênero (trocam só as vagas que o set tem; o elmo esconde o cabelo).
- `w/NNNN.json` — arma ou escudo: malha estática presa ao osso da mão.
- `c/<code>-st.json` — posturas com arma do personagem (uma mão, duas mãos, duas armas, lança, arco…), qual postura cada tipo de arma usa e os ossos das mãos.
- Para atualizar sets e armas a partir de uma nova extração: `python scripts/prepare_gear.py <pasta site_gear>`.
- Personagens e fantasias do corpo 1 extraídos à parte: `python scripts/merge_body1.py <pasta>` (casa as fantasias pelo item e acrescenta os personagens no `catalog.json`).
- `i18n/es.json`, `i18n/en.json` — nomes e descrições dos itens em espanhol e inglês, das tabelas de texto do próprio cliente (`DBItemText_SPN` / `DBItemText_USA`); `i18n/search.json` junta os nomes nos três idiomas para a busca.

O site tem interface em português, espanhol e inglês (`src/i18n.js`); a busca acha um item pelo nome em qualquer um dos três.

Shaiya e seus modelos pertencem aos respectivos donos. Este catálogo não tem ligação com o jogo nem com a publisher.
