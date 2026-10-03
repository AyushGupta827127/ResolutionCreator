"""bulk.py [variant,variant] [slug-filter]  - generate the server PDF for every payload and run the layout + content checks."""
import sys, os, re, json, glob, subprocess, urllib.request
import pymupdf

S = os.path.dirname(os.path.abspath(__file__)) + "/"
B = os.environ.get("BASE_URL", "http://localhost:3100")
variants = (sys.argv[1] if len(sys.argv) > 1 else "normal,stress,hindi").split(",")
filt = sys.argv[2] if len(sys.argv) > 2 else ""
os.makedirs(S + "out/bulk", exist_ok=True)

def post(path, payload):
    req = urllib.request.Request(B + path, data=json.dumps(payload).encode(), headers={"content-type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()

total_fail = 0
rows = []
for f in sorted(glob.glob(S + "out/payloads/*.json")):
    name = os.path.basename(f)[:-5]
    slug, variant = name.rsplit(".", 1)
    if variant not in variants or (filt and filt not in slug):
        continue
    payload = json.load(open(f, encoding="utf8"))
    st, data = post("/api/resolutions/download-pdf", payload)
    if st != 200:
        print(f"FAIL {name}: download-pdf HTTP {st} {data[:200]!r}")
        total_fail += 1
        continue
    out = S + f"out/bulk/{name}.pdf"
    open(out, "wb").write(data)
    p = subprocess.run([sys.executable, S + "layout_check.py", out, "server", name], capture_output=True, text=True)
    res = json.loads(p.stdout.strip().splitlines()[-1]) if p.stdout.strip() else {"fails": ["checker crashed: " + p.stderr[-200:]], "notes": [], "pages": 0}

    # content fidelity: every word of the generated document must be in the PDF text layer
    st2, gen = post("/api/resolutions/generate", payload)
    missing = []
    if st2 == 200:
        g = json.loads(gen)
        expected = " ".join(str(x) for x in [g["notice"], g["letterhead"], g["document"]["agendaTitle"], g["document"]["proposal"], g["document"]["body"], g["document"]["explanatoryStatement"], g["document"]["minutesGist"], g["ctc"]] if x)
        d = pymupdf.open(out)
        pdf_text = " ".join(pg.get_text() for pg in d)
        norm = lambda s: re.sub(r"[\u2018\u2019\u201c\u201d\"'_]", "", s)
        pdf_words = set(re.findall(r"\w+", norm(pdf_text)))
        pdf_joined = re.sub(r"\s+", "", norm(pdf_text))
        for w in set(re.findall(r"\w{3,}", norm(expected))):
            # long unbroken words may be split across lines by design; accept if present as a contiguous run
            if w not in pdf_words and w not in pdf_joined:
                missing.append(w)
    if missing:
        res["fails"].append(f"words missing from the PDF text: {missing[:6]}")
    status = "FAIL" if res["fails"] else "ok  "
    if res["fails"]:
        total_fail += 1
    print(f"{status} {name:62s} {res['pages']} pages  {'; '.join(res['fails'])[:230]}")
    for n in res["notes"]:
        print(f"       note: {n}")
print(f"\nFAILED: {total_fail}")
