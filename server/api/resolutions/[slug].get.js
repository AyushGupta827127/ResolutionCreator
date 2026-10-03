import { getResolutionBySlug, getComplianceRules, getCtcTemplate, getLetterheadTemplate, getNoticeTemplate } from "../../utils/knowledge";

/**
 * GET /api/resolutions/{slug} — questionnaire + validation rules +
 * compliance rules + template metadata, per the RKE API surface. The
 * template BODY is intentionally not sent here (only used server-side at
 * generate time) so the client can't skip straight to a filled document.
 */
export default defineEventHandler((event) => {
  const slug = getRouterParam(event, "slug");
  const resolution = getResolutionBySlug(slug);
  if (!resolution) throw createError({ statusCode: 404, statusMessage: "Resolution not found" });

  const questions = [...resolution.questions].sort((a, b) => a.sequence - b.sequence);

  return {
    slug: resolution.slug,
    title: resolution.title,
    category: resolution.category,
    description: resolution.description,
    meetingType: resolution.meetingType,
    resolutionKind: resolution.resolutionKind,
    mcaForms: resolution.mcaForms,
    records: resolution.records,
    questions,
    helpContent: resolution.helpContent || {},
    complianceRules: getComplianceRules(resolution.complianceRuleIds),
    ctc: getCtcTemplate(),
    letterhead: getLetterheadTemplate(),
    notice: getNoticeTemplate(),
    agendaTitle: resolution.template.agendaTitle,
  };
});
