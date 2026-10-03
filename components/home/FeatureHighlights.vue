<template>
  <ul class="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
    <li v-for="f in features" :key="f.title" class="flex items-center gap-3">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="f.tint">
        <Icon :name="f.icon" class="h-5 w-5" />
      </span>
      <span class="text-[13px] leading-snug text-ink-600">
        <span class="block font-medium text-ink-800">{{ f.title }}</span>{{ f.sub }}
      </span>
    </li>
  </ul>
</template>

<script setup>
const features = [
  { icon: "ph:file-text-bold", title: "Legally relevant", sub: "templates", tint: "bg-blue-50 text-blue-600" },
  { icon: "ph:sparkle-bold", title: "AI-assisted", sub: "data entry", tint: "bg-violet-50 text-violet-600" },
  { icon: "ph:shield-check-bold", title: "Compliance", sub: "review", tint: "bg-emerald-50 text-emerald-600" },
  { icon: "ph:file-arrow-down-bold", title: "PDF & Word", sub: "export", tint: "bg-blue-50 text-blue-600" },
];
</script>
