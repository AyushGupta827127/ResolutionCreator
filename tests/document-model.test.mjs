// Unit tests for the shared document model (the thing the PDF, Word file and preview are all built from).
import { buildDocumentModel, textToBlocks, typographic, modelToText } from "../server/utils/documentModel.js";

let n = 0, f = 0;
const t = (c, m) => { n++; if (!c) { f++; console.log("FAIL", m); } else console.log("ok  ", m); };

// quotes
t(typographic('"RESOLVED THAT the \'Bank\' isn\'t" done.') === "\u201CRESOLVED THAT the \u2018Bank\u2019 isn\u2019t\u201D done.", "curly quotes and apostrophes");

// notice: title, bold agenda item, signature block grouped, rule detected
const notice = "NOTICE\n\nNotice is hereby given.\n\nTo appoint a director\n\nThis notice is given in compliance.\n\nBy Order of the Board\nFor Acme Private Limited\n\n_______________________\nDirector / Company Secretary";
const nb = textToBlocks(notice, { agendaTitle: "To appoint a director", titled: true, signature: true });
t(nb[0].type === "docTitle" && nb[0].text === "NOTICE", "ALL-CAPS first line becomes the title (no duplicate heading)");
t(nb.some((b) => b.type === "para" && b.bold && b.text === "To appoint a director"), "agenda item is emphasised");
const sig = nb.find((b) => b.type === "signature");
t(sig && sig.lines[0].text === "By Order of the Board" && sig.lines.some((l) => l.rule) && sig.lines.at(-1).text === "Director / Company Secretary", "signature block grouped with a rule line");
t(nb.filter((b) => b.type === "para").length === 3, "paragraphs are real paragraphs (blank-line separated)");

// a sentence that merely starts with "For" is not a signature
const expl = "For the reasons stated above the Board recommends this.\n\nSecond paragraph.";
t(!textToBlocks(expl, {}).some((b) => b.type === "signature"), "'For …' sentences are not mistaken for a signature when signature detection is off");

// CTC: signature starts at "For <company>"
const ctc = "CERTIFIED TRUE COPY\n\nCertified to be a true copy.\n\nFor Acme Private Limited\n\n_____________\nRahul Sharma\nManaging Director (01234567)\nPlace: Patna\nDate: 26 September 2026";
const cb = textToBlocks(ctc, { titled: true, signature: true });
t(cb.at(-1).type === "signature" && cb.at(-1).lines.some((l) => l.text === "Date: 26 September 2026"), "CTC signature block includes name, designation, place and date");

// whole model
const result = {
  document: { agendaTitle: "To appoint X", proposal: "The Board proposes.", body: '"RESOLVED THAT a.\n\nRESOLVED FURTHER THAT b."', explanatoryStatement: "Explained.", minutesGist: "Minutes text." },
  notice, ctc, letterhead: "Acme Private Limited\nCIN: U1\n\nReg Office: Patna",
};
const m = buildDocumentModel(result);
t(m.sections.map((s) => s.id).join() === "notice,resolution,ctc", "sections: notice, resolution, ctc");
t(m.sections[0].breakBefore === false && m.sections[1].breakBefore === true && m.sections[2].breakBefore === true, "resolution and CTC start on a new page");
const res = m.sections[1].blocks;
t(res[0].type === "letterhead" && res[0].lines.length === 3, "letterhead block first (blank lines dropped)");
t(res.filter((b) => b.lead).length === 2, "RESOLVED / RESOLVED FURTHER paragraphs flagged for a bold lead-in");
t(res.some((b) => b.type === "heading" && b.text === "Explanatory Statement") && res.some((b) => b.type === "heading" && b.text.startsWith("Minutes")), "explanatory statement and minutes headings");
const noNotice = buildDocumentModel({ ...result, notice: null, ctc: null, letterhead: null });
t(noNotice.sections.length === 1 && noNotice.sections[0].breakBefore === false && noNotice.sections[0].blocks[0].type === "docTitle", "bare resolution: one section, no page break, title first");
t(buildDocumentModel(result, { refinedBody: "Refined body." }).sections[1].blocks.some((b) => b.text === "Refined body."), "AI-refined body replaces the original");
t(!/\{\{|undefined/.test(modelToText(m)), "no placeholders in the flattened text");

console.log(`\n${f} failures / ${n}`);
process.exitCode = f ? 1 : 0;
