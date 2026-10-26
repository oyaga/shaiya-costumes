# Galeria Shaiya

Catálogo 3D não oficial de **fantasias, sets, armas, montarias, asas, pets e monstros** de Shaiya, com animação, provador (monte o visual completo por raça, classe e gênero, com set, arma e escudo na mão) e pintura (a tintura do jogo, reproduzida do shader do cliente).

Cada raça joga três classes, e a classe escolhe o corpo do personagem — por isso o mesmo set veste diferente no Ranger e no Mago, que são Elfos:

| Raça | Corpo 0 | Corpo 1 |
|---|---|---|
| Humano | Lutador, Defensor (humf/huwf) | Clérigo (humm/huwm) |
| Elfo | Ranger, Arqueiro (elmr/elwr) | Mago (elmm/elwm) |
| Vail | Assassino (vimr/viwr) | Pagão, Oráculo (vimm/viwm) |
| Deatheater | Guerreiro, Guardião (demf/dewf) | Caçador (demr/dewr) |

`?cls=mage&sex=f` no endereço abre o site já nessa classe e gênero.

**Comparar** mostra duas vitrines lado a lado (A e B): a lista, o provador, a pintura e a raça/classe mexem no lado ativo, e "Trocar A ↔ B" inverte os dois.

Site: https://shaiya-costumes.vercel.app/ (cópia no GitHub Pages: https://oyaga.github.io/shaiya-costumes/, com os links canônicos apontando para a Vercel)

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

Os links absolutos (canônico, sitemap, imagem) usam, nesta ordem: `SITE_URL`, o domínio de produção que a Vercel informa no build (`VERCEL_PROJECT_PRODUCTION_URL` — acompanha um domínio próprio, se o projeto ganhar um) ou `MAIN_SITE` em `src/routes.js` (`https://shaiya-costumes.vercel.app/`). O build do GitHub Pages também aponta para a Vercel.

## Analytics

Vercel Web Analytics, ligado só no build da Vercel (`VERCEL=1` → `VITE_VERCEL` em `vite.config.js`); a cópia do GitHub Pages fica sem. Conta uma visita por página aberta (o endereço em que a pessoa chegou), não cada item clicado — o plano grátis tem 50 mil eventos por mês. Precisa estar ativado no painel da Vercel (Analytics → Enable).

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
- `icons/{pet,pet123,wing,costume}.webp` — ícones oficiais do cliente (`interface/icon/icon_pet`, `icon_123_pet`, `icon_wing`, `icon_DualLayer`), atlas de células 32×32 (16 por linha); cada visual do `catalog.json` traz `ic: [atlas, n]` (n a partir de 1 = campo `icon` do DBItemData). Gerados por `icons.py` (pasta privada de extração) e gravados por `python scripts/prepare_icons.py <pasta>`, que deve rodar de novo depois de `prepare_data.py`/`merge_body1.py` (eles regeram o catálogo sem o campo). Montarias, sets, armas e monstros não têm ícone nesses atlas.
- `monsters.json` — monstros (aba Monstros): nome em PT/ES/EN (`DBMonsterText_BRZ|SPN|USA` do cliente), elemento e as versões `[id, nível, HP, EXP]` de cada um (`DBMonsterData`). Só os de verdade: sem nomes "???"/de teste, nível 1–999 e HP > 0 (pets, asas e invocações ficam de fora). Um registro por nome + modelo + cor.
- `mob/NNN.json` — modelo do monstro (NNN = índice no `Monster.MON` do cliente; vários monstros usam o mesmo), no formato do `m/`, com as animações parado/andando/correndo/atacando/morrendo. Para atualizar: `python scripts/prepare_monsters.py <pasta site_mob>`.
- `i18n/es.json`, `i18n/en.json` — nomes e descrições dos itens em espanhol e inglês, das tabelas de texto do próprio cliente (`DBItemText_SPN` / `DBItemText_USA`); `i18n/search.json` junta os nomes nos três idiomas para a busca.

O site tem interface em português, espanhol e inglês (`src/i18n.js`); a busca acha um item pelo nome em qualquer um dos três.

Shaiya e seus modelos pertencem aos respectivos donos. Este catálogo não tem ligação com o jogo nem com a publisher.
