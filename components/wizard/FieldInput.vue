<template>
  <!--
    Renders three grid items (label / control / notes). The page wraps each
    field in a 3-row subgrid, so every label in a row shares one row height
    and every control starts on the same line, however long a label is.
  -->
  <div class="contents">
    <div class="mb-2 flex items-end justify-between gap-3">
      <label :for="inputId" class="text-[15px] font-semibold leading-[1.35] text-[#17205C]">
        {{ question.label }}
        <span v-if="question.required" class="text-orange-500" aria-hidden="true">*</span>
        <span v-if="question.required" class="sr-only">(required)</span>
        <span v-else class="ml-1 text-xs font-normal text-ink-400">Optional</span>
        <button
          v-if="help"
          type="button"
          class="ml-1 inline-flex h-4 w-4 -translate-y-px items-center justify-center rounded-full align-middle text-ink-300 transition-colors hover:bg-ink-50 hover:text-ink-600"
          :aria-label="`What does ${question.label} mean?`"
          :aria-expanded="showHelp"
          @click.prevent="showHelp = !showHelp"
        >
          <Icon name="ph:info-bold" class="h-3.5 w-3.5" />
        </button>
      </label>
      <span v-if="reused" class="badge badge-info shrink-0 normal-case tracking-normal">
        <Icon name="ph:check-bold" class="h-3 w-3 text-green-600" /> Reused
      </span>
      <span v-else-if="aiSuggested" class="badge shrink-0 bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100 normal-case tracking-normal">
        <Icon name="ph:warning-bold" class="h-3 w-3" /> AI suggestion — verify
      </span>
    </div>

    <div class="min-w-0">
      <Transition name="fade">
        <div v-if="showHelp && help" class="mb-2 rounded-lg bg-ink-50 px-3.5 py-2.5 text-sm text-ink-600">
          <p>{{ help.meaning }}</p>
          <p v-if="help.applicableSection" class="mt-1 text-xs font-medium text-ink-400">{{ help.applicableSection }}</p>
          <p v-if="help.tip" class="mt-1 text-xs italic text-ink-500">{{ help.tip }}</p>
        </div>
      </Transition>

      <input
        v-if="['text', 'email', 'phone'].includes(question.type)"
        :id="inputId"
        v-model="localValue"
        :type="question.type === 'phone' ? 'tel' : question.type"
        class="field-input h-12"
        :placeholder="question.placeholder"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
      />
      <input
        v-else-if="question.type === 'number'"
        :id="inputId"
        v-model.number="localValue"
        type="number"
        class="field-input h-12"
        :placeholder="question.placeholder"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
      />
      <input
        v-else-if="question.type === 'date'"
        :id="inputId"
        v-model="localValue"
        type="date"
        class="field-input h-12"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
      />
      <textarea
        v-else-if="question.type === 'textarea'"
        :id="inputId"
        v-model="localValue"
        rows="4"
        class="field-input min-h-[112px] resize-none"
        :placeholder="question.placeholder"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
      />
      <select
        v-else-if="question.type === 'select'"
        :id="inputId"
        v-model="localValue"
        class="field-input h-12"
        :aria-invalid="!!error"
        :aria-describedby="describedBy"
      >
        <option value="" disabled>Choose one</option>
        <option v-for="opt in question.options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
      </select>
      <div
        v-else-if="question.type === 'radio' && question.options?.length === 2"
        :id="inputId"
        role="group"
        :aria-label="question.label"
        class="inline-flex overflow-hidden rounded-xl border border-ink-200"
      >
        <button
          v-for="(opt, i) in question.options"
          :key="String(opt.value)"
          type="button"
          :aria-pressed="localValue === opt.value"
          class="h-12 px-7 text-sm font-semibold transition-colors"
          :class="[localValue === opt.value ? 'bg-ink-950 text-white' : 'bg-white text-ink-600 hover:bg-ink-50', i === 0 ? 'border-r border-ink-200' : '']"
          @click="localValue = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
      <div v-else-if="question.type === 'radio'" :id="inputId" role="group" :aria-label="question.label" class="grid grid-cols-2 gap-2.5">
        <button
          v-for="opt in question.options"
          :key="String(opt.value)"
          type="button"
          :aria-pressed="localValue === opt.value"
          class="rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
          :class="localValue === opt.value ? 'border-ink-950 bg-ink-950 text-white' : 'border-ink-200 text-ink-700 hover:border-ink-400'"
          @click="localValue = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Always present (fixed minimum height) so an error appearing never shifts the grid -->
    <div :id="`${inputId}-note`" class="min-h-9 pt-1.5 pb-3">
      <p v-if="question.tooltip" class="text-xs leading-snug text-ink-400">{{ question.tooltip }}</p>
      <Transition name="fade">
        <p v-if="error" role="alert" class="flex items-center gap-1 text-xs text-red-600" :class="question.tooltip ? 'mt-1' : ''">
          <Icon name="ph:warning-circle-bold" class="h-3.5 w-3.5" /> {{ error }}
        </p>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { default: "" },
  help: { type: Object, default: null },
  reused: { type: Boolean, default: false },
  aiSuggested: { type: Boolean, default: false },
  error: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const localValue = ref(props.modelValue ?? "");
const showHelp = ref(false);

const inputId = computed(() => `field-${props.question.field}`);
const describedBy = computed(() => `${inputId.value}-note`);

watch(
  () => props.modelValue,
  (v) => (localValue.value = v ?? "")
);
watch(localValue, (v) => emit("update:modelValue", v));
</script>
