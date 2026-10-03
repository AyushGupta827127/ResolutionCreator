<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
    <div class="flex items-start justify-between gap-3">
      <h3 class="flex min-w-0 items-center gap-2 font-sans text-[16px] font-semibold leading-snug text-ink-950">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="ph:check-bold" class="h-3 w-3" /></span>
        <span class="min-w-0 break-words">{{ name }}</span>
      </h3>
      <button type="button" class="-mt-1 flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-orange-500 hover:bg-orange-50 hover:text-orange-600" :aria-label="`Edit ${name}`" @click="$emit('edit')">
        <Icon name="ph:pencil-simple-bold" class="h-3.5 w-3.5" /> Edit
      </button>
    </div>

    <!-- Two fixed columns: label left, value right. Neither can overlap the other. -->
    <dl class="mt-3 divide-y divide-ink-100">
      <div v-for="item in items" :key="item.label" class="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-x-4 py-2.5 first:pt-0 last:pb-0">
        <dt class="text-[13px] leading-snug text-ink-500">{{ item.label }}</dt>
        <dd class="break-words text-right text-[14px] font-medium leading-snug text-ink-900" :title="isLong(item.value) ? item.value : undefined">
          <span :class="isLong(item.value) ? 'line-clamp-3' : ''">{{ item.value }}</span>
        </dd>
      </div>
      <p v-if="!items.length" class="py-1 text-[13px] text-ink-400">Nothing filled in for this section.</p>
    </dl>
  </div>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  items: { type: Array, required: true },
});
defineEmits(["edit"]);

// Very long answers are clamped to 3 lines; the full text is in the tooltip.
const isLong = (v) => String(v ?? "").length > 110;
</script>
