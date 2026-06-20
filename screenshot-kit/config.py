# Per-app settings for the App Store screenshot kit. Edit this file only.
# Run from this folder:  python3 compose.py

APP_NAME    = "Beginner Gym Timer"
TAGLINE     = "No excuses — just press start"
TITLE_SIZE  = 104                       # shrink if the name is long
ICON        = "../assets/images/icon.png"  # path to the 1024px app icon (relative to this folder)

RAW_DIR     = "raw"
OUT_DIR     = "../app-store-screenshots"

# Brand — sampled from the app icon (dark slate gradient, amber timer accent).
BG_STOPS      = [(46, 50, 63), (13, 15, 22)]  # gradient top->bottom (2 or 3 stops)
ACCENT        = (248, 178, 20)          # bullet check-mark color (amber)
HEADLINE_BOLD = (248, 178, 20)          # tint *bold* keywords amber (None = white)
SUBTITLE      = (206, 213, 224)
WATERMARK     = (248, 178, 20)

# Hero (screens 1+2)
HERO_SHOT = "timer.png"
HERO_SW   = 1125
HERO_TILT = -20
HERO_PX   = 1050
BULLETS = [
    "Dead-simple — nothing to learn",
    "Just the essentials, no overwhelm",
    "Quick ~25-minute sessions",
    "Free forever — no catch",
]

PANEL_SW = 1150

# Feature panels (screens 3+):  (label, headline, raw_filename, "low"|"high", subtitle)
PANELS = [
    ("simple",   "Simple *by* *design*",            "home.png",   "low",  "No menus to learn — open and go"),
    ("timer",    "A rest timer you *can't* *miss*", "timer.png",  "high", "Big countdown between every set"),
    ("sets",     "One *tap* per set",               "set.png",    "low",  "Finish a set — it cues your rest and what's next"),
    ("noexcuse", "*No* more *excuses*",             "home.png",   "high", "So easy there's no reason to skip the gym"),
    ("guides",   "It *guides* every rest",          "timer.png",  "low",  "Just follow along — set to set"),
    ("resume",   "*Resume* where you left off",     "resume.png", "high", "Step away — your workout waits for you"),
    ("free",     "Why *pay* for simple?",           "set.png",    "low",  "Free forever — no ads, no in-app purchases"),
    ("quick",    "In and out in *~25* *minutes*",   "home.png",   "high", "A quick session beats no session"),
]
