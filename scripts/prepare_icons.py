"""Ícones oficiais de pets, asas e fantasias: converte os atlas gerados na extração (icons.py) para
public/data/icons/<atlas>.webp e grava `ic: [atlas, n]` em cada visual do catalog.json (n = célula do atlas,
1-based, 32x32 px, 16 por linha). Rodar de novo depois de prepare_data.py/merge_body1.py, que regeram o catálogo
sem esse campo.
Uso: python scripts/prepare_icons.py [pasta_com_atlas_e_icons.json]"""
import json, os, sys
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\Tools\galeria-shaiya-data\site_icons"
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")
ICONS = os.path.join(DST, "icons")

icons = json.load(open(os.path.join(SRC, "icons.json"), encoding="utf8"))
os.makedirs(ICONS, exist_ok=True)
for atlas in sorted({a for a, _ in icons.values()}):
    im = Image.open(os.path.join(SRC, atlas + ".png"))
    out = os.path.join(ICONS, atlas + ".webp")
    im.save(out, "WEBP", quality=92, method=6)
    print(f"{atlas}.webp  {os.path.getsize(out) / 1024:.0f} KB")

path = os.path.join(DST, "catalog.json")
cat = json.load(open(path, encoding="utf8"))
n = 0
for rows in (cat["catalog"], cat["costumes"]):
    for g in rows:
        g.pop("ic", None)
        x = g["items"][0]
        ic = icons.get(f"{x[0]}-{x[1]}")
        if ic:
            g["ic"] = ic
            n += 1
with open(path, "w", encoding="utf8", newline="") as f:
    json.dump(cat, f, ensure_ascii=False, separators=(",", ":"))
print(n, "visuais com ícone em catalog.json")
