<template>
  <div class="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
    <h3 class="font-sans text-[16px] font-semibold text-ink-950">Resolution summary</h3>

    <dl class="mt-4 divide-y divide-ink-100 text-sm">
      <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 py-2.5 first:pt-0">
        <dt class="text-[13px] text-ink-500">Status</dt>
        <dd><span class="badge status-draft">Draft</span></dd>
      </div>
      <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 py-2.5">
        <dt class="text-[13px] text-ink-500">Resolution</dt>
        <dd class="break-words text-[14px] font-medium leading-snug text-ink-900">{{ resolution.title }}</dd>
      </div>
      <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 py-2.5">
        <dt class="text-[13px] text-ink-500">Category</dt>
        <dd class="text-[14px] font-medium text-ink-900">{{ accent.label }}</dd>
      </div>
      <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 py-2.5">
        <dt class="text-[13px] text-ink-500">Meeting</dt>
        <dd class="text-[14px] font-medium text-ink-900">{{ resolution.meetingType === "general" ? "General Meeting" : "Board Meeting" }}</dd>
      </div>
      <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 py-2.5">
        <dt class="text-[13px] text-ink-500">Generated</dt>
        <dd class="text-[14px] font-medium text-ink-900">{{ generatedDate }}</dd>
      </div>
      <div class="grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 py-2.5 last:pb-0">
        <dt class="text-[13px] text-ink-500">Compliance</dt>
        <dd class="space-y-0.5 text-[13px] font-medium">
          <p class="flex items-center gap-1.5 text-emerald-700"><Icon name="ph:check-circle-fill" class="h-3.5 w-3.5" /> {{ counts.pass }} passed</p>
          <p v-if="counts.information" class="flex items-center gap-1.5 text-blue-600"><Icon name="ph:info-bold" class="h-3.5 w-3.5" /> {{ counts.information }} informational</p>
          <p v-if="counts.actionRequired" class="flex items-center gap-1.5 text-amber-700"><Icon name="ph:warning-bold" class="h-3.5 w-3.5" /> {{ counts.actionRequired }} acknowledged</p>
        </dd>
      </div>
    </dl>

    <p class="mt-4 rounded-lg bg-ink-50 px-3 py-2.5 text-xs leading-relaxed text-ink-500">
      This document is a generated draft, not a legally finalised document. Review the details with a qualified professional before using or filing it.
    </p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useCategoryAccent } from "@/composables/useCategoryAccent";
import { buildComplianceDisplay, complianceCounts } from "@/composables/useComplianceDisplay";

const props = defineProps({
  result: { type: Object, required: true },
  resolution: { type: Object, required: true },
});

const accent = computed(() => useCategoryAccent(props.resolution.category));
const generatedDate = computed(() =>
  new Date(props.result.generatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
);
const counts = computed(() => complianceCounts(buildComplianceDisplay(props.resolution.complianceRules, props.result.compliance)));
</script>
