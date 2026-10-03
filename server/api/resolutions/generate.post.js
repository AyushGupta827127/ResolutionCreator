import { getCtcTemplate, getLetterheadTemplate, getNoticeTemplate } from "../../utils/knowledge";
import { prepareGeneration } from "../../utils/generation";
import { renderResolution, renderCtc, renderLetterhead, renderNotice } from "../../utils/templateEngine";
import { buildResolutionBrief } from "../../utils/resolutionBrief";

/**
 * POST /api/resolutions/generate
 * Body: { slug, answers, includeNotice, includeCtc, includeLetterhead, acknowledgeWarnings }
 *
 * Generates the three synchronized outputs a board-resolution product is
 * expected to produce together (Notice of Meeting, Resolution + Minutes
 * Extract, Certified True Copy), rendered from the SAME answer set so nothing
 * has to be re-typed. Generation happens once, at the end of the
 * questionnaire.
 *
 * Validation + compliance gating lives in prepareGeneration (shared with the
 * DOCX download). All text is returned as plain text — the client escapes on
 * display.
 */
export default defineEventHandler(async (event) => {
  const { resolution, answers, compliance, options, meetingBody } = prepareGeneration(await readBody(event));

  const rendered = renderResolution(resolution, answers);

  return {
    slug: resolution.slug,
    title: resolution.title,
    resolutionKind: resolution.resolutionKind,
    document: rendered,
    notice: options.includeNotice ? renderNotice(getNoticeTemplate(), { ...answers, agenda_title: rendered.agendaTitle }) : null,
    ctc: options.includeCtc ? renderCtc(getCtcTemplate(), { ...answers, meeting_body: meetingBody }) : null,
    letterhead: options.includeLetterhead ? renderLetterhead(getLetterheadTemplate(), answers) : null,
    brief: buildResolutionBrief(resolution, compliance),
    compliance,
    generatedAt: new Date().toISOString(),
  };
});
