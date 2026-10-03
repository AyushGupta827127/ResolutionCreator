import { reactive, watch } from "vue";

// Smart Defaults, session-wide: once a `smartDefault: true` field (company
// name, CIN, meeting date, ...) is answered for one resolution, it's reused
// to prefill the same field on any other resolution in this browser tab —
// never asked twice, always shown as reused so the user can correct it.
const STORAGE_KEY = "resolution-creator:known-facts";

const facts = reactive(loadInitial());

function loadInitial() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

if (typeof window !== "undefined") {
  watch(
    facts,
    (value) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // best-effort only
      }
    },
    { deep: true }
  );
}

export function useKnownFacts() {
  const remember = (field, value) => {
    if (value !== undefined && value !== null && value !== "") facts[field] = value;
  };
  const get = (field) => facts[field];
  return { facts, remember, get };
}
