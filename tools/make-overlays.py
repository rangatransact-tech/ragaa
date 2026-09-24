#!/usr/bin/env python3
"""Pre-renders the gold RaGaa monogram + date overlays used for the WhatsApp
link-preview images, a text-only fallback preview card, and the favicons.

Already run: the outputs are committed. Re-run only if you change the design:
    pip install pillow && python3 tools/make-overlays.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools" / "fonts"
OUT_TOOLS = ROOT / "tools" / "overlays"
PUB = ROOT / "public"
OUT_TOOLS.mkdir(exist_ok=True)

KOHL = (20, 14, 10)
ZARI = (214, 176, 106)
ZARI_HI = (235, 203, 139)
JASMINE = (245, 238, 223)

script = lambda s: ImageFont.truetype(str(FONTS / "Carattere-Regular.ttf"), s)
italic = lambda s: ImageFont.truetype(str(FONTS / "EBGaramond-Italic.ttf"), s)




def centered(d, y, text, font, fill, W):
    l, t, r, b = d.textbbox((0, 0), text, font=font)
    d.text(((W - (r - l)) / 2 - l, y - t), text, font=font, fill=fill)


def overlay(W, H, mono_y, mono_size, date_y, date_size, grad_top, grad_bottom):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # dark gradients so the gold never sits on bright light
    g = Image.new("L", (1, H))
    for y in range(H):
        a = 0
        if y < grad_top:
            a = max(a, int(215 * (1 - y / grad_top) ** 1.3))
        if y > H - grad_bottom:
            a = max(a, int(230 * ((y - (H - grad_bottom)) / grad_bottom) ** 1.2))
        g.putpixel((0, y), a)
    shade = Image.new("RGBA", (W, H), KOHL + (0,))
    shade.putalpha(g.resize((W, H)))
    img = Image.alpha_composite(img, shade)

    text = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(text)
    centered(d, mono_y, "RaGaa", script(mono_size), ZARI + (255,), W)
    centered(d, date_y, "1 November 2026", italic(date_size), JASMINE + (240,), W)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow.putalpha(text.getchannel("A").filter(ImageFilter.GaussianBlur(8)).point(lambda v: v * 0.7))
    shadow = Image.composite(Image.new("RGBA", (W, H), (8, 5, 3, 255)), Image.new("RGBA", (W, H), (0, 0, 0, 0)), shadow.getchannel("A"))
    img = Image.alpha_composite(img, shadow)
    return Image.alpha_composite(img, text)


def rings_mark(size, stroke, bg=None):
    """Two interlinked gold rings (favicon / fallback card)."""
    S = size * 4
    im = Image.new("RGBA", (S, S), bg + (255,) if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = S * 0.25
    cy = S * 0.5
    for cx, col in ((S * 0.39, ZARI), (S * 0.61, ZARI_HI)):
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col + (255,), width=int(stroke * 4))
    return im.resize((size, size), Image.LANCZOS)


# overlays for ffmpeg (photo underneath)
overlay(1200, 630, 34, 132, 548, 40, 250, 170).save(OUT_TOOLS / "og-1200x630.png")
overlay(1080, 1080, 60, 170, 950, 50, 360, 260).save(OUT_TOOLS / "og-1080.png")

# text-only fallback preview cards (used until ring.jpg is processed)
for (W, H, name, mono_y, ms, date_y, ds) in ((1200, 630, "og-1200x630.jpg", 150, 190, 430, 48), (1080, 1080, "og-square.jpg", 300, 230, 690, 58)):
    card = Image.new("RGB", (W, H), KOHL)
    glow = Image.new("L", (W, H), 0)
    ImageDraw.Draw(glow).ellipse([W * 0.3, H * 0.15, W * 0.7, H * 0.85], fill=60)
    card = Image.composite(Image.new("RGB", (W, H), (46, 34, 24)), card, glow.filter(ImageFilter.GaussianBlur(W * 0.08)))
    d = ImageDraw.Draw(card)
    centered(d, mono_y, "RaGaa", script(ms), ZARI, W)
    centered(d, date_y, "Ranganadh & Gaayathri", italic(ds), JASMINE, W)
    centered(d, date_y + ds * 1.5, "1 November 2026", italic(int(ds * 0.8)), ZARI, W)
    (PUB / "og").mkdir(exist_ok=True)
    card.save(PUB / "og" / name, quality=88)

# favicons
rings_mark(32, 2.4).save(PUB / "favicon-32.png")
touch = Image.new("RGB", (180, 180), KOHL)
touch.paste(rings_mark(150, 7.5), (15, 15), rings_mark(150, 7.5))
touch.save(PUB / "apple-touch-icon.png")
print("done")
