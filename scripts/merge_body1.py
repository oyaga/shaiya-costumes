"""Junta o corpo 1 (Clérigo/Mago/Pagão/Oráculo e Caçador) ao public/data já existente.
Entrada: a pasta gerada pela extração só com os 8 corpos novos (c/<code>.json, k/NNN.json, data.json).
- c/<code>.json → public/data/c/
- fantasias: casa pelo item (tipo/id) com as do catalog.json e grava k/<pasta>/<code>.json ao lado das outras
- catalog.json: acrescenta os personagens novos em "chars"."""
import os, sys, json

SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\Tools\galeria-shaiya-data\site2b"
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")

new = json.load(open(os.path.join(SRC, "data.json"), encoding="utf-8"))
cat_path = os.path.join(DST, "catalog.json")
cat = json.load(open(cat_path, encoding="utf-8"))

for f in os.listdir(os.path.join(SRC, "c")):
    with open(os.path.join(SRC, "c", f), "rb") as a, open(os.path.join(DST, "c", f), "wb") as b:
        b.write(a.read())

folder = {(c["t"], c["i"]): c["f"] for c in cat["costumes"]}
n = miss = 0
for c in new["costumes"]:
    name = folder.get((c["t"], c["i"]))
    if not name:
        miss += 1
        continue
    kd = json.load(open(os.path.join(SRC, "k", c["f"])))
    os.makedirs(os.path.join(DST, "k", name), exist_ok=True)
    for code, parts in kd["codes"].items():
        used = {p["t"] for p in parts}
        json.dump({"parts": parts, "tex": {k: v for k, v in kd["tex"].items() if k in used}},
                  open(os.path.join(DST, "k", name, code + ".json"), "w"), separators=(",", ":"))
        n += 1

cat["chars"].update(new["chars"])
json.dump(cat, open(cat_path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

def du(p): return sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(p) for f in fs) / 1e6
print(f"personagens: {sorted(new['chars'])} | fantasias: {n} arquivos novos ({miss} sem par no catálogo) | "
      f"total public/data: {du(DST):.1f} MB")
