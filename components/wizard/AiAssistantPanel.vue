<template>
  <div class="flex flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)] xl:h-[calc(100vh-11rem)]">
    <div class="flex items-center gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
      <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
        <Icon name="ph:sparkle-fill" class="h-4 w-4" />
      </span>
      <h3 class="font-sans text-[15px] font-semibold text-ink-950">AI Assistant</h3>
      <span class="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-violet-600">BETA</span>
    </div>

    <div class="no-scrollbar flex-1 space-y-3.5 overflow-y-auto p-4">
      <div v-if="prefilledLabels.length" class="rounded-xl bg-green-50 p-3">
        <p class="flex items-start gap-1.5 text-sm font-medium text-green-800">
          <Icon name="ph:check-circle-bold" class="mt-0.5 h-4 w-4 shrink-0" />
          Found {{ prefilledLabels.length }} detail{{ prefilledLabels.length === 1 ? "" : "s" }} from earlier in this session
        </p>
        <p class="mt-1 text-xs leading-relaxed text-green-700">{{ prefilledLabels.join(", ") }} — review and edit if needed.</p>
      </div>

      <div>
        <label for="ai-free-text" class="text-[11px] font-bold uppercase tracking-wider text-violet-500">Describe in your own words</label>
        <textarea
          id="ai-free-text"
          v-model="freeText"
          rows="4"
          class="field-input mt-2 min-h-[100px] resize-none !rounded-xl text-sm leading-[1.45] placeholder:text-[#98A2B3]"
          placeholder="e.g. The company was incorporated in 2020 and has its registered office in Patna."
        />
        <button
          type="button"
          class="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-violet-300 bg-white px-4 py-2.5 text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-50 disabled:pointer-events-none disabled:opacity-40"
          :disabled="!freeText.trim() || extracting"
          @click="extract"
        >
          <Icon v-if="extracting" name="ph:circle-notch-bold" class="h-4 w-4 animate-spin" />
          <Icon v-else name="ph:sparkle-fill" class="h-4 w-4" />
          {{ extracting ? "Extracting details…" : "Extract details" }}
        </button>

        <Transition name="fade">
          <div v-if="extractedEntries.length" class="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
            <p class="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <Icon name="ph:sparkle-fill" class="h-4 w-4 text-violet-500" />
              Found {{ extractedEntries.length }} detail{{ extractedEntries.length === 1 ? "" : "s" }}
            </p>
            <ul class="mt-2.5 space-y-1.5">
              <li v-for="[field, value] in extractedEntries" :key="field" class="text-xs text-ink-600">
                <span class="block text-ink-400">{{ labelFor(field) }}</span>
                <span class="font-medium text-ink-900">{{ value }}</span>
              </li>
            </ul>
            <div class="mt-3 flex items-center gap-2">
              <button type="button" class="btn-accent !rounded-lg !px-3 !py-1.5 text-xs" @click="applySuggestions">
                Apply to form
              </button>
              <button type="button" class="btn-ghost !px-2 !py-1 text-xs" @click="extractedValues = {}">Discard</button>
            </div>
            <p class="mt-2 text-[11px] text-ink-400">Review the values above — nothing is filled in until you apply.</p>
          </div>
        </Transition>
        <p v-if="!extractedEntries.length && extractedTried" class="mt-2 text-xs text-ink-400">
          Nothing confidently extracted from that — try adding more specifics, or fill the fields directly.
        </p>
      </div>

      <div class="rounded-xl bg-violet-50/60 px-3.5 py-3">
        <p class="text-xs font-semibold text-ink-900">AI can help you with:</p>
        <ul class="mt-1.5 space-y-1 text-xs text-ink-600">
          <li v-for="c in capabilities" :key="c" class="flex items-start gap-1.5">
            <Icon name="ph:check-circle-fill" class="mt-px h-3.5 w-3.5 shrink-0 text-violet-500" /> {{ c }}
          </li>
        </ul>
      </div>

      <div v-if="quickHelp.length">
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400">Need help?</p>
        <ul class="mt-2 space-y-1">
          <li v-for="(item, i) in quickHelp" :key="i">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-ink-600 hover:bg-ink-50"
              :aria-expanded="openQuickHelp === i"
              @click="openQuickHelp = openQuickHelp === i ? -1 : i"
            >
              {{ item.question }}
              <Icon name="ph:caret-down-bold" class="h-3 w-3 shrink-0 transition-transform" :class="openQuickHelp === i ? 'rotate-180' : ''" />
            </button>
            <Transition name="fade">
              <p v-if="openQuickHelp === i" class="px-2.5 pb-2 text-xs leading-relaxed text-ink-500">{{ item.answer }}</p>
            </Transition>
          </li>
        </ul>
      </div>

      <Transition name="fade">
        <div v-if="chatAnswer" class="rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-700">{{ chatAnswer }}</div>
      </Transition>
    </div>

    <div class="border-t border-ink-100 p-3">
      <div class="flex items-center gap-2">
        <input
          v-model="chatQuestion"
          type="text"
          aria-label="Ask anything about this section"
          class="field-input !rounded-xl !py-2 text-sm"
          placeholder="Ask anything about this section…"
          @keyup.enter="askChat"
        />
        <button
          type="button"
          aria-label="Send question"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-40"
          :disabled="!chatQuestion.trim() || chatLoading"
          @click="askChat"
        >
          <Icon v-if="chatLoading" name="ph:circle-notch-bold" class="h-4 w-4 animate-spin" />
          <Icon v-else name="ph:paper-plane-tilt-bold" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  resolutionTitle: { type: String, required: true },
  sectionName: { type: String, required: true },
  sectionQuestions: { type: Array, required: true },
  prefilledLabels: { type: Array, default: () => [] },
});
const emit = defineEmits(["apply"]);

const capabilities = ["Auto-fill relevant fields", "Suggest missing information", "Explain what each field means"];

const freeText = ref("");
const extracting = ref(false);
const extractedTried = ref(false);
const extractedValues = ref({});
const extractedEntries = computed(() => Object.entries(extractedValues.value));

const openQuickHelp = ref(-1);
const chatQuestion = ref("");
const chatAnswer = ref("");
const chatLoading = ref(false);

const labelFor = (field) => props.sectionQuestions.find((q) => q.field === field)?.label || field;

const quickHelp = computed(() =>
  props.sectionQuestions
    .filter((q) => q.tooltip)
    .slice(0, 2)
    .map((q) => ({ question: `What does "${q.label}" mean?`, answer: q.tooltip }))
);

async function extract() {
  extracting.value = true;
  extractedTried.value = false;
  try {
    const res = await $fetch("/api/ai/extract-fields", {
      method: "POST",
      body: {
        resolutionTitle: props.resolutionTitle,
        sectionName: props.sectionName,
        questions: props.sectionQuestions.map((q) => ({ field: q.field, label: q.label, type: q.type })),
        freeText: freeText.value,
      },
    });
    extractedValues.value = res.values || {};
    extractedTried.value = true;
  } finally {
    extracting.value = false;
  }
}

function applySuggestions() {
  emit("apply", extractedValues.value);
  extractedValues.value = {};
  freeText.value = "";
}

async function askChat() {
  if (!chatQuestion.value.trim()) return;
  chatLoading.value = true;
  chatAnswer.value = "";
  try {
    const res = await $fetch("/api/ai/section-help", {
      method: "POST",
      body: {
        resolutionTitle: props.resolutionTitle,
        sectionName: props.sectionName,
        fields: props.sectionQuestions.map((q) => ({ label: q.label, tooltip: q.tooltip })),
        question: chatQuestion.value,
      },
    });
    chatAnswer.value = res.answer;
    chatQuestion.value = "";
  } finally {
    chatLoading.value = false;
  }
}
</script>
