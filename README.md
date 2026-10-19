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

**Comparar** mostra duas vitrines lado a lado (A e B): a lista, o provador, a pintura e a raça/classe mexem no lado ativo, e "Trocar A ↔ B" inverte os dois.

Site: https://oyaga.github.io/shaiya-costumes/

## Rodar localmente

```sh
bun install
bun run dev
```

`bun run build` gera a versão estática em `dist/`. O deploy no GitHub Pages é automático a cada push na `main` (`.github/workflows/deploy.yml`). O build usa caminhos relativos (`base: "./"`), então a mesma `dist/` funciona na raiz de qualquer host estático (Vercel, Netlify…).

## Página por item

Depois do `vite build`, `scripts/prerender.mjs` gera uma página HTML para cada item, cada categoria e a inicial, nos três idiomas (o português fica na raiz):

```
fantasia/sp-dracula-150-67/      es/disfraz/sp-dracula-150-67/      en/costume/sp-draculea-150-67/
```

O número no fim é o id do item no jogo (tipo-id; set = id do set), então o endereço não muda quando os dados são regerados. Cada página tem título, descrição, link canônico, as versões nos outros idiomas (`hreflang`), imagem de compartilhamento (`public/og.jpg`) e um conteúdo estático com nome, atributos e links, que é o que os buscadores leem; o app abre por cima e mantém o endereço em dia enquanto você navega. Também saem `sitemap.xml`, `robots.txt` e `404.html`. Rotas em `src/routes.js` (as mesmas no app e no gerador).

Os links absolutos usam `SITE_URL` (padrão: `https://oyaga.github.io/shaiya-costumes/`). Para publicar em outro endereço: `SITE_URL=https://meu-dominio/ bun run build`.

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
