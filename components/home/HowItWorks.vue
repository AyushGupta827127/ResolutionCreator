<template>
  <section class="rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:p-8" aria-labelledby="how-title">
    <div class="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
      <div>
        <h2 id="how-title" class="font-sans text-[26px] font-bold text-ink-950">How it works</h2>
        <p class="mt-1.5 text-sm text-ink-500">From template to final document in a few simple steps.</p>
      </div>
      <ol class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="(s, i) in steps" :key="s.title" class="relative flex items-start gap-3">
          <span class="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" :class="s.tint">
            <Icon :name="s.icon" class="h-6 w-6" />
            <span class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" :class="s.dot">{{ i + 1 }}</span>
          </span>
          <div>
            <p class="text-[14px] font-semibold text-ink-950">{{ s.title }}</p>
            <p class="mt-0.5 text-[13px] leading-snug text-ink-500">{{ s.body }}</p>
          </div>
          <Icon v-if="i < steps.length - 1" name="ph:arrow-right-bold" class="absolute -right-3.5 top-4 hidden h-4 w-4 text-ink-300 lg:block" />
        </li>
      </ol>
    </div>
  </section>
</template>

<script setup>
const steps = [
  { icon: "ph:file-text-bold", title: "Choose a template", body: "Pick from professionally structured templates.", tint: "bg-orange-50 text-orange-500", dot: "bg-orange-500" },
  { icon: "ph:list-checks-bold", title: "Answer key details", body: "Fill only the information relevant to your resolution.", tint: "bg-violet-50 text-violet-600", dot: "bg-violet-500" },
  { icon: "ph:shield-check-bold", title: "Review & edit", body: "Check the AI-assisted draft and compliance notes.", tint: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  { icon: "ph:file-arrow-down-bold", title: "Download & use", body: "Get PDF and Word files ready for your records.", tint: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
];
</script>
