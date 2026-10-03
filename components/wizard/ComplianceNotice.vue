<template>
  <div class="space-y-3">
    <div
      v-for="item in results"
      :key="item.ruleId"
      class="rounded-xl border p-4 transition-shadow hover:shadow-sm"
      :class="borderClass(item.severity)"
    >
      <div class="flex flex-wrap items-center gap-2">
        <Icon :name="severityIcon(item.severity)" class="h-4 w-4" :class="iconClass(item.severity)" />
        <span class="badge" :class="`badge-${item.severity}`">{{ item.severity }}</span>
        <span class="text-sm font-semibold text-ink-800">{{ item.title }}</span>
        <span class="text-xs text-ink-400">{{ item.section }}</span>
      </div>
      <p class="mt-2 text-sm text-ink-600">{{ item.message }}</p>
      <p class="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-ink-700">
        <Icon name="ph:arrow-bend-down-right-bold" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
        {{ item.recommendation }}
      </p>
    </div>

    <p v-if="narration" class="flex items-start gap-2 rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
      <Icon name="ph:sparkle-bold" class="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
      {{ narration }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  results: { type: Array, required: true },
  narration: { type: String, default: "" },
});

const borderClass = (severity) =>
  ({
    critical: "border-red-200 bg-red-50/50",
    warning: "border-orange-200 bg-orange-50/40",
    information: "border-ink-100 bg-white",
  })[severity] || "border-ink-100";

const severityIcon = (severity) =>
  ({
    critical: "ph:x-circle-fill",
    warning: "ph:warning-fill",
    information: "ph:info-fill",
  })[severity] || "ph:info-fill";

const iconClass = (severity) =>
  ({
    critical: "text-red-500",
    warning: "text-orange-500",
    information: "text-ink-400",
  })[severity] || "text-ink-400";
</script>
