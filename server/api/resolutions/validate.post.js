import { getResolutionBySlug } from "../../utils/knowledge";
import { validateAnswers, pruneHiddenAnswers } from "../../utils/validators";
import { runComplianceCheck } from "../../utils/complianceEngine";

/**
 * POST /api/resolutions/validate — Input + Business + Compliance layers,
 * run without generating. The wizard calls this as answers come in so
 * issues surface before the user reaches the end, per "Validate before
 * generate".
 * Body: { slug, answers }
 */
export default defineEventHandler(async (event) => {
  const { slug, answers: rawAnswers = {} } = (await readBody(event)) || {};
  const resolution = getResolutionBySlug(slug);
  if (!resolution) throw createError({ statusCode: 404, statusMessage: "Resolution not found" });
  if (typeof rawAnswers !== "object" || Array.isArray(rawAnswers) || rawAnswers === null) {
    throw createError({ statusCode: 422, statusMessage: "answers must be an object" });
  }
  const answers = pruneHiddenAnswers(resolution.questions, rawAnswers);

  const inputIssues = validateAnswers(resolution.questions, answers);
  const compliance = runComplianceCheck(resolution, answers);

  const hasCriticalInput = inputIssues.some((i) => i.severity === "critical");

  return {
    inputIssues,
    compliance: compliance.results,
    blocksGeneration: hasCriticalInput || compliance.hasCritical,
  };
});
