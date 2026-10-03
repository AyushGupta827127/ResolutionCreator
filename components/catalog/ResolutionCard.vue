<template>
  <NuxtLink
    :to="`/r/${resolution.slug}`"
    class="card card-hover group relative flex flex-col gap-3 overflow-hidden p-5"
  >
    <div
      class="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-100/0 blur-2xl transition-colors duration-300 group-hover:bg-orange-100/60"
      aria-hidden="true"
    />
    <div class="flex items-center justify-between">
      <span class="badge badge-info">{{ kindLabel }}</span>
      <span
        class="flex h-7 w-7 items-center justify-center rounded-full border border-ink-100 text-ink-300 transition-all duration-300 group-hover:border-ink-900 group-hover:bg-ink-950 group-hover:text-orange-400"
      >
        <Icon name="ph:arrow-up-right-bold" class="h-3.5 w-3.5" />
      </span>
    </div>
    <h3 class="font-serif text-lg font-semibold leading-snug text-ink-950 transition-colors group-hover:text-ink-800">
      {{ resolution.title }}
    </h3>
    <p class="line-clamp-2 text-sm text-ink-500">{{ resolution.description }}</p>
    <p class="mt-auto text-xs font-medium text-ink-400">{{ resolution.category }}</p>
  </NuxtLink>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({ resolution: { type: Object, required: true } });

const kindLabel = computed(() => {
  const map = { board: "Board Resolution", ordinary: "Ordinary Resolution", special: "Special Resolution" };
  return map[props.resolution.resolutionKind] || "Resolution";
});
</script>
