<template>
  <section class="rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/70 via-blue-50/50 to-white p-5 sm:p-6" aria-labelledby="ai-suggest-title">
    <div class="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-center">
      <div>
        <div class="flex items-center gap-2">
          <Icon name="ph:sparkle-fill" class="h-4 w-4 text-violet-500" />
          <h2 id="ai-suggest-title" class="font-sans text-[16px] font-semibold text-ink-950">Let AI suggest for you</h2>
          <span class="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-600">BETA</span>
        </div>
        <p class="mt-1.5 text-[13px] leading-relaxed text-ink-500">Describe what you need and we'll point you to the right template.</p>
      </div>

      <div>
        <form class="flex items-center rounded-xl border border-violet-100 bg-white focus-within:ring-2 focus-within:ring-violet-200" @submit.prevent="suggest()">
          <input
            v-model="text"
            type="text"
            aria-label="Describe what you want to do"
            placeholder="e.g. Open a bank account, appoint a director…"
            class="w-full bg-transparent px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          />
          <button type="submit" aria-label="Find a template" class="m-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-white transition-colors hover:bg-ink-900">
            <Icon name="ph:arrow-right-bold" class="h-4 w-4" />
          </button>
        </form>

        <div v-if="matches" class="mt-3" aria-live="polite">
          <p v-if="!matches.length" class="text-[13px] text-ink-500">No close match — try the library search or different words.</p>

          <template v-else-if="variant === 'recommend'">
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-100 bg-white p-3.5">
              <div class="flex items-center gap-3">
                <div class="w-9 shrink-0"><HomeTemplateDocumentPreview :image="matches[0].image" :title="matches[0].title" /></div>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wide text-violet-500">Recommended template</p>
                  <p class="text-[15px] font-semibold text-ink-950">{{ matches[0].title }}</p>
                  <p class="text-xs text-ink-500">{{ matches[0].categoryLabel }} · {{ matches[0].type }}</p>
                </div>
              </div>
              <NuxtLink :to="`/r/${matches[0].slug}`" class="btn-accent !rounded-xl !px-4 !py-2 text-[13px]">
                Use this template <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>
            <div v-if="matches.length > 1" class="mt-2 flex flex-wrap items-center gap-2">
              <span class="text-xs text-ink-400">Also consider:</span>
              <NuxtLink v-for="m in matches.slice(1)" :key="m.slug" :to="`/r/${m.slug}`" class="text-xs font-medium text-violet-600 hover:underline">{{ m.title }}</NuxtLink>
            </div>
          </template>

          <div v-else class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-medium text-ink-500">Suggested:</span>
            <NuxtLink
              v-for="m in matches"
              :key="m.slug"
              :to="`/r/${m.slug}`"
              class="flex items-center gap-1.5 rounded-lg border border-violet-100 bg-white px-3 py-1.5 text-[13px] font-medium text-ink-900 hover:border-violet-300"
            >
              {{ m.title }} <Icon name="ph:arrow-right-bold" class="h-3 w-3 text-violet-500" />
            </NuxtLink>
          </div>
        </div>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="text-xs text-ink-400">Try these examples</span>
          <button
            v-for="ex in examples"
            :key="ex"
            type="button"
            class="rounded-full border border-ink-100 bg-white px-3 py-1 text-xs text-ink-600 transition-colors hover:border-violet-200 hover:text-ink-900"
            @click="suggest(ex)"
          >
            {{ ex }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";

// Deterministic keyword matcher — no model call. Scores each template by how
// many of the user's words appear in its title / keywords / description.
const props = defineProps({
  templates: { type: Array, default: () => [] },
  variant: { type: String, default: "chips" }, // "recommend" shows a single recommended-template card
});

const examples = [
  "Open a bank account for the company",
  "Appoint an additional director",
  "Change authorised bank signatories",
  "Approve a related-party transaction",
];

const STOP = new Set(["a", "an", "the", "for", "to", "of", "and", "or", "in", "on", "want", "need", "company", "please"]);
const text = ref("");
const matches = ref(null);

function suggest(preset) {
  if (preset) text.value = preset;
  const words = text.value.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  if (!words.length) {
    matches.value = null;
    return;
  }
  const scored = props.templates
    .map((t) => {
      const hay = `${t.title} ${t.keywords.join(" ")} ${t.description}`.toLowerCase();
      const titleHay = t.title.toLowerCase();
      const score = words.reduce((s, w) => s + (titleHay.includes(w) ? 3 : hay.includes(w) ? 1 : 0), 0);
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  matches.value = scored.slice(0, 3).map((x) => x.t);
}
</script>
