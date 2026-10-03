<template>
  <div class="space-y-5">
    <!-- Secondary information: collapsed by default so it never competes with the document -->
    <div class="rounded-2xl border border-ink-100 bg-white shadow-card">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        :aria-expanded="showWhy"
        @click="showWhy = !showWhy"
      >
        <span class="font-sans text-[15px] font-semibold text-ink-950">Why this resolution was generated</span>
        <Icon :key="showWhy ? 'minus' : 'plus'" :name="showWhy ? 'ph:minus-bold' : 'ph:plus-bold'" class="h-4 w-4 shrink-0 text-ink-400" />
      </button>
      <Transition name="fade">
        <p v-if="showWhy" class="border-t border-ink-100 px-5 py-4 text-sm leading-relaxed text-ink-600">{{ result.document.proposal }}</p>
      </Transition>
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 class="font-sans text-[15px] font-semibold text-ink-950">Compliance review</h3>
      <div class="mt-3">
        <ComplianceSummary :items="complianceDisplay" />
      </div>
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 class="font-sans text-[15px] font-semibold text-ink-950">Document package</h3>
      <ul class="mt-3 divide-y divide-ink-100">
        <li v-for="doc in documentPackage" :key="doc.label" class="flex items-center justify-between py-2.5 text-sm">
          <span class="flex items-center gap-2 text-ink-700">
            <Icon :name="doc.icon" class="h-4 w-4 text-ink-400" /> {{ doc.label }}
          </span>
          <span v-if="doc.included" class="flex items-center gap-1 text-green-600">
            <Icon name="ph:check-bold" class="h-3.5 w-3.5" /> Included
          </span>
          <span v-else class="text-ink-300">Not included</span>
        </li>
      </ul>
    </div>

    <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 class="font-sans text-[15px] font-semibold text-ink-950">What happens next</h3>
      <ol class="mt-3 space-y-2.5">
        <li v-for="(step, i) in actionPlan" :key="i" class="flex gap-3">
          <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-semibold text-ink-600">
            {{ i + 1 }}
          </span>
          <p class="text-sm text-ink-700">{{ step }}</p>
        </li>
      </ol>
    </div>

    <p class="flex items-start gap-2 rounded-lg bg-gray-50 px-4 py-3 text-xs text-ink-500">
      <Icon name="ph:info-bold" class="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
      {{ result.brief.disclaimer }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { buildComplianceDisplay } from "@/composables/useComplianceDisplay";

const props = defineProps({
  result: { type: Object, required: true },
  resolution: { type: Object, required: true },
  answers: { type: Object, required: true },
});

const meetingBody = computed(() => (props.resolution.meetingType === "general" ? "Members" : "Board of Directors"));

const showWhy = ref(false);
const complianceDisplay = computed(() => buildComplianceDisplay(props.resolution.complianceRules, props.result.compliance));

const documentPackage = computed(() => [
  { label: "PDF", icon: "ph:file-pdf-bold", included: true },
  { label: "Word (.docx)", icon: "ph:file-doc-bold", included: true },
  { label: "Notice of Meeting", icon: "ph:bell-ringing-bold", included: Boolean(props.result.notice) },
  { label: "Certified True Copy", icon: "ph:stamp-bold", included: Boolean(props.result.ctc) },
  { label: "Letterhead formatting", icon: "ph:file-text-bold", included: Boolean(props.result.letterhead) },
]);

const actionPlan = computed(() => {
  const steps = [
    `Get this resolution approved by the ${meetingBody.value.toLowerCase()}, with the wording above (or your edited version).`,
    "Enter it in the Minutes Book within the usual timeframe.",
  ];
  if (props.resolution.mcaForms.length) steps.push(`File ${props.resolution.mcaForms.join(", ")} with the Registrar of Companies.`);
  if (props.result.ctc) steps.push("Issue the Certified True Copy to whoever asked for proof (bank, authority, etc.).");
  steps.push(`Retain ${props.resolution.records.join(", ").toLowerCase()} as your compliance record.`);
  return steps;
});
</script>
