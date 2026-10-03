import { getResolutionBySlug, getCtcTemplate, getLetterheadTemplate, getNoticeTemplate } from "./knowledge";
import { validateAnswers, validateExtraDocument, pruneHiddenAnswers } from "./validators";
import { runComplianceCheck } from "./complianceEngine";

/**
 * The single gate every document-producing endpoint goes through (generate,
 * DOCX download, …) so no path can skip validation or the compliance rules:
 *
 *   input issues (incl. the optional Notice/CTC/Letterhead fields) -> 422
 *   critical compliance issue                                      -> 422
 *   warnings without `acknowledgeWarnings`                         -> 409
 */
export function prepareGeneration(body = {}) {
  const { slug, includeNotice = false, includeCtc = false, includeLetterhead = false, acknowledgeWarnings = false } = body;
  const rawAnswers = body.answers;

  const resolution = getResolutionBySlug(slug);
  if (!resolution) throw createError({ statusCode: 404, statusMessage: "Resolution not found" });
  if (!rawAnswers || typeof rawAnswers !== "object" || Array.isArray(rawAnswers)) {
    throw createError({ statusCode: 422, statusMessage: "Required fields are missing or invalid.", data: { inputIssues: [], compliance: [] } });
  }

  const answers = pruneHiddenAnswers(resolution.questions, rawAnswers);

  // Notice of Meeting only exists for board meetings.
  const wantNotice = Boolean(includeNotice) && resolution.meetingType === "board";

  const inputIssues = [
    ...validateAnswers(resolution.questions, answers),
    ...(wantNotice ? validateExtraDocument("Notice of Meeting", getNoticeTemplate(), answers) : []),
    ...(includeCtc ? validateExtraDocument("Certified True Copy", getCtcTemplate(), answers) : []),
    ...(includeLetterhead ? validateExtraDocument("letterhead", getLetterheadTemplate(), answers) : []),
  ];
  const compliance = runComplianceCheck(resolution, answers);
  const data = { inputIssues, compliance: compliance.results };

  if (inputIssues.some((i) => i.severity === "critical")) {
    throw createError({ statusCode: 422, statusMessage: "Required fields are missing or invalid.", data });
  }
  if (compliance.hasCritical) {
    throw createError({ statusCode: 422, statusMessage: "A critical compliance issue must be resolved before generating.", data });
  }
  if (compliance.results.some((r) => r.severity === "warning") && !acknowledgeWarnings) {
    throw createError({ statusCode: 409, statusMessage: "Compliance warnings need acknowledgement before generating.", data });
  }

  return {
    resolution,
    answers,
    compliance: compliance.results,
    options: { includeNotice: wantNotice, includeCtc: Boolean(includeCtc), includeLetterhead: Boolean(includeLetterhead) },
    meetingBody: resolution.meetingType === "general" ? "Members" : "Board of Directors",
  };
}
