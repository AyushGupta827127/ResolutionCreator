<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 px-4" role="dialog" aria-modal="true" aria-labelledby="refine-title" @keydown.esc="$emit('cancel')">
    <div class="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-card-hover">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><Icon name="ph:sparkle-fill" class="h-[18px] w-[18px]" /></span>
          <h2 id="refine-title" class="font-sans text-lg font-bold text-ink-950">Refine wording</h2>
        </div>
        <button type="button" class="text-ink-400 hover:text-ink-700" aria-label="Close" @click="$emit('cancel')">
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </div>
      <p class="mt-3 text-sm leading-relaxed text-ink-600">
        Improve clarity and professionalism without changing the underlying facts or resolution intent.
      </p>

      <fieldset class="mt-4 space-y-2">
        <legend class="sr-only">Wording style</legend>
        <label
          v-for="opt in styleOptions"
          :key="opt.value"
          class="flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors"
          :class="style === opt.value ? 'border-violet-300 bg-violet-50/60' : 'border-ink-200 hover:border-ink-300'"
        >
          <input v-model="style" type="radio" name="refine-style" :value="opt.value" class="h-4 w-4 accent-violet-600" />
          <span>
            <span class="block font-medium text-ink-900">{{ opt.label }}</span>
            <span class="text-xs text-ink-500">{{ opt.hint }}</span>
          </span>
        </label>
      </fieldset>

      <details class="mt-3 text-sm">
        <summary class="cursor-pointer text-[13px] font-medium text-ink-600 hover:text-ink-900">Add your own instruction (optional)</summary>
        <textarea v-model="instruction" rows="2" class="field-input mt-2 resize-none text-sm" placeholder="e.g. Keep sentences short." aria-label="Custom instruction" />
      </details>

      <div class="mt-4 rounded-xl bg-ink-50 px-3.5 py-3 text-xs leading-relaxed text-ink-600">
        <p class="flex items-center gap-1.5 font-semibold text-ink-800"><Icon name="ph:shield-check-bold" class="h-4 w-4 text-emerald-600" /> What will NOT change</p>
        <p class="mt-1">Names, dates, CIN, amounts, company information, section citations and the resolution's intent. Only the wording is edited, and you can discard the result.</p>
      </div>

      <div class="mt-5 flex justify-end gap-3">
        <button type="button" class="btn-secondary !rounded-xl" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="btn-accent !rounded-xl" :disabled="!style && !instruction.trim()" @click="$emit('apply', { style, instruction })">
          Refine wording
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineEmits(["cancel", "apply"]);

const style = ref("");
const instruction = ref("");

const styleOptions = [
  { value: "formal", label: "More formal", hint: "Corporate / legal drafting tone." },
  { value: "concise", label: "More concise", hint: "Trim repetition without dropping any clause." },
  { value: "clarity", label: "Clearer language", hint: "Simpler sentence structure, same meaning." },
];
</script>
