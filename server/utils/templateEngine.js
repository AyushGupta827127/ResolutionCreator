import Handlebars from "handlebars";

// All rendering is PLAIN TEXT (noEscape). The browser shows these strings through
// Vue text interpolation (which escapes), the DOCX writer takes them as literal text,
// and the one place that builds HTML (saving to history) escapes explicitly. Escaping
// here as well would double-escape — "Tom & Jerry" would show as "Tom &amp; Jerry".

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function formatDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
  if (!m) return value;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function prepareContext(answers) {
  const ctx = {};
  for (const [key, value] of Object.entries(answers || {})) {
    if (typeof value === "string") ctx[key] = formatDate(value.trim());
    // Indian digit grouping (5,00,00,000) for amounts; small counts are unaffected.
    else if (typeof value === "number" && Number.isFinite(value)) ctx[key] = inr.format(value);
    else ctx[key] = value;
  }
  return ctx;
}

const cache = new Map();
function compile(templateString) {
  if (!templateString) return () => "";
  if (!cache.has(templateString)) cache.set(templateString, Handlebars.compile(templateString, { noEscape: true }));
  return cache.get(templateString);
}

export function renderResolution(resolution, answers) {
  const ctx = prepareContext(answers);
  const t = resolution.template;
  // Some resolutions ask "include an explanatory statement?" — honour a No.
  const wantsExplanatory = answers?.include_explanatory_statement !== false;
  return {
    agendaTitle: compile(t.agendaTitle)(ctx),
    proposal: compile(t.proposal)(ctx),
    body: compile(t.body)(ctx),
    explanatoryStatement: t.explanatoryStatement && wantsExplanatory ? compile(t.explanatoryStatement)(ctx) : null,
    minutesGist: compile(t.minutesGist)(ctx),
  };
}

export const renderCtc = (ctcTemplate, answers) => compile(ctcTemplate.body)(prepareContext(answers));
export const renderLetterhead = (letterheadTemplate, answers) => compile(letterheadTemplate.body)(prepareContext(answers));
export const renderNotice = (noticeTemplate, answers) => compile(noticeTemplate.body)(prepareContext(answers));

// Kept as aliases: DOCX used a separate "plain" path when the main one escaped.
export const renderResolutionPlain = renderResolution;
export const renderCtcPlain = renderCtc;
export const renderLetterheadPlain = renderLetterhead;
export const renderNoticePlain = renderNotice;
