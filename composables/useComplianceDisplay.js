// One place that turns the API's triggered-rule list into what the UI shows,
// so the Review screen and the generated page can never disagree.
//
// States shown to the user:
//   pass         - checked, nothing to do
//   information  - useful to know, never blocks
//   warning      - ACTION REQUIRED, but resolved by confirming you've reviewed it
//   critical     - ACTION REQUIRED, blocks generation until fixed

/**
 * @param {Array} rules      resolution.complianceRules (every rule that applies)
 * @param {Array} triggered  compliance results returned by the API
 * @param {(fields: string[]) => string} [fixLabelFor]  label for the "go fix it" button
 */
export function buildComplianceDisplay(rules = [], triggered = [], fixLabelFor = () => "") {
  const triggeredIds = new Set(triggered.map((c) => c.ruleId));
  const passed = rules
    .filter((r) => !triggeredIds.has(r.id))
    .map((r) => ({
      ruleId: r.id,
      title: r.title,
      section: r.section,
      severity: "pass",
      message: "This requirement was checked and no issues were found.",
    }));
  const rest = triggered.map((c) => ({
    ...c,
    severity: ["critical", "warning", "information"].includes(c.severity) ? c.severity : "information",
    fixLabel: c.fields?.length ? fixLabelFor(c.fields) : "",
  }));
  return [...passed, ...rest];
}

export function complianceCounts(items = []) {
  const n = (s) => items.filter((i) => i.severity === s).length;
  return {
    pass: n("pass"),
    information: n("information"),
    warning: n("warning"),
    critical: n("critical"),
    actionRequired: n("warning") + n("critical"),
    blocking: n("critical"),
  };
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
