"""Copia os dados gerados na extração (site2/) para public/data/, dividindo as fantasias por variante."""
import os, sys, json, shutil

SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\kirap\AppData\Local\Temp\claude\c--Dev-ShaiyaBot\e691149f-4559-4cc3-8204-5943f7b20f94\scratchpad\site2"
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")
for sub in ("m", "c", "k", "mask"):
    os.makedirs(os.path.join(DST, sub), exist_ok=True)

for sub in ("m", "c"):
    for f in os.listdir(os.path.join(SRC, sub)):
        shutil.copyfile(os.path.join(SRC, sub, f), os.path.join(DST, sub, f))
shutil.copyfile(os.path.join(SRC, "mask", "masks.json"), os.path.join(DST, "mask", "masks.json"))

data = json.load(open(os.path.join(SRC, "data.json"), encoding="utf-8"))
n = 0
for c in data["costumes"]:
    kd = json.load(open(os.path.join(SRC, "k", c["f"])))
    name = c["f"].rsplit(".", 1)[0]
    os.makedirs(os.path.join(DST, "k", name), exist_ok=True)
    for code, parts in kd["codes"].items():
        used = {p["t"] for p in parts}
        json.dump({"parts": parts, "tex": {k: v for k, v in kd["tex"].items() if k in used}},
                  open(os.path.join(DST, "k", name, code + ".json"), "w"), separators=(",", ":"))
        n += 1
    c["f"] = name
json.dump(data, open(os.path.join(DST, "catalog.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

def du(p): return sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(p) for f in fs) / 1e6
print(f"fantasias: {len(data['costumes'])} ({n} arquivos por variante)  |  total public/data: {du(DST):.1f} MB")
