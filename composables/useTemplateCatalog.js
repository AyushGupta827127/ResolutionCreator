// Presentation metadata for the home-page template library. The resolution
// content itself still comes from /api/resolutions/search; this only adds the
// display-side bits (filter bucket, thumbnail, icon, usage).
//
// `usage` is PLACEHOLDER demo data — there is no usage tracking in the backend
// yet. Replace with a real count (or drop the field) once one exists.
export const TEMPLATE_FILTERS = [
  { value: "all", label: "All templates", icon: "ph:squares-four-bold" },
  { value: "banking", label: "Banking", icon: "ph:bank-bold" },
  { value: "directors", label: "Directors & KMP", icon: "ph:user-circle-gear-bold" },
  { value: "shareholder", label: "Shareholder / AGM", icon: "ph:users-three-bold" },
  { value: "transactions", label: "Transactions", icon: "ph:coins-bold" },
  { value: "general", label: "General", icon: "ph:file-text-bold" },
];

const META = {
  "open-bank-account": { filter: "banking", usage: 1200, icon: "ph:bank-bold", tint: "bg-blue-50 text-blue-600" },
  "change-bank-signatories": { filter: "banking", usage: 540, icon: "ph:signature-bold", tint: "bg-blue-50 text-blue-600" },
  "appoint-additional-director": { filter: "directors", usage: 980, icon: "ph:users-bold", tint: "bg-violet-50 text-violet-600" },
  "appoint-managing-director": { filter: "directors", usage: 610, icon: "ph:user-circle-gear-bold", tint: "bg-violet-50 text-violet-600" },
  "approve-related-party-transaction": { filter: "transactions", usage: 640, icon: "ph:coins-bold", tint: "bg-red-50 text-red-500" },
  "appoint-director-retiring-by-rotation": { filter: "shareholder", usage: 756, icon: "ph:users-three-bold", tint: "bg-emerald-50 text-emerald-600" },
  "declare-interim-dividend": { filter: "shareholder", usage: 830, icon: "ph:money-bold", tint: "bg-amber-50 text-amber-600" },
  "appoint-statutory-auditor": { filter: "shareholder", usage: 720, icon: "ph:seal-check-bold", tint: "bg-emerald-50 text-emerald-600" },
  "approve-borrowing-limits": { filter: "transactions", usage: 480, icon: "ph:hand-coins-bold", tint: "bg-red-50 text-red-500" },
  "change-registered-office-local-limits": { filter: "general", usage: 390, icon: "ph:buildings-bold", tint: "bg-slate-100 text-slate-600" },
};
const FALLBACK = { filter: "general", usage: 0, icon: "ph:file-text-bold", tint: "bg-ink-50 text-ink-600" };

const KIND_LABEL = { board: "Board Resolution", ordinary: "Ordinary Resolution", special: "Special Resolution" };

export const formatUsage = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n));

/** Decorates a /api/resolutions/search result with display metadata. */
export function toTemplateCard(r, index = 0) {
  const meta = META[r.slug] || FALLBACK;
  const filter = TEMPLATE_FILTERS.find((f) => f.value === meta.filter);
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    keywords: r.keywords || [],
    rawCategory: r.category,
    categoryLabel: meta.filter === "general" ? "General" : filter.label,
    filter: meta.filter,
    type: KIND_LABEL[r.resolutionKind] || "Resolution",
    image: `/assets/templates/${r.slug}.svg`,
    icon: meta.icon,
    tint: meta.tint,
    usage: meta.usage,
    usageLabel: meta.usage ? `Used ${formatUsage(meta.usage)} times` : "",
    order: index,
  };
}

export const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "recent", label: "Recently added" },
  { value: "az", label: "A–Z" },
  { value: "used", label: "Most used" },
];

export function sortTemplates(list, mode) {
  const copy = [...list];
  if (mode === "az") return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (mode === "recent") return copy.sort((a, b) => b.order - a.order);
  return copy.sort((a, b) => b.usage - a.usage); // popular / used
}
