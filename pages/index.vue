<template>
  <div>
    <HomeHeroSection :docs="heroDocs" />

    <section id="templates" class="mx-auto max-w-[1440px] scroll-mt-20 px-5 pb-10 pt-8 sm:px-10 lg:px-14">
      <HomeTemplateFilters v-model="activeFilter" v-model:query="query" v-model:sort="sort" />

      <div class="mt-5">
        <HomeTemplateGrid :templates="visible" :pending="pending" :highlight-first="isDefaultView" />
      </div>

      <div class="mt-8">
        <HomeAISuggestionPanel :templates="cards" />
      </div>

      <div id="how-it-works" class="mt-8 scroll-mt-24">
        <HomeHowItWorks />
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { toTemplateCard, sortTemplates } from "@/composables/useTemplateCatalog";

useHead({ title: "Resolution Creator" });

const { data, pending } = await useFetch("/api/resolutions/search");

const activeFilter = ref("all");
const query = ref("");
const sort = ref("popular");

const cards = computed(() => (data.value?.results || []).map(toTemplateCard));

const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  const filtered = cards.value.filter((t) => {
    if (activeFilter.value !== "all" && t.filter !== activeFilter.value) return false;
    if (!q) return true;
    return [t.title, t.description, t.categoryLabel, ...t.keywords].some((s) => s.toLowerCase().includes(q));
  });
  return sortTemplates(filtered, sort.value);
});

// Only highlight the first card when it's the genuine "top template" view.
const isDefaultView = computed(() => activeFilter.value === "all" && !query.value.trim() && sort.value === "popular");

// Hero stack: main = Open a Bank Account, backs = a director and an AGM template.
const heroDocs = computed(() => {
  const by = (slug) => cards.value.find((c) => c.slug === slug);
  return [by("open-bank-account"), by("appoint-additional-director"), by("appoint-director-retiring-by-rotation")].filter(Boolean);
});
</script>
