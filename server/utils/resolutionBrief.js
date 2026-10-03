/**
 * Builds the Resolution Brief: purpose, applicable sections/rules, MCA
 * forms, records to preserve, and compliance reminders. Surfaced only after
 * a successful generate — advisory, not a substitute for professional
 * judgment, and says so.
 */
export function buildResolutionBrief(resolution, complianceResults) {
  return {
    purpose: resolution.description,
    applicableSections: [...new Set(complianceResults.map((r) => r.section))],
    mcaForms: resolution.mcaForms || [],
    recordsToPreserve: resolution.records || [],
    complianceReminders: complianceResults.map((r) => ({
      title: r.title,
      severity: r.severity,
      note: r.recommendation,
    })),
    disclaimer:
      "This brief is a professional aid, not a legal opinion. Cross-check every section reference against the current consolidated Companies Act, 2013 (with latest amendments/notifications) before this document is used or filed.",
  };
}
