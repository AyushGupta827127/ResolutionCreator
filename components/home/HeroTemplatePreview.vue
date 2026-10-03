<template>
  <div class="relative mx-auto h-[400px] w-full max-w-[560px] sm:h-[440px] lg:h-[460px]">
    <span class="absolute right-4 top-0 z-10 rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 shadow-card">
      Template preview
    </span>

    <div class="absolute left-[2%] top-[14%] z-[1] w-[34%] -rotate-[5deg] opacity-95 sm:w-[32%]">
      <HomeTemplateDocumentPreview :image="docs[1]?.image" :title="docs[1]?.title" eager />
    </div>
    <div class="absolute right-[3%] top-[18%] z-[2] w-[30%] rotate-[4deg] opacity-95">
      <HomeTemplateDocumentPreview :image="docs[2]?.image" :title="docs[2]?.title" eager />
    </div>
    <div class="absolute left-[24%] top-[4%] z-[3] w-[44%]">
      <HomeTemplateDocumentPreview :image="docs[0]?.image" :title="docs[0]?.title" eager class="!shadow-[0_10px_40px_-10px_rgba(30,27,75,0.28)]" />
    </div>

    <div v-if="docs[0]" class="absolute bottom-0 right-0 z-[4] w-[68%] max-w-[330px] rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_12px_36px_-12px_rgba(30,27,75,0.25)] sm:p-5">
      <div class="flex items-center gap-2.5">
        <span class="flex h-8 w-8 items-center justify-center rounded-lg" :class="docs[0].tint">
          <Icon :name="docs[0].icon" class="h-4 w-4" />
        </span>
        <p class="text-[15px] font-semibold text-ink-950">{{ docs[0].title }}</p>
      </div>
      <p class="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-ink-500">{{ docs[0].description }}</p>
      <div class="mt-3 flex flex-wrap gap-1.5">
        <span class="rounded-md bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-600">{{ docs[0].categoryLabel }}</span>
        <span class="rounded-md bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-600">{{ docs[0].type }}</span>
      </div>
      <NuxtLink
        :to="`/r/${docs[0].slug}`"
        class="mt-3.5 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-[13px] font-semibold text-orange-600 transition-colors hover:bg-orange-50"
      >
        <Icon name="ph:eye-bold" class="h-4 w-4" /> View template <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
// docs: template cards (see useTemplateCatalog) — [0] main, [1] back-left, [2] back-right
defineProps({ docs: { type: Array, default: () => [] } });
</script>
