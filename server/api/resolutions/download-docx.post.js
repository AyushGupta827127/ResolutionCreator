import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Footer,
  PageNumber,
  TabStopType,
  UnderlineType,
} from "docx";
import { getCtcTemplate, getLetterheadTemplate, getNoticeTemplate } from "../../utils/knowledge";
import { prepareGeneration } from "../../utils/generation";
import { renderResolution, renderCtc, renderLetterhead, renderNotice } from "../../utils/templateEngine";
import { buildDocumentModel } from "../../utils/documentModel"; // the same model drives the PDF, Word file and preview

// Layout constants (twips: 1/20 pt). A4 with 1" margins -> 9026 twips of text width.
const PAGE = { width: 11906, height: 16838 };
const MARGIN = 1440;
const TEXT_W = PAGE.width - MARGIN * 2;
const FONT = { ascii: "Times New Roman", hAnsi: "Times New Roman", cs: "Nirmala UI" };
const BODY_SIZE = 24; // 12 pt
const LINE = 300; // ~1.25 line spacing (matches the PDF)
const SIG_INDENT = 4900; // signature block starts about 55% across the page
const LEAD = /^(“|")?RESOLVED(?:\s+FURTHER)?(?:\s+THAT)?/;

const P = (opts) => new Paragraph({ ...opts, children: (opts.children || []).flat() });

/**
 * Text -> runs. Devanagari stretches become their own runs flagged as complex script, so Word applies the
 * complex-script font (cs) to them; the Latin text around them stays in Times New Roman.
 */
function runs(text, o = {}) {
  const base = { font: FONT, size: o.size || BODY_SIZE, bold: o.bold, italics: o.italic, color: o.color, underline: o.underline ? { type: UnderlineType.SINGLE } : undefined };
  const parts = String(text).split(/([ऀ-ॿ][ऀ-ॿ\s‌‍]*[ऀ-ॿ]|[ऀ-ॿ])/);
  return parts
    .map((t, i) => ({ t, dev: i % 2 === 1 })) // odd indexes are the captured Devanagari stretches
    .filter(({ t }) => t !== "")
    .map(({ t, dev }) =>
      new TextRun(
        dev
          ? { ...base, text: t, complexScript: true, boldComplexScript: o.bold, italicsComplexScript: o.italic, sizeComplexScript: base.size, break: o.break }
          : { ...base, text: t, break: o.break }
      )
    );
}
// kept for call sites that want a single-run feel
const run = (text, o = {}) => runs(text, o);

/** Runs for a paragraph: hard line breaks, and the bold "RESOLVED THAT" lead-in. */
function runsFor(block) {
  const lines = String(block.text).split("\n");
  const out = [];
  lines.forEach((line, li) => {
    let rest = line;
    if (li === 0 && block.lead) {
      const m = LEAD.exec(rest);
      if (m) {
        out.push(...runs(m[0], { bold: true, italic: block.italic }));
        rest = rest.slice(m[0].length);
      }
    }
    const r = runs(rest, { bold: block.bold, italic: block.italic, break: li > 0 ? 1 : undefined });
    out.push(...(r.length ? r : [new TextRun({ text: "", font: FONT, size: BODY_SIZE, break: li > 0 ? 1 : undefined })]));
  });
  return out;
}

function paragraphsFor(section, sectionIndex) {
  const out = [];
  let pendingBreak = section.breakBefore;
  const mark = (opts) => {
    if (pendingBreak) {
      pendingBreak = false;
      return { ...opts, pageBreakBefore: true };
    }
    return opts;
  };

  section.blocks.forEach((b, i) => {
    const next = section.blocks[i + 1];
    switch (b.type) {
      case "letterhead": {
        const [name, ...rest] = b.lines;
        out.push(P(mark({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, keepNext: true, children: [run(name.toUpperCase(), { bold: true, size: 30 })] })));
        rest.forEach((l, k) =>
          out.push(
            P({
              alignment: AlignmentType.CENTER,
              spacing: { after: k === rest.length - 1 ? 200 : 0 },
              keepNext: true,
              border: k === rest.length - 1 ? { bottom: { style: BorderStyle.SINGLE, size: 8, space: 6, color: "000000" } } : undefined,
              children: [run(l, { size: 20 })],
            })
          )
        );
        if (!rest.length) out.push(P({ spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, space: 6, color: "000000" } } }));
        break;
      }
      case "docTitle":
        out.push(
          P(
            mark({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 240 },
              keepNext: true,
              children: [run(b.text, { bold: true, size: (b.size || 13) * 2, underline: (b.size || 13) >= 14 })],
            })
          )
        );
        break;
      case "heading":
        out.push(P(mark({ spacing: { before: 240, after: 120 }, keepNext: true, keepLines: true, children: [run(b.text, { bold: true })] })));
        break;
      case "signature": {
        const lines = b.lines;
        lines.forEach((l, k) => {
          const last = k === lines.length - 1;
          const common = { indent: { left: SIG_INDENT }, keepNext: !last, keepLines: true };
          if (l.gap) out.push(P({ ...common, spacing: { after: 0, line: 160 }, children: [run("", { size: 12 })] }));
          else if (l.rule)
            out.push(
              P({
                ...common,
                spacing: { before: 520, after: 60, line: 120 },
                border: { top: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "000000" } },
                children: [run("", { size: 8 })],
              })
            );
          else out.push(P({ ...common, spacing: { after: 0, line: 300 }, children: [run(l.text)] }));
        });
        break;
      }
      default:
        out.push(
          P(
            mark({
              alignment: b.align === "left" ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
              spacing: { after: 180, line: LINE },
              widowControl: true,
              keepNext: next?.type === "signature", // keep the last paragraph with the signing block
              children: runsFor(b),
            })
          )
        );
    }
  });
  return out;
}

/**
 * Body: same as /generate, plus optional `refinedBody` (the AI-refined wording the user accepted).
 * Goes through the same validation + compliance gate as /generate.
 */
export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) || {};
  const { resolution, answers, options, meetingBody } = prepareGeneration(body);

  const rendered = renderResolution(resolution, answers);
  const refined = typeof body.refinedBody === "string" && body.refinedBody.trim() ? body.refinedBody.slice(0, 20000) : "";

  const model = buildDocumentModel(
    {
      document: rendered,
      notice: options.includeNotice ? renderNotice(getNoticeTemplate(), { ...answers, agenda_title: rendered.agendaTitle }) : null,
      ctc: options.includeCtc ? renderCtc(getCtcTemplate(), { ...answers, meeting_body: meetingBody }) : null,
      letterhead: options.includeLetterhead ? renderLetterhead(getLetterheadTemplate(), answers) : null,
    },
    { refinedBody: refined }
  );

  const children = model.sections.flatMap((s, i) => paragraphsFor(s, i));

  const doc = new Document({
    creator: "Resolution Creator",
    title: `${resolution.title} — ${answers.company_name || "Resolution"}`,
    description: "Corporate resolution (draft)",
    styles: { default: { document: { run: { font: FONT, size: BODY_SIZE }, paragraph: { spacing: { line: LINE } } } } },
    sections: [
      {
        properties: { page: { size: { width: PAGE.width, height: PAGE.height }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, footer: 700 } } },
        footers: {
          default: new Footer({
            children: [
              P({
                tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W }],
                border: { top: { style: BorderStyle.SINGLE, size: 4, space: 6, color: "9CA3AF" } },
                children: [
                  run("Draft for professional review", { size: 16, color: "6B7280" }),
                  new TextRun({ children: ["\t", "Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: "6B7280" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  setResponseHeader(event, "Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  setResponseHeader(event, "Content-Disposition", `attachment; filename="${resolution.slug}.docx"`);
  return buffer;
});
