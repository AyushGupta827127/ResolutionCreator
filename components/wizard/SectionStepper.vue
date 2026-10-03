<template>
  <nav class="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0" aria-label="Resolution sections">
    <ol class="flex min-w-max items-center rounded-2xl border border-ink-100 bg-white px-5 py-3 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <template v-for="(s, i) in sections" :key="s.name">
        <li class="flex items-center">
          <button
            type="button"
            class="flex items-center gap-2.5 rounded-lg py-1 pr-1 text-left disabled:cursor-default"
            :disabled="s.status === 'upcoming'"
            :aria-current="s.status === 'current' ? 'step' : undefined"
            @click="$emit('jump', s)"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors"
              :class="
                s.status === 'done'
                  ? 'bg-emerald-500 text-white'
                  : s.status === 'current'
                  ? 'bg-orange-500 text-white ring-4 ring-orange-100'
                  : 'bg-ink-100 text-ink-500'
              "
            >
              <Icon v-if="s.status === 'done'" name="ph:check-bold" class="h-4 w-4" />
              <span v-else>{{ i + 1 }}</span>
            </span>
            <span class="whitespace-nowrap text-[13px] font-medium" :class="s.status === 'upcoming' ? 'text-ink-500' : 'text-ink-950'">{{ s.name }}</span>
          </button>
        </li>
        <li v-if="i < sections.length - 1" class="mx-3 h-px w-8 shrink-0 lg:w-auto lg:min-w-[24px] lg:flex-1" :class="s.status === 'done' ? 'bg-emerald-300' : 'bg-ink-200'" aria-hidden="true" />
      </template>
    </ol>
  </nav>
</template>

<script setup>
defineProps({ sections: { type: Array, required: true } });
defineEmits(["jump"]);
</script>
