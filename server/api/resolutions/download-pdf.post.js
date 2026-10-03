import { prepareGeneration } from "../../utils/generation";
import { renderResolution, renderCtc, renderLetterhead, renderNotice } from "../../utils/templateEngine";
import { getCtcTemplate, getLetterheadTemplate, getNoticeTemplate } from "../../utils/knowledge";
import { buildDocumentModel } from "../../utils/documentModel";
import { renderPdf } from "../../utils/pdfRenderer";

/**
 * Body: same as /generate, plus optional `refinedBody` (AI-refined wording the user accepted).
 * Same validation + compliance gate as /generate. Returns a text-based A4 PDF.
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

  const pdf = await renderPdf(model, { title: `${resolution.title} — ${answers.company_name || "Resolution"}` });
  setResponseHeader(event, "Content-Type", "application/pdf");
  setResponseHeader(event, "Content-Disposition", `attachment; filename="${resolution.slug}.pdf"`);
  return pdf;
});
