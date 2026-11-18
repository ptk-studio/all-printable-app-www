"""December pins, versions A and B (all-printable-app-www#86, t2-manager's 15:46 scores).
A = headline on top (the first layout) with the fixes; B = sheet-led: the sheet large and angled on a seasonal colour
field, the headline overlaid in a band. Every sheet is a real render from app.all-printable.com (see render_states.py);
the only drawn additions are the string on the cut-out tags and the pen marks on the tracker (to show it in use)."""
import math, random, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

A_DIR, B_DIR, OUT = sys.argv[1], sys.argv[2], sys.argv[3]   # first-set renders (1x), second-set renders (2x), output
W, H = 1000, 1500
CREAM, INK, RED, WHITE = (243, 239, 230), (33, 30, 26), (180, 71, 46), (255, 255, 255)
GREEN, KRAFT, DEEPRED = (31, 77, 54), (196, 160, 118), (128, 38, 28)
G = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
AV = "/System/Library/Fonts/Avenir Next.ttc"
f = lambda p, s, i=0: ImageFont.truetype(p, s, index=i)
random.seed(7)


def shadowed(img, angle, blur=14, offset=(10, 16), alpha=90):
    img = img.convert("RGBA")
    rot = img.rotate(angle, expand=True, resample=Image.BICUBIC)
    sh = Image.new("RGBA", (rot.width + 80, rot.height + 80), (0, 0, 0, 0))
    mask = rot.split()[3].point(lambda a: alpha if a > 0 else 0)
    sh.paste((0, 0, 0, 255), (40 + offset[0], 40 + offset[1]), mask)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    sh.alpha_composite(rot, (40, 40))
    return sh


def paste_center(canvas, img, cx, cy):
    canvas.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def footer(d, color=RED, text_color=WHITE):
    d.rectangle([0, H - 110, W, H], fill=color)
    t = "all-printable.com  ·  free, true to size"
    tw = d.textlength(t, font=f(AV, 38))
    d.text(((W - tw) / 2, H - 82), t, font=f(AV, 38), fill=text_color)


def layout_a(sheet, head, sub, bg=CREAM, art=None):
    pin = Image.new("RGBA", (W, H), bg + (255,))
    d = ImageDraw.Draw(pin)
    d.multiline_text((70, 70), head, font=f(G, 78), fill=INK, spacing=10)
    hb = d.multiline_textbbox((70, 70), head, font=f(G, 78), spacing=10)
    d.text((72, hb[3] + 24), sub, font=f(AV, 36), fill=RED)
    top = hb[3] + 100
    if art is not None:
        art(pin, top)
    else:
        maxw, maxh = 860, H - top - 150
        s = min(maxw / sheet.width, maxh / sheet.height)
        img = sheet.resize((int(sheet.width * s), int(sheet.height * s)), Image.LANCZOS)
        paste_center(pin, shadowed(img, 0, blur=10, offset=(0, 6), alpha=70), W / 2, top + maxh / 2)
    footer(ImageDraw.Draw(pin))
    return pin.convert("RGB")


def layout_b(sheet, head, sub, field, band=CREAM, angle=-5, scale=1.0, band_y=0.06):
    pin = Image.new("RGBA", (W, H), field + (255,))
    d = ImageDraw.Draw(pin)
    for _ in range(140):   # a soft snowfall on the colour field
        x, y, r = random.randint(0, W), random.randint(0, H), random.choice([2, 3, 4])
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 40))
    y0 = int(H * band_y)
    hb = d.multiline_textbbox((0, 0), head, font=f(G, 76), spacing=8)
    bh = hb[3] + 110
    top, bottom = y0 + bh + 30, H - 140          # the sheet sits wholly between the band and the footer
    a = math.radians(abs(angle))
    # fit the ROTATED box: w' = w cos + h sin, h' = w sin + h cos
    s = min(920 / (sheet.width * math.cos(a) + sheet.height * math.sin(a)),
            (bottom - top) / (sheet.width * math.sin(a) + sheet.height * math.cos(a))) * scale
    img = sheet.resize((int(sheet.width * s), int(sheet.height * s)), Image.LANCZOS)
    paste_center(pin, shadowed(img, angle, blur=18, offset=(14, 22), alpha=120), W / 2, (top + bottom) / 2)
    d = ImageDraw.Draw(pin)
    d.rectangle([0, y0, W, y0 + bh], fill=band + (245,))
    d.multiline_text((60, y0 + 28), head, font=f(G, 76), fill=INK, spacing=8)
    d.text((62, y0 + hb[3] + 44), sub, font=f(AV, 34), fill=RED)
    footer(d, color=INK)
    return pin.convert("RGB")


# ---- the sheets ----------------------------------------------------------------------------------------------------
tags_sheet = Image.open(f"{B_DIR}/tags-named-sheet.png").convert("RGB")
cal_sheet = Image.open(f"{B_DIR}/calendar-birthdays-sheet.png").convert("RGB")
trk = Image.open(f"{B_DIR}/tracker-sheet.png").convert("RGB")
ws_sheet = Image.open(f"{A_DIR}/word-search-sheet.png").convert("RGB")
bingo_sheet = Image.open(f"{A_DIR}/bingo-sheet.png").convert("RGB")

# Tracker: a week of pen marks on three habits, in the printed circles (grid found in the 2x render).
V = [72, 480, 526, 573, 620, 666, 713, 760, 806, 853, 899, 946, 993, 1039, 1086, 1133, 1179, 1226, 1272, 1319, 1366,
     1412, 1459, 1506, 1552, 1599, 1645, 1692, 1739, 1785, 1834, 1880, 1927]
ROWS = [(214, 438), (438, 664), (664, 889), (889, 1114), (1114, 1340)]
done = {0: [0, 1, 2, 3, 4, 5, 6], 1: [0, 1, 2, 4, 5, 6], 2: [0, 1, 3, 4, 6]}
d = ImageDraw.Draw(trk)
for r, days in done.items():
    cy = (ROWS[r][0] + ROWS[r][1]) / 2
    for day in days:
        cx = (V[day + 1] + V[day + 2]) / 2
        rad = (V[day + 2] - V[day + 1]) * 0.27
        jx, jy = random.uniform(-2, 2), random.uniform(-2, 2)
        d.ellipse([cx - rad + jx, cy - rad + jy, cx + rad + jx, cy + rad + jy], fill=RED)
trk_crop = trk.crop((40, 30, 1960, 1500))   # closer: the title and the grid, without the empty margins

# Cut-out tags (top row of the named sheet, 2x coordinates) for the tied-tag composition.
TAGS = [(230, 366, 588, 997), (595, 366, 951, 997), (958, 366, 1316, 997)]
HOLE = (179, 127)   # the punch-hole centre inside each crop


def cut_tag(box):
    t = tags_sheet.crop(box).convert("RGBA")
    m = Image.new("L", t.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([3, 3, t.width - 4, t.height - 4], radius=22, fill=255)
    ImageDraw.Draw(m).ellipse([HOLE[0] - 10, HOLE[1] - 10, HOLE[0] + 10, HOLE[1] + 10], fill=0)   # punched
    t.putalpha(m)
    return t


def tied_tags(pin, top):
    d = ImageDraw.Draw(pin)
    places = [(250, top + 600, 9), (510, top + 660, -4), (765, top + 590, -11)]
    for box, (cx, cy, ang) in zip(TAGS, places):
        K = 0.72
        tag = cut_tag(box).resize((int((box[2] - box[0]) * K), int((box[3] - box[1]) * K)), Image.LANCZOS)
        hx, hy = HOLE[0] * K - tag.width / 2, HOLE[1] * K - tag.height / 2
        a = math.radians(-ang)
        rx, ry = hx * math.cos(a) - hy * math.sin(a), hx * math.sin(a) + hy * math.cos(a)
        hole = (cx + rx, cy + ry)
        # the string runs from above the pin edge down to the hole, with a little slack
        pts = [(hole[0] + (60 - i * 6), top + 20 + (hole[1] - top - 20) * (i / 10) ** 0.9) for i in range(11)]
        d.line(pts, fill=(160, 30, 30), width=6, joint="curve")
        d.line([(p[0] + 2, p[1]) for p in pts], fill=(255, 240, 230), width=2, joint="curve")
        paste_center(pin, shadowed(tag, ang, blur=10, offset=(6, 10), alpha=110), cx, cy)
        d = ImageDraw.Draw(pin)
        d.ellipse([hole[0] - 9, hole[1] - 9, hole[0] + 9, hole[1] + 9], outline=(160, 30, 30), width=5)   # the loop


def tracker_art(pin, top):
    img = trk_crop.resize((900, int(900 * trk_crop.height / trk_crop.width)), Image.LANCZOS)
    paste_center(pin, shadowed(img, -3, blur=12, offset=(8, 12), alpha=90), W / 2, top + (H - top - 150) / 2)


PINS = [
    ("pin1-gift-tags", "Printable Christmas\ngift tags", "Free · add every name · punch-hole marks",
     tags_sheet, dict(bg=KRAFT, art=tied_tags), dict(field=GREEN)),
    ("pin2-word-search", "Christmas\nword search", "Free printable · answer key included",
     ws_sheet, {}, dict(field=DEEPRED)),
    ("pin3-bingo", "Christmas\nbingo cards", "20 different cards · free printable",
     bingo_sheet, {}, dict(field=GREEN)),
    ("pin4-2027-calendar", "2027 family\ncalendar", "Add birthdays · a free printable gift",
     cal_sheet, {}, dict(field=DEEPRED)),
    ("pin5-habit-tracker", "New Year habit\ntracker 2027", "Free printable · January, 5 habits",
     trk, dict(art=tracker_art), dict(field=GREEN, angle=-4, scale=1.0)),
]
for name, head, sub, sheet, a_opts, b_opts in PINS:
    layout_a(sheet, head, sub, **a_opts).save(f"{OUT}/{name}-A.png", optimize=True)
    b_sheet = {"pin5-habit-tracker": trk_crop,
               "pin4-2027-calendar": cal_sheet.crop((60, 560, 1490, 1670))}.get(name, sheet)   # B: the birthday weeks, close
    layout_b(b_sheet, head, sub, **b_opts).save(f"{OUT}/{name}-B.png", optimize=True)
    print(name)
