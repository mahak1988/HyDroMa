import os
from fontTools.ttLib import TTFont

FONT_DIR = r"D:\Nojin\brand\eco-nojin-design-system-v2-qa\assets\fonts"
for f in sorted(os.listdir(FONT_DIR)):
    if not f.endswith(".woff2"):
        continue
    ft = TTFont(os.path.join(FONT_DIR, f))
    n = ft["name"]
    print(f"{f[:34]:34} | fam1={n.getDebugName(1)!r} | fam16={n.getDebugName(16)!r} | sub2={n.getDebugName(2)!r} | sub17={n.getDebugName(17)!r}")