// A small per-category color accent (used on the /create cards and the
// catalog's group headers) — purely decorative variety, layered on top of
// the app's actual brand colors (indigo/orange), not replacing them.
const ACCENTS = [
  { match: "banking", label: "Banking", icon: "ph:bank-bold", bg: "bg-blue-50", text: "text-blue-600" },
  { match: "director", label: "Directors & KMP", icon: "ph:user-circle-gear-bold", bg: "bg-violet-50", text: "text-violet-600" },
  { match: "shareholder", label: "Shareholder / AGM", icon: "ph:users-three-bold", bg: "bg-emerald-50", text: "text-emerald-600" },
];
const DEFAULT_ACCENT = { label: "General Corporate", icon: "ph:gavel-bold", bg: "bg-ink-50", text: "text-ink-600" };

export function useCategoryAccent(category) {
  const c = (category || "").toLowerCase();
  return ACCENTS.find((a) => c.includes(a.match)) || DEFAULT_ACCENT;
}
