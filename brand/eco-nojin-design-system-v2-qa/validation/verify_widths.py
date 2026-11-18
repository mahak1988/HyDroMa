import os, re
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONT_DIR = r"D:\Nojin\brand\eco-nojin-design-system-v2-qa\assets\fonts"
FAMILY_FILE = {
    "Fraunces": "6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2",
    "Manrope": "xn7gYHE41ni1AdIRggexSg.woff2",
    "DM Sans": "rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2",
    "IBM Plex Mono": "-F63fjptAgt5VM-kVkqdyU8n1iEq129k.woff2",
}

def fam(name):
    n = name.lower().strip()
    for k, v in (("manrope","Manrope"),("dm sans","DM Sans"),("fraunces","Fraunces"),("ibm plex mono","IBM Plex Mono")):
        if n.startswith(k): return v
    return name

def load(family, weight, size):
    ft = TTFont(os.path.join(FONT_DIR, FAMILY_FILE[family]))
    axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in ft["fvar"].axes}
    loc = {}
    if "wght" in axes:
        lo,_,hi = axes["wght"]; loc["wght"] = max(lo, min(hi, float(weight)))
    if "opsz" in axes:
        lo,_,hi = axes["opsz"]; loc["opsz"] = max(lo, min(hi, float(size)))
    return instantiateVariableFont(ft, loc, inplace=False)

def width(ft, text, size, track):
    upem = ft["head"].unitsPerEm; cmap = ft.getBestCmap(); hmtx = ft["hmtx"]
    w = sum(hmtx[cmap[ord(c)]][0] for c in text if ord(c) in cmap) * size / upem
    return w + track * len(text)

# (text, family, weight, size, tracking, browser_width)
cases = [
    ("Eco", "Fraunces", 600, 78, -3, 116.47),
    ("Nojin", "Fraunces", 500, 78, -2.5, 167.34),
    ("Eco Nojin", "Manrope", 800, 64, -1.5, 320.75),
    ("Hy", "Manrope", 750, 82, -5, 96.94),
    ("Dro", "Manrope", 750, 82, -5, 127.61),
    ("MA", "Manrope", 750, 82, -5, 116.53),
    ("HyDroMA", "DM Sans", 700, 74, -2.5, 319.63),
    ("Hy", "Manrope", 800, 80, -4, 96.33),
    ("Dro", "Manrope", 400, 80, -3, 120.09),
    ("Nojin", "DM Sans", 750, 69, -3.5, 156.59),
    ("Nojin Marketplace", "Manrope", 800, 58, -2, 483.19),
]
for text, f, w, s, tr, bw in cases:
    ft = load(f, w, s)
    mine = width(ft, text, s, tr)
    print(f"{f:12} w{w} s{s} {text!r:20} mine={mine:7.1f}  browser={bw:7.1f}  diff={mine-bw:+6.1f}")