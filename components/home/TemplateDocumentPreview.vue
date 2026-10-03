<template>
  <div class="relative aspect-[210/297] overflow-hidden rounded-[10px] bg-white shadow-paper ring-1 ring-ink-100">
    <img
      v-if="image && !failed"
      :src="image"
      :alt="`${title} template preview`"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="h-full w-full object-cover"
      @error="failed = true"
    />
    <!-- CSS fallback: a generic A4 sheet, never a broken-image icon -->
    <div v-else class="flex h-full flex-col gap-[5%] p-[9%]" role="img" :aria-label="`${title} template placeholder`">
      <div class="h-[3%] w-[45%] self-center rounded bg-ink-950/80" />
      <div class="h-[2%] w-[30%] self-center rounded bg-ink-200" />
      <div class="mt-[6%] space-y-[4%]">
        <div v-for="w in [100, 94, 100, 86, 98, 70]" :key="w" class="h-[1.6%] rounded bg-ink-100" :style="{ width: `${w}%` }" />
      </div>
      <div class="mt-auto flex justify-between">
        <div class="h-px w-[28%] bg-ink-300" />
        <div class="h-px w-[28%] bg-ink-300" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  image: { type: String, default: "" },
  title: { type: String, default: "Template" },
  eager: { type: Boolean, default: false },
});
const failed = ref(false);
</script>
