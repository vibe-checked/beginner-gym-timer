#!/usr/bin/env python3
"""Beginner Gym Timer — App Store frames, BolTools layout (dark + lime brand).
Screens 1+2 = one phone spanning a 2-wide composite, sliced. 3+ = zig-zag.
Grey bezel, 1320x2868 (6.9")."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1320, 2868
BG_TOP = (46, 50, 63); BG_BOT = (13, 15, 22)      # dark slate→near-black (matches icon gradient)
ACCENT = (248, 178, 20)                            # amber/orange (matches icon timer accent)
DST = "/Users/mhsu/Desktop/beginner-gym-timer/appstore-screenshots"
ICON = "/Users/mhsu/Desktop/beginner-gym-timer/assets/images/icon.png"
ZW = 1150

def font(sz, bold=True):
    for p in (["/System/Library/Fonts/Supplemental/Arial Bold.ttf"] if bold
              else ["/System/Library/Fonts/Supplemental/Arial.ttf"]) + ["/System/Library/Fonts/Helvetica.ttc"]:
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return ImageFont.load_default()

def background(width=W):
    g = 96; b = Image.new("RGB", (1, g)); px = b.load()
    for y in range(g):
        t = y / (g - 1); px[0, y] = tuple(int(BG_TOP[i] + (BG_BOT[i] - BG_TOP[i]) * t) for i in range(3))
    bg = b.resize((width, H), Image.LANCZOS).convert("RGBA")
    wm = Image.new("RGBA", (width, H), (0, 0, 0, 0)); d = ImageDraw.Draw(wm)
    cx = width // 2
    d.ellipse([cx - 720, H - 1180, cx + 360, H - 100], fill=(*ACCENT, 12))
    d.ellipse([cx - 470, H - 930, cx + 110, H - 350], fill=(255, 255, 255, 10))
    d.ellipse([width - 360, 180, width + 520, 1060], outline=(*ACCENT, 28), width=78)
    bg.alpha_composite(wm); return bg

def rounded(img, rad):
    m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, img.size[0]-1, img.size[1]-1], radius=rad, fill=255)
    o = img.convert("RGBA"); o.putalpha(m); return o

def device(shot, sw):
    sh = int(shot.size[1] * sw / shot.size[0])
    screen = rounded(shot.resize((sw, sh), Image.LANCZOS), int(sw*0.115))
    bez = max(16, sw // 36); bw, bh = sw + bez * 2, sh + bez * 2
    body = rounded(Image.new("RGBA", (bw, bh), (206, 208, 214, 255)), int(sw*0.115) + bez)
    ImageDraw.Draw(body).rounded_rectangle([3, 3, bw-4, bh-4], radius=int(sw*0.115)+bez-3, outline=(150, 152, 160, 255), width=2)
    body.alpha_composite(screen, (bez, bez)); return body

def shadow(canvas, img, x, y, op=0.45, blur=36, dy=24):
    a = img.split()[3].point(lambda v: int(v * op)); s = Image.new("RGBA", img.size, (0,0,0,0)); s.putalpha(a)
    layer = Image.new("RGBA", canvas.size, (0,0,0,0)); layer.alpha_composite(s, (x, y + dy))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))

def seg(t): return [(w.strip("*"), w.startswith("*") and w.endswith("*")) for w in t.split()]

def wrap_lines(d, segments, maxw, regf, boldf):
    sp = d.textlength(" ", font=regf); lines = 1; curw = 0
    for word, bold in segments:
        f = boldf if bold else regf; ww = d.textlength(word, font=f); add = ww + (sp if curw else 0)
        if curw + add <= maxw: curw += add
        else: lines += 1; curw = ww
    return lines

def rich(d, segments, y, maxw, regf, boldf, fill=(255,255,255,255), lh=92, left=None, bold_fill=None):
    sp = d.textlength(" ", font=regf); lines, cur, curw = [], [], 0
    for word, bold in segments:
        f = boldf if bold else regf; ww = d.textlength(word, font=f); add = ww + (sp if cur else 0)
        if curw + add <= maxw: cur.append((word, bold, ww)); curw += add
        else: lines.append((cur, curw)); cur, curw = [(word, bold, ww)], ww
    if cur: lines.append((cur, curw))
    cw = W if left is None else None
    for ln, lw in lines:
        x = (cw - lw) / 2 if left is None else left
        for word, bold, ww in ln:
            col = bold_fill if (bold and bold_fill) else fill
            d.text((x, y), word, font=(boldf if bold else regf), fill=col); x += ww + sp
        y += lh
    return y

# ── Screens 1 + 2: one phone spanning a 2-wide composite, then sliced ─────────
def hero_pair(shot):
    CW = 2 * W
    c = background(CW); d = ImageDraw.Draw(c)
    def ctext(t, y, f, fill):
        w = d.textlength(t, font=f); d.text(((W - w) / 2, y), t, font=f, fill=fill)
    icx = (W - 480) // 2
    ic = rounded(Image.open(ICON).convert("RGB").resize((480, 480), Image.LANCZOS), 104)
    sa = ic.split()[3].point(lambda v: int(v * 0.5)); sh = Image.new("RGBA", ic.size, (0,0,0,0)); sh.putalpha(sa)
    bl = Image.new("RGBA", (CW, H), (0,0,0,0)); bl.alpha_composite(sh, (icx, 560 + 20))
    c.alpha_composite(bl.filter(ImageFilter.GaussianBlur(36))); c.alpha_composite(ic, (icx, 560))
    ctext("Beginner Gym Timer", 1150, font(104), (255, 255, 255, 255))
    ctext("No excuses — just press start", 1300, font(56, bold=False), (210, 216, 226, 255))
    def draw_check(x, y, s=44, color=(*ACCENT, 255)):
        d.line([(x, y + s*0.55), (x + s*0.40, y + s*0.95), (x + s*1.05, y + s*0.06)],
               fill=color, width=12, joint="curve")
    bullets = ["Dead-simple — nothing to learn", "Just the essentials, no overwhelm",
               "Quick ~25-minute sessions", "Free forever — no paywall"]
    bfont = font(52, bold=False)
    bw = 92 + max(d.textlength(b, font=bfont) for b in bullets)
    bx = int((W - bw) / 2); by = 1500
    for b in bullets:
        draw_check(bx + 4, by + 4)
        d.text((bx + 92, by), b, font=bfont, fill=(238, 242, 248, 255))
        by += 104
    ph = device(Image.open(shot).convert("RGB"), sw=1125).rotate(-20, expand=True, resample=Image.BICUBIC)
    px = 1050; py = (H - ph.size[1]) // 2
    shadow(c, ph, px, py, blur=42)
    c.alpha_composite(ph, (px, py))
    c.crop((0, 0, W, H)).convert("RGB").save(f"{DST}/z-1-hero.png")
    c.crop((W, 0, CW, H)).convert("RGB").save(f"{DST}/z-2-hero.png")
    print("wrote z-1-hero, z-2-hero (spanning pair)")

# ── Zig-zag full phones ───────────────────────────────────────────────────────
def panel(out, headline, shot, vpos, sub="", sw=ZW):
    c = background(); d = ImageDraw.Draw(c)
    hf, bf = font(78, bold=False), font(78, bold=True)
    sf, sbf = font(48, bold=False), font(48, bold=True)
    ph = device(Image.open(shot).convert("RGB"), sw=sw)
    x = (W - ph.size[0]) // 2
    hlines = wrap_lines(d, seg(headline), W - 130, hf, bf)
    slines = wrap_lines(d, seg(sub), W - 150, sf, sbf) if sub else 0
    block = hlines * 98 + (14 + slines * 60 if sub else 0)
    if vpos == "low":      # phone bleeds off the bottom; text centered in the top gap
        py = 520
        ty = max(120, (py - block) // 2)
    else:                   # phone bleeds off the top; text centered in the bottom gap
        py = (H - 440) - ph.size[1]
        pb = py + ph.size[1]
        ty = pb + (H - pb - block) // 2
    ey = rich(d, seg(headline), ty, W - 130, hf, bf, lh=98, bold_fill=(*ACCENT, 255))
    if sub: rich(d, seg(sub), ey + 14, W - 150, sf, sbf, fill=(206, 213, 224, 255), lh=60)
    shadow(c, ph, x, py); c.alpha_composite(ph, (x, py))
    c.convert("RGB").save(f"{DST}/{out}"); print("wrote", out)

HOME   = f"{DST}/raw-home.png"
TIMER  = f"{DST}/raw-timer.png"
SET    = f"{DST}/raw-set.png"
RESUME = f"{DST}/raw-resume.png"

hero_pair(TIMER)
panel("z-3-simple.png",   "Simple *by* *design*",             HOME, "low",
      sub="No menus to learn — open and go")
panel("z-4-timer.png",    "A rest timer you *can't* *miss*",  TIMER, "high",
      sub="Big countdown between every set")
panel("z-5-sets.png",     "One *tap* per set",                SET, "low",
      sub="Finish a set — it cues your rest and what's next")
panel("z-6-noexcuse.png", "*No* more *excuses*",              HOME, "high",
      sub="So easy there's no reason to skip the gym")
panel("z-7-guides.png",   "It *guides* every rest",           TIMER, "low",
      sub="Just follow along — set to set")
panel("z-8-resume.png",   "*Resume* where you left off",      RESUME, "high",
      sub="Step away — your workout waits for you")
panel("z-9-free.png",     "Why *pay* for simple?",            SET, "low",
      sub="Free forever — no subscription, no card")
panel("z-10-quick.png",   "In and out in *~25* *minutes*",    HOME, "high",
      sub="A quick session beats no session")
print("done")
