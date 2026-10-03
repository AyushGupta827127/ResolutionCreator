<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden border-b border-ink-100 bg-gradient-to-br from-[#F4F7FF] via-white to-[#FFF6EE]">
      <div class="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-8 sm:px-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:px-14 lg:py-10">
        <div>
          <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-700">
            <Icon name="ph:arrow-left-bold" class="h-3.5 w-3.5" /> Back
          </NuxtLink>
          <span class="mt-4 flex w-fit items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-card">
            <Icon name="ph:plus-circle-bold" class="h-3.5 w-3.5 text-orange-500" /> Create a resolution
          </span>
          <h1 class="mt-4 font-sans text-[2.25rem] font-bold leading-[1.1] tracking-tight text-ink-950 sm:text-5xl">
            What kind of resolution <br class="hidden sm:block" /><span class="text-orange-500">are you creating?</span>
          </h1>
          <p class="mt-4 max-w-[600px] text-[16px] leading-relaxed text-ink-500 sm:text-[17px]">
            Choose the category that best matches what you need to record, and we'll show the relevant templates.
          </p>
        </div>

        <!-- Decorative document stack -->
        <div class="relative mx-auto h-[220px] w-full max-w-[420px] sm:h-[250px]" aria-hidden="true">
          <div class="absolute left-[8%] top-[10%] h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />
          <div class="absolute bottom-0 right-[8%] h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" />
          <span class="absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800 shadow-card">
            <Icon name="ph:sparkle-fill" class="h-3.5 w-3.5 text-orange-500" /> Professional templates
          </span>
          <div class="absolute left-[10%] top-[16%] z-[1] w-[31%] -rotate-[7deg] opacity-95">
            <HomeTemplateDocumentPreview :image="stack[1]" title="Shareholder Resolution" eager />
          </div>
          <div class="absolute right-[10%] top-[16%] z-[2] w-[31%] rotate-[7deg] opacity-95">
            <HomeTemplateDocumentPreview :image="stack[2]" title="Special Resolution" eager />
          </div>
          <div class="absolute left-[30%] top-[6%] z-[3] w-[38%]">
            <HomeTemplateDocumentPreview :image="stack[0]" title="Board Resolution" eager class="!shadow-[0_12px_36px_-10px_rgba(30,27,75,0.3)]" />
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="mx-auto max-w-[1440px] px-5 pb-12 pt-8 sm:px-10 lg:px-14">
      <div v-if="pending" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="skeleton h-[220px] rounded-2xl" />
      </div>

      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="(group, i) in groups"
          :key="group.value"
          type="button"
          class="group flex h-[220px] flex-col rounded-2xl border bg-white p-5 text-left shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] animate-fade-up opacity-0"
          :class="selected === group.value ? 'border-orange-300 ring-2 ring-orange-100' : 'border-ink-100'"
          :style="{ animationDelay: `${i * 0.05}s`, animationFillMode: 'forwards' }"
          :aria-label="`${group.label}: ${group.items.length} templates. Browse`"
          @click="choose(group)"
        >
          <div class="flex items-start justify-between gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" :class="group.tint">
              <Icon :name="group.icon" class="h-5 w-5" />
            </span>
            <div class="flex gap-1.5" aria-hidden="true">
              <div v-for="t in group.items.slice(0, 3)" :key="t.slug" class="w-10 transition-transform duration-200 group-hover:scale-[1.03]">
                <HomeTemplateDocumentPreview :image="t.image" :title="t.title" />
              </div>
            </div>
          </div>

          <h2 class="mt-3 font-sans text-[20px] font-bold leading-tight text-ink-950">{{ group.label }}</h2>
          <p class="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500">{{ group.description }}</p>

          <div class="mt-auto flex items-center justify-between pt-3">
            <span class="text-xs font-medium text-ink-400">{{ group.items.length }} template{{ group.items.length === 1 ? "" : "s" }}</span>
            <span class="flex items-center gap-1 text-[13px] font-semibold text-orange-500 group-hover:text-orange-600">
              Browse <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </div>
        </button>

        <!-- Not sure -->
        <NuxtLink
          to="/library"
          class="group flex h-[220px] flex-col rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/70 hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] animate-fade-up opacity-0"
          :style="{ animationDelay: `${groups.length * 0.05}s`, animationFillMode: 'forwards' }"
        >
          <div class="flex items-start justify-between gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Icon name="ph:magnifying-glass-bold" class="h-5 w-5" />
            </span>
            <div class="w-10 transition-transform duration-200 group-hover:scale-[1.03]" aria-hidden="true">
              <HomeTemplateDocumentPreview image="" title="Library" />
            </div>
          </div>
          <h2 class="mt-3 font-sans text-[20px] font-bold leading-tight text-ink-950">Not sure — search instead</h2>
          <p class="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500">Browse the full library and search by name.</p>
          <span class="mt-auto flex items-center justify-end gap-1 pt-3 text-[13px] font-semibold text-orange-500 group-hover:text-orange-600">
            Open library <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </NuxtLink>
      </div>

      <div class="mt-6">
        <HomeAISuggestionPanel :templates="cards" variant="recommend" />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { TEMPLATE_FILTERS, toTemplateCard } from "@/composables/useTemplateCatalog";

useHead({ title: "Create a resolution" });

const selected = ref(null);
const { data, pending } = await useFetch("/api/resolutions/search");
const cards = computed(() => (data.value?.results || []).map(toTemplateCard));

// Hero stack: board (main), shareholder (left), special (right)
const stack = computed(() => {
  const img = (pred, fallback) => cards.value.find(pred)?.image || fallback;
  return [
    img((c) => c.type === "Board Resolution", ""),
    img((c) => c.type === "Ordinary Resolution", ""),
    img((c) => c.type === "Special Resolution", ""),
  ];
});

const GROUP_META = {
  banking: { icon: "ph:bank-bold", tint: "bg-blue-50 text-blue-600", description: "Bank accounts, signatories, and banking authorisations." },
  directors: { icon: "ph:user-circle-gear-bold", tint: "bg-violet-50 text-violet-600", description: "Appointments, removals, and managerial changes on the Board." },
  shareholder: { icon: "ph:users-three-bold", tint: "bg-emerald-50 text-emerald-600", description: "Resolutions passed by members at a general meeting, and dividends." },
  transactions: { icon: "ph:coins-bold", tint: "bg-red-50 text-red-500", description: "Related-party dealings, borrowing limits, and other transactions." },
  general: { icon: "ph:file-text-bold", tint: "bg-slate-100 text-slate-600", description: "Registered office and other general corporate approvals." },
};

const groups = computed(() =>
  TEMPLATE_FILTERS.filter((f) => f.value !== "all")
    .map((f) => ({
      value: f.value,
      label: f.label,
      ...GROUP_META[f.value],
      items: cards.value.filter((c) => c.filter === f.value),
    }))
    .filter((g) => g.items.length)
);

function choose(group) {
  selected.value = group.value;
  navigateTo({ path: "/library", query: { category: group.value } });
}
</script>
