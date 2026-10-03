import { getComplianceRules } from "./knowledge";

/**
 * The Business + Compliance validation layers. Rule *content* (message,
 * recommendation, section, severity) lives in knowledge/compliance-rules.json;
 * only the trigger condition — genuine business logic — lives here, per the
 * RKE's "engine independence" rule (Validation never reaches into template
 * placeholders; it only reads the resolution's structured answers).
 */
const evaluators = {
  "RULE-BM-01": (answers) => {
    const days = Number(answers.notice_days);
    if (!Number.isFinite(days)) return false;
    return days < 7;
  },
  "RULE-BM-02": () => true, // process reminder, always surfaced for board meetings
  "RULE-BM-03": (answers) => {
    const total = Number(answers.total_directors);
    const present = Number(answers.directors_present);
    if (!Number.isFinite(total) || !Number.isFinite(present)) return false;
    const required = Math.max(Math.ceil(total / 3), 2);
    // An interested director isn't counted towards quorum for the item they're interested in (SS-1).
    const interested = String(answers.interested_director_name || "").trim() ? 1 : 0;
    return Math.max(0, present - interested) < required;
  },
  "RULE-BM-04": (answers) => {
    const hasInterestedDirector = Boolean(String(answers.interested_director_name || "").trim());
    return hasInterestedDirector && answers.interest_disclosed !== true;
  },
  "RULE-BM-05": (answers) => answers.resolution_method === "circulation",
  "RULE-BM-06": () => true, // process reminder, always surfaced for board meetings
};

/**
 * Per-rule explanation of *why* it triggered, using the user's own numbers,
 * and which fields to change to resolve it. Shown on the Review screen so a
 * finding is never a mystery ("Quorum may not be met" -> "2 of 6 present…").
 */
const explainers = {
  "RULE-BM-01": (a) => ({
    detail: `You entered ${Number(a.notice_days)} clear day${Number(a.notice_days) === 1 ? "" : "s"} of notice; the standard minimum is 7.`,
    fields: ["notice_days"],
  }),
  "RULE-BM-03": (a) => {
    const total = Number(a.total_directors);
    const present = Number(a.directors_present);
    const required = Math.max(Math.ceil(total / 3), 2);
    const interested = String(a.interested_director_name || "").trim() ? 1 : 0;
    const counted = Math.max(0, present - interested);
    return {
      detail:
        `You entered ${present} of ${total} directors present` +
        (interested ? `, and named an interested director who is not counted towards quorum, leaving ${counted}` : "") +
        `. Quorum needs at least ${required} (one-third of ${total}, minimum 2).`,
      fields: interested ? ["directors_present", "total_directors", "interested_director_name"] : ["directors_present", "total_directors"],
    };
  },
  "RULE-BM-04": () => ({
    detail: "An interested director is named but their disclosure under Section 184 isn't recorded as made.",
    fields: ["interest_disclosed", "interested_director_name"],
  }),
};

const severityOverrides = {
  // Disclosure entirely missing (not just unrecorded) is Critical per the
  // rule pack's own escalation note, not the base Warning severity.
  "RULE-BM-04": (answers) =>
    Boolean(String(answers.interested_director_name || "").trim()) && !answers.interest_disclosed
      ? "critical"
      : null,
};

export function runComplianceCheck(resolution, answers) {
  const rules = getComplianceRules(resolution.complianceRuleIds);
  const results = [];

  for (const rule of rules) {
    const evaluate = evaluators[rule.id];
    const triggered = evaluate ? Boolean(evaluate(answers)) : false;
    if (!triggered) continue;

    const overriddenSeverity = severityOverrides[rule.id]?.(answers);
    results.push({
      ruleId: rule.id,
      title: rule.title,
      section: rule.section,
      severity: overriddenSeverity || rule.severity,
      message: rule.message,
      recommendation: rule.recommendation,
      ...(explainers[rule.id]?.(answers) || {}),
    });
  }

  const hasCritical = results.some((r) => r.severity === "critical");
  return { results, hasCritical };
}
