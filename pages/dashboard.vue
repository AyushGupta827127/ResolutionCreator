<template>
  <div>
    <!-- Page header -->
    <section class="border-b border-ink-100 bg-gradient-to-br from-white via-[#F4F7FF] to-[#FFF6EE]">
      <div class="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14 lg:py-10">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-card">
            <Icon name="ph:clock-counter-clockwise-bold" class="h-3.5 w-3.5 text-orange-500" /> My Resolutions
          </span>
          <h1 class="mt-4 font-sans text-[2rem] font-bold leading-tight tracking-tight text-ink-950 sm:text-[2.5rem]">
            {{ greeting }}<span v-if="firstName">, <span class="text-orange-500">{{ firstName }}</span></span>
          </h1>
          <p class="mt-2.5 text-[16px] text-ink-500">Pick up a draft, reopen a saved resolution, or start a new one.</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <NuxtLink to="/create" class="btn-accent !px-6 !py-3 !text-[15px]">
              <Icon name="ph:plus-bold" class="h-4 w-4" /> Create resolution
            </NuxtLink>
            <NuxtLink to="/library" class="btn-secondary !px-6 !py-3 !text-[15px]">Browse library</NuxtLink>
          </div>
        </div>

        <ul class="grid grid-cols-3 gap-3 sm:max-w-[460px]">
          <li v-for="s in stats" :key="s.label" class="rounded-2xl border border-ink-100 bg-white px-4 py-3.5 shadow-card">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg" :class="s.tint"><Icon :name="s.icon" class="h-4 w-4" /></span>
            <p class="mt-2.5 font-sans text-2xl font-bold text-ink-950">{{ s.value }}</p>
            <p class="text-xs text-ink-500">{{ s.label }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="mx-auto grid max-w-[1440px] gap-8 px-5 pb-12 pt-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-14">
      <div class="min-w-0 space-y-8">
        <div v-if="historyStore.loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-[88px] rounded-2xl" />
        </div>

        <template v-else>
          <!-- Drafts -->
          <div v-if="draftItems.length">
            <h2 class="flex items-center gap-2 font-sans text-[17px] font-semibold text-ink-950">
              Continue where you left off
              <span class="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">{{ draftItems.length }}</span>
            </h2>
            <ul class="mt-3 grid gap-3 md:grid-cols-2">
              <li v-for="item in draftItems" :key="item.key" class="rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover">
                <div class="flex items-center gap-4">
                  <div class="w-12 shrink-0"><HomeTemplateDocumentPreview :image="item.image" :title="item.title" /></div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-[15px] font-semibold text-ink-950">{{ item.title }}</p>
                    <div class="mt-2 flex items-center gap-2">
                      <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                        <div class="h-full rounded-full bg-orange-500" :style="{ width: item.percent + '%' }" />
                      </div>
                      <span class="text-xs font-medium text-ink-500">{{ item.percent }}%</span>
                    </div>
                    <span class="status-draft badge mt-2">Draft</span>
                  </div>
                  <NuxtLink :to="item.url" class="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-orange-500 hover:text-orange-600">
                    Continue <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5" />
                  </NuxtLink>
                </div>
              </li>
            </ul>
          </div>

          <!-- Saved -->
          <div>
            <h2 class="font-sans text-[17px] font-semibold text-ink-950">Recent resolutions</h2>

            <div v-if="!savedItems.length" class="mt-3 rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
              <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Icon name="ph:scroll-bold" class="h-6 w-6" />
              </span>
              <p class="mt-3 text-[15px] font-medium text-ink-900">You haven't created a resolution yet.</p>
              <p class="mt-1 text-sm text-ink-500">Choose a template and your finished documents will show up here.</p>
              <NuxtLink to="/create" class="btn-accent mt-5 !px-5 !py-2.5 text-sm">
                Create My First Resolution <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5" />
              </NuxtLink>
            </div>

            <ul v-else class="mt-3 space-y-3">
              <li v-for="item in savedItems" :key="item.key">
                <NuxtLink
                  :to="item.url"
                  class="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div class="w-12 shrink-0"><HomeTemplateDocumentPreview :image="item.image" :title="item.title" /></div>
                  <div class="min-w-0 flex-1">
                    <p class="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink-950">
                      <span class="truncate">{{ item.title }}</span>
                      <span class="badge status-completed">Completed</span>
                    </p>
                    <p class="mt-1 flex items-center gap-1.5 text-xs text-ink-400">
                      <Icon name="ph:calendar-blank-bold" class="h-3.5 w-3.5" /> {{ item.subtitle }}
                    </p>
                  </div>
                  <span class="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-orange-500 group-hover:text-orange-600">
                    Open <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </template>
      </div>

      <aside class="space-y-6">
        <BuyCredits />
      </aside>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useProfileStore } from "@/stores/useProfileStore";
import { useHistoryStore } from "@/stores/useHistoryStore";
import { listLocalDrafts } from "@/composables/useDrafts";

definePageMeta({ middleware: "auth" });
useHead({ title: "My Resolutions" });

const { profile } = storeToRefs(useProfileStore());
const historyStore = useHistoryStore();
historyStore.fetchHistory();

const { data: catalog } = await useFetch("/api/resolutions/search");
const catalogEntry = (slug) => catalog.value?.results.find((r) => r.slug === slug);
const thumb = (slug) => `/assets/templates/${slug}.svg`;

const drafts = ref(listLocalDrafts());

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
});
const firstName = computed(() => (profile.value.name || "").trim().split(/\s+/)[0] || "");

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "";

const savedItems = computed(() =>
  historyStore.items.map((item) => ({
    key: `saved-${item.id}`,
    title: item.template_name?.replace(/^Resolution:\s*/, ""),
    subtitle: `Created ${formatDate(item.date_created)}`,
    url: item.url,
    image: thumb((item.url || "").replace(/^\/r\//, "")),
  }))
);

const draftItems = computed(() =>
  drafts.value.map((d) => {
    const entry = catalogEntry(d.slug);
    const total = entry?.questionCount || 1;
    return {
      key: `draft-${d.slug}`,
      title: entry?.title || d.slug,
      percent: Math.min(100, Math.round((d.answeredCount / total) * 100)),
      url: `/r/${d.slug}`,
      image: thumb(d.slug),
    };
  })
);

const stats = computed(() => [
  { label: "Credits", value: profile.value.credits ?? 0, icon: "ph:coins-bold", tint: "bg-orange-50 text-orange-500" },
  { label: "In progress", value: draftItems.value.length, icon: "ph:pencil-simple-line-bold", tint: "bg-violet-50 text-violet-600" },
  { label: "Completed", value: savedItems.value.length, icon: "ph:check-circle-bold", tint: "bg-emerald-50 text-emerald-600" },
]);
</script>
