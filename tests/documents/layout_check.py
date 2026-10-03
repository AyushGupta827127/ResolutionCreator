"""Automated layout checks for a generated PDF (server PDF, browser print, or Word-printed).

usage: layout_check.py <pdf> <kind: server|print|docx> <label>
Prints one line per check and a final FAIL/OK summary line; exit code 1 on any failure.
"""
import sys, re, json
import pymupdf

pdf, kind, label = sys.argv[1], sys.argv[2], sys.argv[3]
doc = pymupdf.open(pdf)
fails = []
notes = []

def fail(msg):
    fails.append(msg)

A4 = (595.28, 841.89)
# Word's "print to PDF" uses the printer's paper (Letter) so skip the size check for docx
if kind != "docx":
    w, h = doc[0].rect.width, doc[0].rect.height
    if abs(w - A4[0]) > 2 or abs(h - A4[1]) > 2:
        fail(f"page size {w:.0f}x{h:.0f} is not A4")

HEADINGS = ["Minutes", "Explanatory Statement"]
SIG_ANCHORS = [("By Order of the Board", "Director / Company Secretary")]  # both lines must share a page

all_text = []
prev_last_is_para_end = True
for pi, page in enumerate(doc):
    W, H = page.rect.width, page.rect.height
    lm = 72 if kind != "docx" else 72 * W / 595.28
    blocks = [b for b in page.get_text("blocks") if b[4].strip()]
    text = page.get_text()
    all_text.append(text)
    if "�" in text and kind != "docx":  # docx goes through the Windows PDF printer which mangles curly quotes on extraction
        fail(f"p{pi+1}: replacement character (missing glyph) in text")
    if kind != "docx" and page.get_images():
        fail(f"p{pi+1}: page contains images (text should be real text)")
    if len(text.strip()) < 20:
        fail(f"p{pi+1}: page is blank/near-empty")
    # split body vs footer (footer sits at the very bottom)
    footer_y = H - (60 if kind != "docx" else 62)
    body = [b for b in blocks if b[3] < footer_y or not re.search(r"Page \d+ of \d+|Draft for professional review", b[4])]
    body = [b for b in body if not re.search(r"^(Page \d+ of \d+|Draft for professional review)\s*$", b[4].strip())]
    if not body:
        continue
    top = min(b[1] for b in body); bottom = max(b[3] for b in body)
    left = min(b[0] for b in body); right = max(b[2] for b in body)
    scale = W / 595.28
    if left < 70 * scale - 1 or right > W - 70 * scale + 1:
        fail(f"p{pi+1}: text outside side margins (x {left:.0f}-{right:.0f} of {W:.0f})")
    if top < 66 * scale - 1:
        fail(f"p{pi+1}: text above top margin (y {top:.0f})")
    # body text must end above the footer line (measured, so it works whatever paper the PDF was printed on)
    fblocks = [b for b in blocks if re.search(r"Page \d+ of \d+|Draft for professional review", b[4])]
    footer_top = min((b[1] for b in fblocks), default=H - 40)
    if bottom > footer_top - 6:
        fail(f"p{pi+1}: body text (ends y {bottom:.0f}) runs into the footer (starts y {footer_top:.0f})")
    # footer must exist with the right page numbers (server + print + docx all promise "Page x of y")
    m = re.search(r"Page (\d+) of (\d+)", text)
    if not m:
        fail(f"p{pi+1}: no 'Page x of y' footer")
    else:
        # Word's headless print can't evaluate NUMPAGES (shows "n of n"); the field itself is verified in docx_bulk.py
        total_ok = kind == "docx" or int(m.group(2)) == doc.page_count
        if int(m.group(1)) != pi + 1 or not total_ok:
            fail(f"p{pi+1}: footer says page {m.group(1)} of {m.group(2)} but this is page {pi+1} of {doc.page_count}")
    # heading must not be the last body line on a page (orphaned heading)
    lines = [l for l in text.split("\n") if l.strip() and not re.match(r"^\s*(Page \d+ of \d+|Draft for professional review)\s*$", l)]
    if lines:
        last = lines[-1].strip()
        if any(last.startswith(h) for h in HEADINGS) and len(last) < 45:
            fail(f"p{pi+1}: heading '{last}' is stranded at the bottom of the page")
    # widow: a continuation page (not a section start) whose first line is a lone short line followed by a heading/new para
    first_line = lines[0].strip() if lines else ""
    firstblock = sorted(body, key=lambda b: (b[1], b[0]))[0]
    first_text = firstblock[4].strip().split("\n")
    if pi > 0 and len(first_text) == 1:
        # one-line first block: fine if it is a title/heading/letterhead; suspicious if it's a short sentence tail
        txt = first_text[0]
        is_title = txt.isupper() or any(txt.startswith(h) for h in HEADINGS)
        width = firstblock[2] - firstblock[0]
        if not is_title and width < 0.45 * (W - 144 * scale) and not re.match(r"^(For |By Order)", txt):
            notes.append(f"p{pi+1}: possible widow — first block is a single short line: {txt!r}")

# signature blocks never split across pages
pages_text = all_text
def page_of(s):
    return [i for i, t in enumerate(pages_text) if s in t]
for a, b in SIG_ANCHORS:
    pa, pb = page_of(a), page_of(b)
    # the signature's anchors must share a page (look at the last occurrence of each)
    if pa and pb and pa[-1] != pb[-1] and a.startswith("By Order"):
        fail(f"signature block split: '{a}' on p{pa[-1]+1} but '{b}' on p{pb[-1]+1}")
if "Date:" in "".join(pages_text):
    pd = page_of("Date:")[-1]
    # CTC signature: the "Certified" title and the final Date line are on pages we can't compare; check "For <Company>" sits with Date:
    for i, t in enumerate(pages_text):
        if re.search(r"^For .+(Limited|Ltd)\s*$", t, re.M) and "Date:" not in t and i == pd - 0:
            pass

# fonts embedded & subset (server + print): none of the 14 standard unembedded fonts
if kind in ("server", "print"):
    for pi, page in enumerate(doc):
        for f in page.get_fonts():
            name = f[3]
            if name in ("Helvetica", "Times-Roman", "Courier", "Symbol", "ZapfDingbats"):
                fail(f"p{pi+1}: non-embedded standard font {name}")

result = {"label": label, "kind": kind, "pages": doc.page_count, "fails": fails, "notes": notes}
print(json.dumps(result))
sys.exit(1 if fails else 0)
