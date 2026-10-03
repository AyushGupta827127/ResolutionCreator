<template>
  <ol class="mx-auto flex max-w-[640px] items-center justify-center rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card" aria-label="Progress">
    <template v-for="(label, i) in steps" :key="label">
      <li class="flex items-center gap-2" :aria-current="i === current ? 'step' : undefined">
        <span
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors"
          :class="
            i < current
              ? 'bg-emerald-500 text-white'
              : i === current
              ? 'bg-orange-500 text-white ring-4 ring-orange-100'
              : 'bg-ink-100 text-ink-400'
          "
        >
          <Icon v-if="i < current" name="ph:check-bold" class="h-3.5 w-3.5" />
          <span v-else>{{ i + 1 }}</span>
        </span>
        <span class="hidden text-[13px] font-medium sm:block" :class="i <= current ? 'text-ink-900' : 'text-ink-400'">{{ label }}</span>
      </li>
      <li v-if="i < steps.length - 1" class="mx-2 h-px flex-1 sm:mx-3" :class="i < current ? 'bg-emerald-400' : 'bg-ink-200'" aria-hidden="true" />
    </template>
  </ol>
</template>

<script setup>
defineProps({
  steps: { type: Array, required: true },
  current: { type: Number, required: true },
});
</script>
