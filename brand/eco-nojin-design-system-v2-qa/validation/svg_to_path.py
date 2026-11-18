"""
Text -> Path conversion proof for Eco Nojin logo SVGs (QA only).

- Reads each original SVG from assets/images (never modifies it).
- Writes an outlined test version to logo-tests/<name>.outlined.svg

Variable fonts are instanced at the requested weight and at opsz=font-size
(matching CSS font-optical-sizing:auto, which is what the browser applies).
"""
import os, re
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.varLib.instancer import instantiateVariableFont

QA = r"D:\Nojin\brand\eco-nojin-design-system-v2-qa"
FONT_DIR = os.path.join(QA, "assets", "fonts")
IMG_DIR = os.path.join(QA, "assets", "images")
OUT_DIR = os.path.join(QA, "logo-tests")
os.makedirs(OUT_DIR, exist_ok=True)

FAMILY_FILE = {
    "Fraunces": "6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2",
    "Manrope": "xn7gYHE41ni1AdIRggexSg.woff2",
    "DM Sans": "rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K4.woff2",
    "IBM Plex Mono": "-F63fjptAgt5VM-kVkqdyU8n1iEq129k.woff2",
    "Vazirmatn": "Dxxo8j6PP2D_kU2muijlGMWWMmk.woff2",
    "Estedad": "QdVWSTk1OgitjvYTJJDEvDlh.woff2",
}

def family_key(name):
    if not name:
        return None
    n = name.lower().strip()
    for k, v in (("manrope", "Manrope"), ("dm sans", "DM Sans"), ("fraunces", "Fraunces"),
                 ("ibm plex mono", "IBM Plex Mono"), ("vazirmatn", "Vazirmatn"), ("estedad", "Estedad")):
        if n.startswith(k):
            return v
    return name

def load_font(family, weight, size):
    family = family_key(family)
    fname = FAMILY_FILE.get(family)
    if not fname:
        return None
    ft = TTFont(os.path.join(FONT_DIR, fname))
    if "fvar" in ft:
        axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in ft["fvar"].axes}
        loc = {}
        if "wght" in axes:
            lo, d, hi = axes["wght"]
            loc["wght"] = max(lo, min(hi, float(weight)))
        if "opsz" in axes:
            lo, d, hi = axes["opsz"]
            loc["opsz"] = max(lo, min(hi, float(size)))
        if loc:
            ft = instantiateVariableFont(ft, loc, inplace=False)
    return ft

def outline_text(text, ft, size, x, y, fill, tracking=0.0):
    upem = ft["head"].unitsPerEm
    scale = size / upem
    cmap = ft.getBestCmap()
    hmtx = ft["hmtx"]
    gs = ft.getGlyphSet()
    pen_x = x
    paths = []
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            pen_x += tracking
            continue
        spen = SVGPathPen(gs)
        gs[gname].draw(spen)
        d = spen.getCommands()
        adv = hmtx[gname][0] * scale
        if d:
            paths.append(
                f'<path transform="translate({pen_x:.3f},{y:.3f}) scale({scale:.6f},{-scale:.6f})" '
                f'd="{d}" fill="{fill}"/>'
            )
        pen_x += adv + tracking
    return "\n".join(paths)

TEXT_RE = re.compile(r'<text(?P<attrs>[^>]*)>(?P<body>.*?)</text>', re.S)
ATTR_RE = re.compile(r'([\w:-]+)="([^"]*)"')

def convert_svg(src_path, dst_path):
    with open(src_path, "r", encoding="utf-8") as f:
        svg = f.read()
    m = re.search(r'(<svg[^>]*>)', svg)
    if not m:
        return None
    svg_open = m.group(1)
    body = svg[m.end():]
    body = body[: body.rfind("</svg>")]

    tokens, pos = [], 0
    for tm in TEXT_RE.finditer(body):
        if tm.start() > pos:
            tokens.append(("raw", body[pos:tm.start()]))
        tokens.append(("text", tm.group(0)))
        pos = tm.end()
    if pos < len(body):
        tokens.append(("raw", body[pos:]))

    out = []
    for kind, xml in tokens:
        if kind == "raw":
            out.append(xml)
            continue
        tm = TEXT_RE.match(xml)
        attrs = dict(ATTR_RE.findall(tm.group("attrs")))
        inner = tm.group("body")
        if "<tspan" in inner:
            out.append(xml)
            continue
        text = inner.strip()
        fam = attrs.get("font-family", "sans-serif").split(",")[0].strip().strip("'\"")
        weight = int(float(attrs.get("font-weight", "400")))
        size = float(attrs.get("font-size", "16"))
        fill = attrs.get("fill", "#000")
        ls = attrs.get("letter-spacing", "0")
        tracking = float(ls) if ls not in ("inherit", "normal") else 0.0
        x = float(attrs.get("x", "0"))
        y = float(attrs.get("y", "0"))
        ft = load_font(fam, weight, size)
        if ft is None:
            out.append(xml)
            continue
        out.append(outline_text(text, ft, size, x, y, fill, tracking))

    outlined = svg_open + "\n" + "\n".join(out) + "\n</svg>\n"
    with open(dst_path, "w", encoding="utf-8") as f:
        f.write(outlined)
    return dst_path

def main():
    files = sorted(f for f in os.listdir(IMG_DIR) if f.endswith(".svg"))
    for f in files:
        src = os.path.join(IMG_DIR, f)
        dst = os.path.join(OUT_DIR, f.replace(".svg", ".outlined.svg"))
        out = convert_svg(src, dst)
        print("converted:", f, "->", os.path.basename(dst) if out else "FAILED")

if __name__ == "__main__":
    main()