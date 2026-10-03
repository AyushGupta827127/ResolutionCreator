<template>
  <footer class="border-t border-ink-100 bg-white">
    <div class="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-6 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-14">
      <div class="flex items-center gap-3">
        <img src="/brand/logo.png" alt="" class="h-7 w-7 object-contain" />
        <div>
          <p class="text-sm font-semibold text-ink-950">Resolution Creator</p>
          <p class="text-xs text-ink-500">Guided drafting for Indian corporate resolutions.</p>
        </div>
      </div>
      <nav class="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-ink-600" aria-label="Footer">
        <NuxtLink to="/library" class="hover:text-ink-950">Library</NuxtLink>
        <NuxtLink to="/dashboard" class="hover:text-ink-950">My Resolutions</NuxtLink>
        <NuxtLink to="/#how-it-works" class="hover:text-ink-950">Help</NuxtLink>
        <a href="#" class="hover:text-ink-950">Terms</a>
        <a href="#" class="hover:text-ink-950">Privacy</a>
      </nav>
      <p class="max-w-sm text-xs leading-relaxed text-ink-400">
        Generated documents are starting points for professional review and should be checked before use.
      </p>
    </div>
  </footer>
</template>
