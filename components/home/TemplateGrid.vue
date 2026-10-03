<template>
  <div>
    <div v-if="pending" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="skeleton h-[400px] rounded-2xl" />
    </div>

    <div v-else-if="!templates.length" class="rounded-2xl border border-dashed border-ink-200 bg-white py-14 text-center text-sm text-ink-500">
      No templates match your search or filter.
    </div>

    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <HomeTemplateCard
        v-for="(t, i) in templates"
        :key="t.slug"
        :template="t"
        :featured="i === 0 && highlightFirst"
        :eager="i < 4"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  templates: { type: Array, default: () => [] },
  pending: { type: Boolean, default: false },
  highlightFirst: { type: Boolean, default: true },
});
</script>
