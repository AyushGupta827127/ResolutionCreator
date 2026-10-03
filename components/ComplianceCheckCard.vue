<template>
  <div class="rounded-xl border p-4" :class="style.card">
    <div class="flex items-start gap-2.5">
      <Icon :key="style.icon" :name="style.icon" class="mt-0.5 h-4 w-4 shrink-0" :class="style.text" />
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-semibold uppercase tracking-wide" :class="style.text">{{ style.label }}</p>
        <p class="mt-0.5 text-[14px] font-semibold leading-snug text-ink-900">{{ item.title }}</p>
        <p class="mt-1 text-[13px] leading-relaxed text-ink-600">{{ item.message }}</p>

        <p v-if="item.detail" class="mt-2 rounded-lg bg-white/80 px-3 py-2 text-[13px] font-medium text-ink-800 ring-1 ring-inset ring-ink-100">{{ item.detail }}</p>
        <p v-if="item.recommendation && item.severity !== 'pass'" class="mt-1.5 text-[13px] leading-relaxed text-ink-500">{{ item.recommendation }}</p>
        <p v-if="style.hint" class="mt-2 text-xs font-medium" :class="style.text">{{ style.hint }}</p>

        <div class="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs text-ink-400">{{ item.section }}</p>
          <button
            v-if="item.fields?.length && (item.severity === 'critical' || item.severity === 'warning')"
            type="button"
            class="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset hover:bg-orange-50"
            :class="item.severity === 'critical' ? 'text-orange-600 ring-orange-200' : 'text-ink-700 ring-ink-200'"
            @click="$emit('fix', item.fields)"
          >
            {{ item.fixLabel || "Review details" }} <Icon name="ph:arrow-right-bold" class="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({ item: { type: Object, required: true } });
defineEmits(["fix"]);

// Information is deliberately calm (it never blocks); only real action items use warm/red tones.
const STYLES = {
  pass: { label: "Pass", icon: "ph:check-circle-fill", card: "border-emerald-100 bg-emerald-50/40", text: "text-emerald-700", hint: "" },
  information: { label: "Information", icon: "ph:info-bold", card: "border-ink-100 bg-ink-50/60", text: "text-blue-600", hint: "Good to know — this doesn't block generation." },
  warning: { label: "Action required", icon: "ph:warning-bold", card: "border-amber-200 bg-amber-50/50", text: "text-amber-700", hint: "Confirm you've reviewed this to continue." },
  critical: { label: "Action required", icon: "ph:warning-octagon-fill", card: "border-red-200 bg-red-50/50", text: "text-red-700", hint: "Fix this before generating." },
};
const style = computed(() => STYLES[props.item.severity] || STYLES.information);
</script>
