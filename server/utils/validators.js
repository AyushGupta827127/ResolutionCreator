// Input-layer validators (format checks). Shared by the compliance engine
// and, via the API responses, by the client-side field hints.
export const validators = {
  din: (v) => /^\d{8}$/.test(String(v ?? "").trim()),
  cin: (v) => /^[LUu]\d{5}[A-Za-z]{2}\d{4}[A-Za-z]{3}\d{6}$/.test(String(v ?? "").trim()),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim()),
  phone: (v) => /^\d{10}$/.test(String(v ?? "").replace(/\D/g, "")),
  pan: (v) => /^[A-Za-z]{5}\d{4}[A-Za-z]$/.test(String(v ?? "").trim()),
  // A real calendar date (rejects 2026-02-31, which JS would silently roll over).
  date: (v) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v ?? "").trim());
    if (!m) return false;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
  },
  number: (v) => v !== "" && v !== null && v !== undefined && typeof v !== "boolean" && Number.isFinite(Number(v)),
};

/**
 * A question with `conditions` is only actually asked (and so only actually
 * required) when those conditions hold against the current answers — same
 * rule the wizard UI uses to decide what's visible. Without this, a
 * conditionally-hidden field (e.g. `din`, only shown when `din_known` is
 * Yes) would be permanently unanswerable yet still flagged as a missing
 * required field, blocking generation entirely for the "No" branch.
 */
export function matchesConditions(question, answers) {
  if (!question.conditions?.length) return true;
  return question.conditions.every((c) => (c.operator === "eq" ? answers[c.field] === c.value : true));
}

/**
 * Drops answers to questions that are currently hidden by their conditions
 * (e.g. a DIN typed before switching "DIN known?" back to No), so stale values
 * can never leak into a generated document. Repeats until stable because a
 * hidden question can itself be the condition for another.
 */
export function pruneHiddenAnswers(questions, answers) {
  const out = { ...answers };
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of questions) {
      if (q.field in out && !matchesConditions(q, out)) {
        delete out[q.field];
        changed = true;
      }
    }
  }
  return out;
}

// Counts that must be whole numbers.
const WHOLE_NUMBER_FIELDS = new Set(["notice_days", "total_directors", "directors_present", "term_years"]);

const isEmpty = (v) => v === undefined || v === null || v === "" || (typeof v === "string" && !v.trim());

/**
 * Runs the Input layer (required + type + format + cross-field) for one
 * resolution's questions against a partial or complete answer set. Returns
 * issues in the same {ruleId, questionId, field, severity, message} shape the
 * compliance engine uses, so the client can render both lists together.
 */
export function validateAnswers(questions, answers) {
  const issues = [];
  const push = (q, severity, message) =>
    issues.push({ questionId: q.id, field: q.field, type: "input", severity, message });

  for (const q of questions) {
    if (!matchesConditions(q, answers)) continue;

    const value = answers[q.field];

    if (q.required && isEmpty(value)) {
      push(q, "critical", `${q.label} is required.`);
      continue;
    }
    if (isEmpty(value)) continue;

    // --- type checks: the API must not trust that the form sent sane values ---
    if (q.type === "number") {
      if (!validators.number(value)) {
        push(q, "critical", `${q.label} must be a number.`);
        continue;
      }
      if (Number(value) < 0) {
        push(q, "critical", `${q.label} can't be negative.`);
        continue;
      }
      if (WHOLE_NUMBER_FIELDS.has(q.field) && !Number.isInteger(Number(value))) {
        push(q, "critical", `${q.label} must be a whole number.`);
        continue;
      }
    } else if (q.type === "date") {
      if (!validators.date(value)) {
        push(q, "critical", `${q.label} must be a valid date.`);
        continue;
      }
    } else if (q.type === "email") {
      if (!validators.email(value)) push(q, "warning", `${q.label} doesn't look like a valid email address.`);
    } else if (q.type === "phone") {
      if (!validators.phone(value)) push(q, "warning", `${q.label} should be a 10-digit phone number.`);
    } else if ((q.type === "select" || q.type === "radio") && q.options?.length) {
      if (!q.options.some((o) => o.value === value)) {
        push(q, "critical", `${q.label}: choose one of the listed options.`);
        continue;
      }
    } else if (typeof value !== "string" && typeof value !== "number") {
      push(q, "critical", `${q.label} has an unsupported value.`);
      continue;
    }

    for (const rule of q.validation || []) {
      if (rule.type !== "format") continue;
      const check = validators[rule.rule];
      if (check && !check(value)) {
        push(q, rule.severity || "warning", rule.message || `${q.label} looks invalid.`);
      }
    }
  }

  // --- cross-field business sanity ---
  const byField = Object.fromEntries(questions.map((q) => [q.field, q]));
  const total = Number(answers.total_directors);
  const present = Number(answers.directors_present);
  if (byField.total_directors && validators.number(answers.total_directors) && total < 1) {
    push(byField.total_directors, "critical", "A Board must have at least one director.");
  }
  if (byField.directors_present && validators.number(answers.total_directors) && validators.number(answers.directors_present) && present > total) {
    push(byField.directors_present, "critical", "Directors present can't be more than the total strength of the Board.");
  }
  if (byField.record_date && byField.payment_date && validators.date(answers.record_date) && validators.date(answers.payment_date) && answers.payment_date < answers.record_date) {
    push(byField.payment_date, "warning", "Payment date is before the record date — dividend is normally paid after it.");
  }

  return issues;
}

/**
 * Extra documents (Notice / CTC / Letterhead) carry their own required
 * questions. The client checks them, but the API is the real gate, so it
 * validates them too when that document is requested.
 */
export function validateExtraDocument(label, template, answers) {
  return validateAnswers(template.questions || [], answers).map((i) => ({
    ...i,
    message: i.message.replace(/\.$/, "") + ` (for the ${label}).`,
  }));
}
