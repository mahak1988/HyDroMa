import os, json
from fontTools.ttLib import TTFont

font_dir = r"D:\Nojin\brand\eco-nojin-design-system-v2-qa\assets\fonts"
out = []
for f in sorted(os.listdir(font_dir)):
    if not f.endswith(".woff2"):
        continue
    try:
        ft = TTFont(os.path.join(font_dir, f))
        name = ft["name"]
        family = name.getDebugName(1)
        subfamily = name.getDebugName(2)
        full = name.getDebugName(4)
        out.append({"file": f, "family": family, "subfamily": subfamily, "full": full})
    except Exception as e:
        out.append({"file": f, "error": str(e)})

for o in out:
    print(o)