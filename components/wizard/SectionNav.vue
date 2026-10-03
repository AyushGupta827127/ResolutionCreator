<template>
  <div>
    <p class="text-xs font-semibold uppercase tracking-wide text-ink-400">On this resolution</p>
    <ol class="relative mt-3 space-y-1">
      <!-- vertical connector -->
      <span class="absolute bottom-[26px] left-[24px] top-[26px] w-px bg-[#E3E6ED]" aria-hidden="true" />
      <li v-for="(section, i) in sections" :key="section.name" class="relative">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-default"
          :class="
            section.status === 'current'
              ? 'border-orange-200 bg-orange-50'
              : section.status === 'done'
              ? 'border-transparent hover:bg-white'
              : 'border-transparent'
          "
          :disabled="section.status === 'upcoming'"
          :aria-current="section.status === 'current' ? 'step' : undefined"
          @click="$emit('jump', section)"
        >
          <span
            class="relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
            :class="
              section.status === 'done'
                ? 'bg-emerald-500 text-white'
                : section.status === 'current'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-ink-500 ring-1 ring-inset ring-ink-200'
            "
          >
            <Icon v-if="section.status === 'done'" name="ph:check-bold" class="h-3 w-3" />
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="min-w-0">
            <span class="block truncate text-[14px]" :class="section.status === 'current' ? 'font-semibold text-ink-950' : section.status === 'done' ? 'font-medium text-ink-800' : 'text-ink-600'">
              {{ section.name }}
            </span>
            <span class="text-xs" :class="section.completed === section.total && section.total > 0 ? 'text-emerald-600' : 'text-ink-400'">
              {{ section.completed }} / {{ section.total }} complete
            </span>
          </span>
        </button>
      </li>
    </ol>
  </div>
</template>

<script setup>
defineProps({ sections: { type: Array, required: true } });
defineEmits(["jump"]);
</script>
