import os
from fontTools.ttLib import TTFont

font_dir = r"D:\Nojin\brand\eco-nojin-design-system-v2-qa\assets\fonts"
for f in sorted(os.listdir(font_dir)):
    if not f.endswith(".woff2"):
        continue
    ft = TTFont(os.path.join(font_dir, f))
    name = ft["name"]
    fam = name.getDebugName(1)
    sub = name.getDebugName(2)
    os2 = ft["OS/2"]
    usWeight = os2.usWeightClass
    head = ft["head"].unitsPerEm
    # count glyphs
    nglyph = len(ft.getGlyphOrder())
    print(f"{fam:24} | {sub:12} | usWeight={usWeight} | upem={head} | glyphs={nglyph} | {f[:28]}")