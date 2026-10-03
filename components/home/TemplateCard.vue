<template>
  <article
    class="group relative flex h-[334px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_8px_24px_rgba(15,23,42,0.09)] focus-within:ring-2 focus-within:ring-orange-300"
  >
    <!-- Document preview -->
    <div class="relative flex h-[152px] shrink-0 items-start justify-center overflow-hidden bg-[#F7F9FC] pt-3.5">
      <span
        v-if="popular"
        class="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-600 ring-1 ring-inset ring-orange-100"
      >
        <Icon name="ph:star-fill" class="h-3 w-3" /> Popular
      </span>

      <!-- larger sheet, top-anchored and cropped at the bottom so the text stays legible while the card stays short -->
      <div class="w-[176px] origin-top transition-transform duration-200 ease-out group-hover:scale-[1.02]">
        <HomeTemplateDocumentPreview :image="template.image" :title="template.title" :eager="eager" />
      </div>

      <NuxtLink
        :to="`/r/${template.slug}`"
        :aria-label="`Preview ${template.title}`"
        class="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-lg border border-ink-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-800 shadow-sm transition-opacity duration-200 hover:border-ink-200 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
      >
        Preview <Icon name="ph:arrow-up-right-bold" class="h-3 w-3" />
      </NuxtLink>
    </div>

    <!-- Content -->
    <div class="flex flex-1 flex-col border-t border-ink-100 px-4 pb-3 pt-3">
      <p class="flex items-center gap-1.5 text-[12px] font-medium">
        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" :class="template.tint">
          <Icon :name="template.icon" class="h-3.5 w-3.5" />
        </span>
        <span class="shrink-0 whitespace-nowrap text-ink-950">{{ template.categoryLabel }}</span>
        <span class="text-ink-300" aria-hidden="true">·</span>
        <span class="min-w-0 truncate text-ink-500">{{ template.type }}</span>
      </p>

      <h3 class="mt-2 line-clamp-2 font-sans text-[16px] font-semibold leading-[1.3] text-ink-950">
        {{ template.title }}
      </h3>
      <p class="mt-1 mb-3 line-clamp-2 text-[12.5px] leading-[1.45] text-ink-500">{{ template.description }}</p>

      <div class="mt-auto flex items-center justify-between pt-2">
        <span class="flex items-center gap-1 whitespace-nowrap text-xs text-ink-400">
          <Icon v-if="template.usageLabel" name="ph:trend-up-bold" class="h-3.5 w-3.5" />{{ template.usageLabel }}
        </span>
        <!-- stretched link: the whole card is clickable, this is its keyboard target -->
        <NuxtLink
          :to="`/r/${template.slug}`"
          :aria-label="`Use template: ${template.title}`"
          class="flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-orange-500 transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-orange-600"
        >
          Use template
          <Icon name="ph:arrow-right-bold" class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  template: { type: Object, required: true },
  // kept so the existing grid's `featured` binding still works; every card now shares one style
  featured: { type: Boolean, default: false },
  eager: { type: Boolean, default: false },
});

// No "popular" flag exists in the data yet; derive it from the (placeholder) usage count.
const popular = computed(() => props.template.popular ?? props.template.usage >= 900);
</script>
