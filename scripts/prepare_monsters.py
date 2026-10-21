"""Copia os monstros gerados na extração (site_mob/) para public/data/.
monsters.json (lista: nomes pt/es/en, elemento, versões [id, nível, HP, EXP]) e mob/NNN.json (um modelo por
entrada do Monster.MON do cliente, com animações parado/andando/correndo/atacando/morrendo)."""
import os, sys, shutil

SRC = sys.argv[1] if len(sys.argv) > 1 else r"C:\Tools\galeria-shaiya-data\site_mob"
DST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "data")

shutil.rmtree(os.path.join(DST, "mob"), ignore_errors=True)
shutil.copytree(os.path.join(SRC, "mob"), os.path.join(DST, "mob"))
shutil.copyfile(os.path.join(SRC, "monsters.json"), os.path.join(DST, "monsters.json"))

def du(p): return sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(p) for f in fs) / 1e6
print(f"monstros {du(os.path.join(DST, 'mob')):.1f} MB ({len(os.listdir(os.path.join(DST, 'mob')))} modelos) | monsters.json "
      f"{os.path.getsize(os.path.join(DST, 'monsters.json')) / 1e6:.2f} MB | total public/data {du(DST):.1f} MB")
