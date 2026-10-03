<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 px-4 py-8">
    <div class="card flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden">
      <div class="flex items-center justify-between border-b border-ink-100 p-6">
        <div>
          <h2 class="font-sans text-xl font-bold text-ink-950">Edit your answers</h2>
          <p class="mt-1 text-sm text-ink-500">Change what you need, then regenerate — no need to redo the questionnaire.</p>
        </div>
        <button class="text-ink-400 hover:text-ink-700" aria-label="Close" @click="$emit('cancel')">
          <Icon name="ph:x-bold" class="h-5 w-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div v-for="section in sections" :key="section.name" class="mb-6 last:mb-0">
          <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">{{ section.name }}</h3>
          <div class="grid gap-4 sm:grid-cols-2">
            <div v-for="q in section.questions" :key="q.id">
              <label :for="`edit-${q.field}`" class="mb-1 block text-xs font-medium text-ink-600">{{ q.label }}</label>
              <textarea
                v-if="q.type === 'textarea'"
                :id="`edit-${q.field}`"
                v-model="local[q.field]"
                rows="2"
                class="field-input !py-2 text-sm"
              />
              <select v-else-if="q.type === 'select' || q.type === 'radio'" :id="`edit-${q.field}`" v-model="local[q.field]" class="field-input !py-2 text-sm">
                <option v-for="opt in q.options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
              </select>
              <input
                v-else-if="q.type === 'number'"
                :id="`edit-${q.field}`"
                v-model.number="local[q.field]"
                type="number"
                class="field-input !py-2 text-sm"
              />
              <input
                v-else
                :id="`edit-${q.field}`"
                v-model="local[q.field]"
                :type="q.type === 'date' ? 'date' : 'text'"
                class="field-input !py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-ink-100 p-6">
        <button class="btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button class="btn-accent" @click="$emit('save', local)">
          Save &amp; Regenerate <Icon name="ph:arrow-clockwise-bold" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from "vue";

const props = defineProps({
  questions: { type: Array, required: true },
  answers: { type: Object, required: true },
});
defineEmits(["cancel", "save"]);

const local = reactive({ ...props.answers });

const sections = computed(() => {
  const bySection = new Map();
  for (const q of props.questions) {
    if (!(q.field in local)) continue; // only fields that were actually answered
    if (q.conditions?.length && !q.conditions.every((c) => (c.operator === "eq" ? local[c.field] === c.value : true))) continue; // hidden by an earlier answer
    if (!bySection.has(q.section)) bySection.set(q.section, []);
    bySection.get(q.section).push(q);
  }
  return [...bySection.entries()].map(([name, questions]) => ({ name, questions }));
});
</script>
