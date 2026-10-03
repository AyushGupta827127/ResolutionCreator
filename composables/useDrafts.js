const PREFIX = "resolution-draft:";

/** Scans localStorage for every in-progress wizard draft, across all resolutions. */
export function listLocalDrafts() {
  if (typeof window === "undefined") return [];
  const drafts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      drafts.push({ slug: key.slice(PREFIX.length), answeredCount: Object.keys(parsed?.answers || {}).length });
    } catch {
      // skip corrupt entries
    }
  }
  return drafts;
}
