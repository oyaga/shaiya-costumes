"""Copia os sets e armas gerados na extração (site_gear/) para public/data/.
gear.json (lista), s/NNN/<code>.json (armadura por raça/gênero), w/NNNN.json (armas) e c/<code>-st.json (posturas)."""
import os, sys, shutil

SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\Tools\galeria-shaiya-data\site_gear"
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")

for sub in ("s", "w"):
    shutil.rmtree(os.path.join(DST, sub), ignore_errors=True)
    shutil.copytree(os.path.join(SRC, sub), os.path.join(DST, sub))
for f in os.listdir(os.path.join(SRC, "c")):
    shutil.copyfile(os.path.join(SRC, "c", f), os.path.join(DST, "c", f))
shutil.copyfile(os.path.join(SRC, "gear.json"), os.path.join(DST, "gear.json"))

def du(p): return sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(p) for f in fs) / 1e6
print(f"sets {du(os.path.join(DST, 's')):.1f} MB | armas {du(os.path.join(DST, 'w')):.1f} MB | gear.json "
      f"{os.path.getsize(os.path.join(DST, 'gear.json')) / 1e6:.2f} MB | total public/data {du(DST):.1f} MB")
