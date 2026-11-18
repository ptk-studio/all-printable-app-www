import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
D = sys.argv[1]
W, H = 1000, 1500
CREAM, INK, RED = (243, 239, 230), (33, 30, 26), (180, 71, 46)
G = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
AV = "/System/Library/Fonts/Avenir Next.ttc"
def font(p, s, i=0):
    return ImageFont.truetype(p, s, index=i)
PINS = [
  ("gift-tags", "Printable Christmas\ngift tags", "Free · To & From · punch-hole marks"),
  ("word-search", "Christmas\nword search", "Free printable · answer key included"),
  ("bingo", "Christmas\nbingo cards", "20 different cards · free printable"),
  ("2027-calendar", "2027 family\ncalendar", "Add birthdays · a free printable gift"),
  ("habit-tracker", "New Year habit\ntracker 2027", "Free printable · January, 5 habits"),
]
for i, (pid, head, sub) in enumerate(PINS, 1):
    sheet = Image.open(f"{D}/{pid}-sheet.png").convert("RGB")
    sw, sh = sheet.size
    d0 = ImageDraw.Draw(sheet)
    # mask the site's floating Feedback button (bottom right of the viewport)
    pass  # the Feedback button is rendered below the sheet and cropped off
    pin = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(pin)
    d.multiline_text((70, 70), head, font=font(G, 78), fill=INK, spacing=10)
    hb = d.multiline_textbbox((70, 70), head, font=font(G, 78), spacing=10)
    d.text((72, hb[3] + 24), sub, font=font(AV, 36, 0), fill=RED)
    top = hb[3] + 100
    maxw, maxh = 860, H - top - 150
    s = min(maxw / sw, maxh / sh)
    img = sheet.resize((int(sw * s), int(sh * s)), Image.LANCZOS)
    x, y = (W - img.width) // 2, top + (maxh - img.height) // 2
    sh_ = Image.new("RGBA", (img.width + 40, img.height + 40), (0, 0, 0, 0))
    ImageDraw.Draw(sh_).rectangle([20, 26, img.width + 20, img.height + 26], fill=(0, 0, 0, 70))
    sh_ = sh_.filter(ImageFilter.GaussianBlur(10))
    pin.paste(sh_, (x - 20, y - 20), sh_)
    pin.paste(img, (x, y))
    d.rectangle([0, H - 110, W, H], fill=RED)
    t = "all-printable.com  ·  free, true to size"
    tw = d.textlength(t, font=font(AV, 38, 0))
    d.text(((W - tw) / 2, H - 82), t, font=font(AV, 38, 0), fill=(255, 255, 255))
    out = f"{D}/pin{i}-{pid}.png"
    pin.save(out, optimize=True)
    print(out)
