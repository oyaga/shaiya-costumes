# Galeria Shaiya

Catálogo 3D não oficial de **fantasias, montarias, asas e pets** de Shaiya, com animação, provador (monte o visual completo por raça e gênero) e pintura (a tintura do jogo, reproduzida do shader do cliente).

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
- `c/<code>.json` — personagem base por raça/gênero (humf, huwf, elmr, elwr, vimr, viwr, demf, dewf): corpo, animações e a matriz de encaixe da asa.
- `k/NNN/<code>.json` — fantasia por variante de raça/gênero.
- `mask/masks.json` — máscaras de pintura (`<textura>_M.dds` do jogo, canal vermelho).

Shaiya e seus modelos pertencem aos respectivos donos. Este catálogo não tem ligação com o jogo nem com a publisher.
