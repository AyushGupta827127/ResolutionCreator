<template>
  <section class="relative overflow-hidden border-b border-ink-100 bg-gradient-to-br from-white via-[#F4F7FF] to-[#FFF6EE]">
    <div class="mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-10 sm:px-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-6 lg:px-14 lg:py-12">
      <div>
        <span class="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-card">
          <Icon name="ph:sparkle-fill" class="h-3.5 w-3.5 text-orange-500" /> AI-powered corporate resolutions
        </span>
        <h1 class="mt-5 max-w-[680px] font-sans text-[2.4rem] font-bold leading-[1.1] tracking-tight text-ink-950 sm:text-5xl lg:text-[3.25rem]">
          Create compliant corporate resolutions,
          <span class="text-orange-500">without the complexity.</span>
        </h1>
        <p class="mt-5 max-w-[560px] text-[17px] leading-relaxed text-ink-500">
          Choose a template, answer a few guided questions, and let AI draft a professional, compliant resolution for you.
        </p>
        <div class="mt-7 flex flex-wrap gap-3">
          <NuxtLink to="/create" class="btn-accent !px-7 !py-3.5 !text-base shadow-[0_8px_20px_-8px_rgba(249,115,22,0.6)]">
            Create a resolution <Icon name="ph:arrow-right-bold" class="h-4 w-4" />
          </NuxtLink>
          <NuxtLink to="/library" class="btn-secondary !px-7 !py-3.5 !text-base">Browse library</NuxtLink>
        </div>
        <HomeFeatureHighlights />
      </div>

      <HomeHeroTemplatePreview :docs="docs" />
    </div>
  </section>
</template>

<script setup>
defineProps({ docs: { type: Array, default: () => [] } });
</script>
