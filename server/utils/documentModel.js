// One description of the finished document, used by EVERY output (on-screen preview,
// browser print, server PDF, Word file) so they cannot drift apart.
//
//   buildDocumentModel(result, { refinedBody }) -> {
//     sections: [{ id, breakBefore, blocks: [...] }]
//   }
//
// Block types:
//   letterhead { lines }                      company header, centred, ruled
//   docTitle   { text, size? }                centred bold title (resolution / NOTICE / CERTIFIED TRUE COPY)
//   heading    { text }                       bold run-in heading, keeps with the next paragraph
//   para       { text, italic?, bold?, lead?, align? }   justified body text; `\n` = hard line break
//   signature  { lines: [{text}|{rule}|{gap}] }  right-hand signing block, never split across pages
//
// Text is turned into typographic form here (curly quotes) so all outputs agree.

const LEAD_IN = /^(“|")?(RESOLVED(?:\s+FURTHER)?(?:\s+THAT)?)/;

/** Straight quotes -> curly quotes (apostrophes included). */
export function typographic(text) {
  return String(text ?? "")
    .replace(/(^|[\s(\[{—–-])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(^|[\s(\[{“—–-])'/g, "$1‘")
    .replace(/'/g, "’");
}

const isRule = (line) => /^_{4,}\s*$/.test(line.trim());
const norm = (s) => String(s ?? "").replace(/\r\n?/g, "\n").trim();
const splitParas = (text) => norm(text).split(/\n[ \t]*\n+/).map((p) => p.trim()).filter(Boolean);
const isCapsTitle = (p) => !p.includes("\n") && p.length <= 40 && /^[A-Z][A-Z &.\-]+$/.test(p);

/**
 * Turns a template's plain text into blocks. `agendaTitle` (if it appears as its own
 * paragraph) is shown bold; a trailing "By Order of… / For … / ____ / name" run becomes one
 * signature block; a leading ALL-CAPS line (NOTICE, CERTIFIED TRUE COPY) becomes the title.
 */
export function textToBlocks(text, { agendaTitle = "", titled = false, signature = false } = {}) {
  const paras = splitParas(text);
  const blocks = [];
  let start = 0;

  if (titled && paras.length && isCapsTitle(paras[0])) {
    blocks.push({ type: "docTitle", text: paras[0], size: 14 });
    start = 1;
  }

  // signature block = from the last paragraph that begins "By Order of…" / "For …" to the end
  let sigAt = -1;
  for (let i = signature ? paras.length - 1 : start - 1; i >= start; i--) {
    const first = paras[i].split("\n")[0].trim();
    if (/^(By Order of|For )/i.test(first)) {
      sigAt = i;
      if (/^By Order of/i.test(first)) break; // "By Order…" starts the whole block; keep looking back only for "For …"
    } else if (sigAt !== -1) break;
  }
  // a signature has to be near the end, otherwise it is just a sentence starting with "For"
  if (sigAt !== -1 && paras.length - sigAt > 4) sigAt = -1;

  for (let i = start; i < (sigAt === -1 ? paras.length : sigAt); i++) {
    const p = paras[i];
    if (agendaTitle && p === agendaTitle.trim()) blocks.push({ type: "para", text: p, bold: true, align: "left" });
    else blocks.push({ type: "para", text: p });
  }

  if (sigAt !== -1) {
    const lines = [];
    for (let i = sigAt; i < paras.length; i++) {
      if (i > sigAt) lines.push({ gap: true });
      for (const l of paras[i].split("\n")) lines.push(isRule(l) ? { rule: true } : { text: l.trim() });
    }
    blocks.push({ type: "signature", lines });
  }
  return blocks;
}

const bodyBlocks = (text, opts) => textToBlocks(text, opts).map((b) => (b.type === "para" ? { ...b, lead: LEAD_IN.test(b.text) } : b));

const finish = (blocks) =>
  blocks.map((b) => {
    if (b.text != null) return { ...b, text: typographic(b.text) };
    if (b.lines) return { ...b, lines: b.lines.map((l) => (l.text != null ? { ...l, text: typographic(l.text) } : l)) };
    return b;
  });

/** Company letterhead: first line is the name, the rest are details. */
function letterheadBlock(text) {
  const lines = norm(text).split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length ? { type: "letterhead", lines } : null;
}

/**
 * @param result  the /generate response: { document, notice, ctc, letterhead }
 * @param opts    { refinedBody } — AI-refined wording the user accepted
 */
export function buildDocumentModel(result, { refinedBody = "" } = {}) {
  const d = result.document;
  const sections = [];

  if (result.notice) {
    sections.push({ id: "notice", breakBefore: false, blocks: finish(textToBlocks(result.notice, { agendaTitle: d.agendaTitle, titled: true, signature: true })) });
  }

  const res = [];
  const lh = result.letterhead ? letterheadBlock(result.letterhead) : null;
  if (lh) res.push(lh);
  res.push({ type: "docTitle", text: d.agendaTitle, size: 13 });
  res.push({ type: "para", text: d.proposal, italic: true });
  res.push(...bodyBlocks(refinedBody || d.body));
  if (d.explanatoryStatement) {
    res.push({ type: "heading", text: "Explanatory Statement" });
    res.push(...textToBlocks(d.explanatoryStatement));
  }
  res.push({ type: "heading", text: "Minutes — Gist of Discussion" });
  res.push(...textToBlocks(d.minutesGist));
  sections.push({ id: "resolution", breakBefore: sections.length > 0, blocks: finish(res) });

  if (result.ctc) {
    sections.push({ id: "ctc", breakBefore: true, blocks: finish(textToBlocks(result.ctc, { titled: true, signature: true })) });
  }
  return { sections };
}

/** Flat text of a model (used by tests and for plain-text fallbacks). */
export function modelToText(model) {
  const out = [];
  for (const s of model.sections) {
    for (const b of s.blocks) {
      if (b.lines) out.push(b.lines.map((l) => l.text ?? "").join("\n"));
      else out.push(b.text);
    }
  }
  return out.join("\n\n");
}
