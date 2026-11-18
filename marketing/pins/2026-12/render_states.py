import base64, json, subprocess, sys
from PIL import Image
D = sys.argv[1]
CH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
O = "https://app.all-printable.com"
def enc(o):
    return base64.b64encode(json.dumps(o, ensure_ascii=False).encode()).decode().replace("+", "-").replace("/", "_").rstrip("=")
B = "\\\\"   # the maker's in-item line break: two backslash characters
JOBS = {
 "tags-named": ("printables/cards/", 773, 1000, {
    "type": "tag", "stock": "auto", "sizePreset": "tag", "cardW": 50.8, "cardH": 88.9, "duplex": "none", "marks": "crop",
    "hole": True, "cardBorder": True, "corner": 3, "align": "center", "numbering": False, "theme": "bold", "accent": "#b4472e",
    "category": "Merry Christmas", "fontScale": 0.9, "holeInset": 16,
    "items": "\n".join(f"To: {t}{B}{B}From: {f}" for t, f in
                       [("Grandma", "Sam"), ("Leo", "Mom"), ("Ava", "Dad"), ("Grandpa", "Sam"), ("Mia", "Aunt Jo"), ("Ben", "Mom")]),
    "fillSheet": False, "paper": "letter", "orientation": "portrait"}),
 "calendar-birthdays": ("printables/calendar/", 773, 1000, {
    "layout": "month", "paper": "letter", "orientation": "portrait", "sixWeeks": True, "miniMonths": True, "numberScale": 1.3,
    "theme": "classic", "weekendStyle": "tint", "holiday": {"countries": ["US"], "style": "name"},
    "startMonth": 0, "startYear": 2027, "count": 1,
    "events": "01-08 Grandma \U0001F382\n01-14 Leo turns 7 \U0001F382\n01-23 Anniversary \u2764\n01-29 Uncle Sam \U0001F382"}),
 "tracker": ("printables/tracker/", 1000, 773, {
    "layout": "month", "shape": "circle", "listHeading": "Habit", "month": 0, "year": 2027, "title": "New Year habits",
    "orientation": "landscape", "paper": "letter",
    "items": "Drink water\nMove 20 minutes\nRead 10 pages\nLights out by 11\nNo phone at meals",
    "zebra": False, "weekendShade": True}),
}
for name, (path, w, h, state) in JOBS.items():
    url = f"{O}/{path}?preview=1#c={enc(state)}"
    tall = f"{D}/{name}-tall.png"
    subprocess.run([CH, "--headless", "--disable-gpu", f"--screenshot={tall}", "--virtual-time-budget=8000",
                    f"--window-size={w},{h + 120}", "--force-device-scale-factor=2", url], capture_output=True)
    Image.open(tall).crop((0, 0, w * 2, h * 2)).save(f"{D}/{name}-sheet.png")
    print(name, "ok")
