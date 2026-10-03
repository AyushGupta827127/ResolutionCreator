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

  // The message names what is wrong (first few items) and is logged, so a 422 is never a mystery in the browser or the server logs.
  const summarize = (items, n = 3) => items.slice(0, n).join(" ") + (items.length > n ? ` (+${items.length - n} more)` : "");
  const refuse = (statusCode, headline, items) => {
    console.warn(`[generate] ${statusCode} ${slug}: ${headline} ${summarize(items, 6)}`);
    throw createError({ statusCode, statusMessage: items.length ? `${headline} ${summarize(items)}` : headline, data });
  };

  const badInputs = inputIssues.filter((i) => i.severity === "critical");
  if (badInputs.length) refuse(422, "Some details are missing or invalid:", badInputs.map((i) => i.message));
  const blocking = compliance.results.filter((r) => r.severity === "critical");
  if (blocking.length) refuse(422, "A compliance issue must be fixed before generating:", blocking.map((r) => `${r.title} — ${r.detail || r.message}`));
  if (compliance.results.some((r) => r.severity === "warning") && !acknowledgeWarnings) {
    refuse(409, "Compliance warnings need your confirmation before generating.", compliance.results.filter((r) => r.severity === "warning").map((r) => r.title + "."));
  }

  return {
    resolution,
    answers,
    compliance: compliance.results,
    options: { includeNotice: wantNotice, includeCtc: Boolean(includeCtc), includeLetterhead: Boolean(includeLetterhead) },
    meetingBody: resolution.meetingType === "general" ? "Members" : "Board of Directors",
  };
}
