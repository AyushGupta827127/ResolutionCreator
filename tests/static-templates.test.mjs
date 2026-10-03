import fs from "node:fs";
import { fileURLToPath } from "node:url";
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const root = projectRoot + "knowledge";
const rules = JSON.parse(fs.readFileSync(`${root}/compliance-rules.json`, "utf8"));
const ruleIds = new Set(rules.map((r) => r.id));
const ctc = JSON.parse(fs.readFileSync(`${root}/ctc-template.json`, "utf8"));
const lh = JSON.parse(fs.readFileSync(`${root}/letterhead-template.json`, "utf8"));
const notice = JSON.parse(fs.readFileSync(`${root}/notice-template.json`, "utf8"));
const knownFormats = new Set(["din", "cin", "email", "phone", "pan", "date", "number"]);
const evaluators = new Set(fs.readFileSync(projectRoot + "server/utils/complianceEngine.js", "utf8").match(/"RULE-BM-\d+":/g).map((s) => s.replace(/[":]/g, "")));

const vars = (str) => [...String(str || "").matchAll(/\{\{\s*(?:#if|#unless|\/if|\/unless|else)?\s*([a-zA-Z_][\w.]*)?\s*\}\}/g)].map((m) => m[1]).filter(Boolean);
const issues = [];
const add = (slug, msg) => issues.push(`${slug}: ${msg}`);

console.log("evaluators:", [...evaluators].join(","), " rules:", [...ruleIds].join(","));
for (const rule of ruleIds) if (!evaluators.has(rule)) add("rules", `${rule} has no evaluator`);

const files = fs.readdirSync(`${root}/resolutions`).filter((f) => f.endsWith(".json"));
const slugs = new Set();
for (const f of files) {
  const r = JSON.parse(fs.readFileSync(`${root}/resolutions/${f}`, "utf8"));
  const slug = r.slug;
  if (`${slug}.json` !== f) add(slug, `file name ${f} != slug`);
  if (slugs.has(slug)) add(slug, "duplicate slug");
  slugs.add(slug);
  for (const k of ["title", "category", "description", "meetingType", "resolutionKind", "template", "questions", "records"]) if (!r[k]) add(slug, `missing ${k}`);
  for (const k of ["agendaTitle", "proposal", "body", "minutesGist"]) if (!r.template?.[k]) add(slug, `template.${k} missing`);

  const fields = new Set();
  const ids = new Set();
  const seqs = new Set();
  for (const q of r.questions) {
    if (fields.has(q.field)) add(slug, `duplicate field ${q.field}`);
    if (ids.has(q.id)) add(slug, `duplicate id ${q.id}`);
    if (seqs.has(q.sequence)) add(slug, `duplicate sequence ${q.sequence}`);
    fields.add(q.field); ids.add(q.id); seqs.add(q.sequence);
    if (!["text", "textarea", "number", "date", "select", "radio", "email", "phone"].includes(q.type)) add(slug, `${q.field}: unsupported type ${q.type}`);
    if (["select", "radio"].includes(q.type) && !q.options?.length) add(slug, `${q.field}: ${q.type} without options`);
    if (!q.section) add(slug, `${q.field}: no section`);
    for (const v of q.validation || []) if (v.type === "format" && !knownFormats.has(v.rule)) add(slug, `${q.field}: unknown format rule ${v.rule}`);
    for (const c of q.conditions || []) {
      if (!r.questions.some((x) => x.field === c.field)) add(slug, `${q.field}: condition on unknown field ${c.field}`);
      if (c.operator !== "eq") add(slug, `${q.field}: unsupported operator ${c.operator} (engine only handles eq)`);
    }
  }
  // sections must be contiguous (wizard groups by first appearance; non-contiguous = reorder surprise)
  const order = [];
  for (const q of [...r.questions].sort((a, b) => a.sequence - b.sequence)) if (order[order.length - 1] !== q.section) order.push(q.section);
  if (new Set(order).size !== order.length) add(slug, `sections not contiguous by sequence: ${order.join(" | ")}`);

  for (const id of r.complianceRuleIds || []) if (!ruleIds.has(id)) add(slug, `unknown rule ${id}`);
  if (r.meetingType === "board" && !(r.complianceRuleIds || []).length) add(slug, "board resolution with no compliance rules");

  // template variables vs. available fields
  const extra = new Set(["agenda_title", "meeting_body", ...ctc.questions.map((q) => q.field), ...lh.questions.map((q) => q.field), ...notice.questions.map((q) => q.field)]);
  for (const [k, v] of Object.entries(r.template)) {
    for (const name of vars(v)) if (!fields.has(name) && !extra.has(name)) add(slug, `template.${k} uses {{${name}}} which no question provides`);
  }
  // required fields never used
  const used = new Set(Object.values(r.template).flatMap(vars));
  for (const q of r.questions) if (!used.has(q.field) && !["notice_days", "total_directors", "directors_present", "company_name", "cin", "meeting_date", "meeting_place", "interest_disclosed", "roc_jurisdiction"].includes(q.field)) add(slug, `question ${q.field} is never used by the template (asked but ignored)`);
  // compliance evaluators need these fields on board resolutions
  if (r.meetingType === "board") for (const need of ["notice_days", "total_directors", "directors_present"]) if (!fields.has(need)) add(slug, `board resolution lacks ${need} (rules BM-01/03 can't evaluate)`);
  // helpContent keys
  for (const k of Object.keys(r.helpContent || {})) if (!fields.has(k)) add(slug, `helpContent for unknown field ${k}`);
}
// shared templates
for (const [name, t] of [["ctc", ctc], ["letterhead", lh], ["notice", notice]]) {
  const have = new Set([...t.questions.map((q) => q.field), "company_name", "cin", "meeting_date", "meeting_place", "meeting_body", "agenda_title", "notice_days"]);
  for (const v of vars(t.body)) if (!have.has(v)) add(name, `uses {{${v}}} not provided by shared answers`);
}
console.log(issues.length ? issues.join("\n") : "no static issues");
console.log(`checked ${files.length} resolutions`);
