<template>
  <div>
    <!-- Page header -->
    <section class="border-b border-ink-100 bg-gradient-to-br from-white via-[#F4F7FF] to-[#FFF6EE]">
      <div class="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-10">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-card">
            <Icon name="ph:books-bold" class="h-3.5 w-3.5 text-orange-500" /> Template library
          </span>
          <h1 class="mt-4 font-sans text-[2rem] font-bold leading-tight tracking-tight text-ink-950 sm:text-[2.5rem]">
            Find the right <span class="text-orange-500">resolution template</span>
          </h1>
          <p class="mt-2.5 max-w-[560px] text-[16px] leading-relaxed text-ink-500">
            Browse professionally structured board and shareholder resolutions. Pick one, answer a few guided questions, and download.
          </p>
        </div>

        <ul class="grid grid-cols-3 gap-3 sm:max-w-[420px]">
          <li v-for="s in stats" :key="s.label" class="rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card">
            <p class="font-sans text-2xl font-bold text-ink-950">{{ s.value }}</p>
            <p class="mt-0.5 text-xs text-ink-500">{{ s.label }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="mx-auto max-w-[1440px] px-5 pb-10 pt-8 sm:px-10 lg:px-14">
      <HomeTemplateFilters v-model="activeFilter" v-model:query="query" v-model:sort="sort" />

      <div class="mt-4 flex flex-wrap items-center gap-3 text-[13px] text-ink-500" aria-live="polite">
        <span>Showing <strong class="font-semibold text-ink-900">{{ visible.length }}</strong> of {{ cards.length }} templates</span>
        <button
          v-if="rawCategory"
          type="button"
          class="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 hover:bg-orange-100"
          @click="rawCategory = ''"
        >
          {{ rawCategory }} <Icon name="ph:x-bold" class="h-3 w-3" /><span class="sr-only">Clear category filter</span>
        </button>
        <button
          v-if="isFiltered"
          type="button"
          class="font-medium text-ink-600 underline-offset-2 hover:text-ink-950 hover:underline"
          @click="reset"
        >
          Clear all
        </button>
      </div>

      <div class="mt-4">
        <HomeTemplateGrid :templates="visible" :pending="pending" :highlight-first="false" />
      </div>

      <div class="mt-8">
        <HomeAISuggestionPanel :templates="cards" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { TEMPLATE_FILTERS, toTemplateCard, sortTemplates } from "@/composables/useTemplateCatalog";

useHead({ title: "Resolution library" });

const route = useRoute();
const { data, pending } = await useFetch("/api/resolutions/search");
const cards = computed(() => (data.value?.results || []).map(toTemplateCard));

// ?category= may be a filter value (e.g. "banking") or, from /create, a raw
// catalog category string (e.g. "Board Meeting → Banking").
const incoming = typeof route.query.category === "string" ? route.query.category : "";
const isFilterValue = TEMPLATE_FILTERS.some((f) => f.value === incoming);
const activeFilter = ref(isFilterValue ? incoming : "all");
const rawCategory = ref(incoming && !isFilterValue ? incoming : "");
const query = ref(typeof route.query.q === "string" ? route.query.q : "");
const sort = ref("popular");

const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  const filtered = cards.value.filter((t) => {
    if (activeFilter.value !== "all" && t.filter !== activeFilter.value) return false;
    if (rawCategory.value && t.rawCategory !== rawCategory.value) return false;
    if (!q) return true;
    return [t.title, t.description, t.categoryLabel, ...t.keywords].some((s) => s.toLowerCase().includes(q));
  });
  return sortTemplates(filtered, sort.value);
});

const isFiltered = computed(() => activeFilter.value !== "all" || query.value.trim() || rawCategory.value);
const reset = () => {
  activeFilter.value = "all";
  query.value = "";
  rawCategory.value = "";
};

const stats = computed(() => [
  { value: cards.value.length, label: "Templates" },
  { value: cards.value.filter((c) => c.type === "Board Resolution").length, label: "Board" },
  { value: cards.value.filter((c) => c.type !== "Board Resolution").length, label: "Shareholder" },
]);
</script>
