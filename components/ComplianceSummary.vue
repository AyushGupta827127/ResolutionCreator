<template>
  <div>
    <!-- Overall status: understandable without reading any card -->
    <div class="rounded-xl border px-4 py-3" :class="counts.actionRequired ? (counts.blocking ? 'border-red-200 bg-red-50/60' : 'border-amber-200 bg-amber-50/60') : 'border-emerald-200 bg-emerald-50/60'">
      <p class="flex items-center gap-2 text-[14px] font-semibold" :class="counts.blocking ? 'text-red-800' : counts.actionRequired ? 'text-amber-800' : 'text-emerald-800'">
        <Icon :key="counts.actionRequired ? 'warn' : 'ok'" :name="counts.actionRequired ? 'ph:warning-bold' : 'ph:check-circle-fill'" class="h-[18px] w-[18px]" />
        {{ counts.actionRequired ? "Compliance review needs attention" : "Compliance review complete" }}
      </p>
      <p v-if="!items.length" class="mt-1.5 text-[13px] leading-relaxed text-ink-700">
        No specific compliance rules are configured for this type of resolution yet, so nothing was checked automatically. Please have it reviewed by your company secretary or legal adviser.
      </p>
      <ul v-else class="mt-1.5 space-y-0.5 text-[13px] text-ink-700">
        <li>{{ plural(counts.pass, "requirement") }} passed</li>
        <li v-if="counts.actionRequired" class="font-semibold">{{ counts.actionRequired }} action{{ counts.actionRequired === 1 ? "" : "s" }} required<span v-if="counts.blocking" class="font-normal"> — {{ counts.blocking }} must be fixed before generating</span></li>
        <li v-if="counts.information">{{ plural(counts.information, "informational note") }}</li>
        <li v-if="!counts.actionRequired" class="text-emerald-700">No blocking issues found.</li>
      </ul>
    </div>

    <div class="mt-3 space-y-2.5">
      <ComplianceCheckCard v-for="item in ordered" :key="item.ruleId" :item="item" @fix="(fields) => $emit('fix', fields)" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { complianceCounts, plural } from "@/composables/useComplianceDisplay";

const props = defineProps({ items: { type: Array, required: true } });
defineEmits(["fix"]);

const counts = computed(() => complianceCounts(props.items));

// What needs attention first; reassuring passes last.
const order = { critical: 0, warning: 1, information: 2, pass: 3 };
const ordered = computed(() => [...props.items].sort((a, b) => order[a.severity] - order[b.severity]));
</script>
