const B = process.env.BASE_URL || "http://localhost:3100";
const post = async (path, body) => {
  const r = await fetch(B + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let j = null; const ct = r.headers.get("content-type") || "";
  if (ct.includes("json")) j = await r.json(); else j = { binary: (await r.arrayBuffer()).byteLength };
  return { status: r.status, body: j };
};
const get = async (path) => { const r = await fetch(B + path); return { status: r.status, body: await r.json().catch(() => null) }; };

const results = []; const fail = (m) => results.push("FAIL " + m); const ok = (m) => results.push("ok   " + m);
const expect = (cond, msg) => (cond ? ok(msg) : fail(msg));

const search = (await get("/api/resolutions/search")).body.results;
const sample = (q, special = {}) => {
  if (special[q.field] !== undefined) return special[q.field];
  switch (q.type) {
    case "number": return 7;
    case "date": return "2026-10-15";
    case "radio": case "select": return q.options[0].value;
    case "email": return "ops@acme.in";
    case "phone": return "9876543210";
    case "textarea": return `Line one for ${q.field}\nLine two`;
    default:
      if (q.field === "cin") return "U12345MH2020PTC123456";
      if (q.field === "din") return "01234567";
      if (q.field === "company_name") return "Acme Private Limited";
      return `Val_${q.field}`;
  }
};
const visible = (q, a) => !q.conditions?.length || q.conditions.every((c) => a[c.field] === c.value);
const buildAnswers = (res, special = {}) => {
  const a = {};
  for (const q of res.questions) { a[q.field] = sample(q, special); }
  // second pass to drop hidden conditional ones like the UI would
  for (const q of res.questions) if (!visible(q, a)) delete a[q.field];
  return a;
};

for (const s of search) {
  const res = (await get(`/api/resolutions/${s.slug}`)).body;
  const answers = buildAnswers(res, { notice_days: 10, total_directors: 5, directors_present: 4 });
  const full = { slug: s.slug, answers: { ...answers, meeting_time: "11:00 AM", ctc_signatory_name: "R. Sharma", ctc_signatory_designation: "Director", ctc_signatory_id: "01234567", ctc_place: "Mumbai", ctc_date: "2026-10-16", registered_office: "12 MG Road, Pune", company_email: "ops@acme.in" }, includeNotice: true, includeCtc: true, includeLetterhead: true, acknowledgeWarnings: true };
  const g = await post("/api/resolutions/generate", full);
  if (g.status !== 200) { fail(`${s.slug}: generate ${g.status} ${JSON.stringify(g.body).slice(0, 250)}`); continue; }
  const doc = g.body;
  const text = [doc.document.agendaTitle, doc.document.proposal, doc.document.body, doc.document.explanatoryStatement, doc.document.minutesGist, doc.notice, doc.ctc, doc.letterhead].filter(Boolean).join("\n");
  expect(!/\{\{|\}\}/.test(text), `${s.slug}: no raw handlebars`);
  expect(!/undefined|NaN|\[object|null/.test(text), `${s.slug}: no undefined/NaN/null in output`);
  expect(!/,\s*,|\bat\s*,|\s{3,}/.test(doc.document.body.replace(/\n/g, " ")), `${s.slug}: no empty-placeholder punctuation artefacts`);
  expect(text.includes("Acme Private Limited"), `${s.slug}: company name rendered`);
  if (res.meetingType === "board") expect(!!doc.notice && doc.notice.includes("11:00 AM"), `${s.slug}: notice rendered with time`);
  expect(!!doc.ctc && doc.ctc.includes("R. Sharma"), `${s.slug}: CTC rendered`);
  expect(!!doc.letterhead && doc.letterhead.includes("12 MG Road"), `${s.slug}: letterhead rendered`);
  // number formatting check (any amount field)
  const amt = res.questions.find((q) => /limit|value|amount|Rs/i.test(q.field + q.label) && q.type === "number");
  if (amt) {
    const a2 = { ...answers, [amt.field]: 12345678 };
    const g2 = await post("/api/resolutions/generate", { slug: s.slug, answers: a2, acknowledgeWarnings: true });
    const t2 = JSON.stringify(g2.body.document || {});
    expect(/1,23,45,678/.test(t2) || !t2.includes("12345678"), `${s.slug}: amount ${amt.field} shown in Indian grouping (got ${t2.includes("12345678") ? "raw 12345678" : "formatted"})`);
  }
  // docx
  const d = await post("/api/resolutions/download-docx", full);
  expect(d.status === 200 && d.body.binary > 3000, `${s.slug}: docx downloads (${d.status}, ${d.body.binary} bytes)`);
}

// ---------- edge / business-rule tests on one board resolution ----------
const slug = "open-bank-account";
const res = (await get(`/api/resolutions/${slug}`)).body;
const base = buildAnswers(res, { notice_days: 10, total_directors: 5, directors_present: 4 });
const gen = (answers, extra = {}) => post("/api/resolutions/generate", { slug, answers, acknowledgeWarnings: true, ...extra });

let r = await gen({ ...base, company_name: "" }); expect(r.status === 422, "missing required company_name -> 422");
r = await gen({ ...base, cin: "BADCIN" }); expect(r.status === 200 && true, `bad CIN is warning-level, allowed with ack (status ${r.status})`);
r = await post("/api/resolutions/validate", { slug, answers: { ...base, cin: "BADCIN" } }); expect(r.body.inputIssues.some((i) => i.field === "cin"), "validate flags bad CIN");
r = await post("/api/resolutions/validate", { slug, answers: { ...base, meeting_date: "not-a-date" } }); expect(r.body.inputIssues.some((i) => i.field === "meeting_date"), "invalid date value is flagged");
r = await post("/api/resolutions/validate", { slug, answers: { ...base, total_directors: 3, directors_present: 9 } }); expect(r.body.blocksGeneration === true || r.body.inputIssues.some((i) => i.field === "directors_present"), "present > total directors is flagged");
r = await post("/api/resolutions/validate", { slug, answers: { ...base, notice_days: -5 } }); expect(r.body.inputIssues.some((i) => i.field === "notice_days"), "negative notice days flagged");
r = await post("/api/resolutions/validate", { slug, answers: { ...base, per_instrument_limit: "abc" } }); expect(r.body.inputIssues.some((i) => i.field === "per_instrument_limit"), "non-numeric number field flagged");
r = await post("/api/resolutions/validate", { slug, answers: { ...base, internet_banking: "maybe" } });
// compliance gating
r = await gen({ ...base, notice_days: 3 }, { acknowledgeWarnings: false }); expect(r.status !== 200, `short notice (3 days) gated without acknowledgement (status ${r.status})`);
r = await gen({ ...base, notice_days: 3 }); expect(r.status === 200, `short notice (3 days) can proceed after the user acknowledges (status ${r.status}) — law allows urgent business with an independent director`);
r = await gen({ ...base, total_directors: 9, directors_present: 2 }); expect(r.status === 422, `quorum not met blocks (status ${r.status})`);
r = await gen({ ...base }, { acknowledgeWarnings: false }); expect(r.status === 200 || r.status === 409, `normal generate without ack (status ${r.status})`);
// escaping
r = await gen({ ...base, company_name: "Tom & Jerry <b>Ltd</b>" });
const body = JSON.stringify(r.body.document);
expect(!body.includes("&amp;") && !body.includes("&lt;"), `API returns plain text (client escapes on display) — got ${body.includes("&amp;") ? "&amp; entities in output" : "plain"}`);
r = await post("/api/resolutions/generate", { slug, answers: { ...base, company_name: "X" }, includeCtc: true, acknowledgeWarnings: true });
expect(r.status === 422, `CTC requested but signatory fields missing -> server rejects (status ${r.status})`);
r = await post("/api/resolutions/generate", { slug, answers: { ...base }, includeLetterhead: true, acknowledgeWarnings: true });
expect(r.status === 422, `letterhead requested without registered office -> server rejects (status ${r.status})`);
r = await post("/api/resolutions/download-docx", { slug, answers: { ...base, total_directors: 9, directors_present: 2 } });
expect(r.status === 422, `docx download also enforces compliance gating (status ${r.status})`);
r = await get("/api/resolutions/does-not-exist"); expect(r.status === 404, "unknown slug 404");
r = await post("/api/resolutions/generate", { slug: "nope", answers: {} }); expect(r.status === 404, "generate unknown slug 404");
r = await post("/api/resolutions/generate", { slug }); expect(r.status === 422, `generate with no answers -> 422 (status ${r.status})`);

// conditional fields
const ad = (await get("/api/resolutions/appoint-additional-director")).body;
const adBase = buildAnswers(ad, { notice_days: 10, total_directors: 5, directors_present: 4, din_known: false });
r = await post("/api/resolutions/generate", { slug: ad.slug, answers: adBase, acknowledgeWarnings: true });
expect(r.status === 200, `conditional DIN hidden when din_known=false generates (status ${r.status})`);
r = await post("/api/resolutions/generate", { slug: ad.slug, answers: { ...adBase, din_known: true }, acknowledgeWarnings: true });
expect(r.status === 422, `DIN required once din_known=true (status ${r.status})`);
// AGM explanatory statement toggle
const rot = (await get("/api/resolutions/appoint-director-retiring-by-rotation")).body;
const rotBase = buildAnswers(rot, { seeks_reappointment: true, include_explanatory_statement: false });
r = await post("/api/resolutions/generate", { slug: rot.slug, answers: rotBase });
expect(!r.body.document?.explanatoryStatement, `explanatory statement omitted when user says No (got ${r.body.document?.explanatoryStatement ? "present" : "absent"})`);
// related party minutes mention interested director
const rpt = (await get("/api/resolutions/approve-related-party-transaction")).body;
const rptBase = buildAnswers(rpt, { notice_days: 10, total_directors: 5, directors_present: 4, interested_director_name: "Mr Verma", interest_disclosed: true });
r = await post("/api/resolutions/generate", { slug: rpt.slug, answers: rptBase, acknowledgeWarnings: true });
const rtext = JSON.stringify(r.body.document || {});
expect(rtext.includes("Verma"), "related-party output records the interested director");

console.log(results.join("\n"));
console.log(`\n${results.filter((x) => x.startsWith("FAIL")).length} failures / ${results.length} checks`);
