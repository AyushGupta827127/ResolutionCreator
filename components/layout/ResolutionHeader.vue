<template>
  <header class="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
    <div class="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-10 lg:px-14">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="flex items-center gap-2.5" aria-label="Resolution Creator home">
          <img src="/brand/logo.png" alt="" class="h-8 w-8 object-contain" />
          <span class="text-[17px] font-bold tracking-tight text-ink-950">Resolution Creator</span>
        </NuxtLink>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[14px] font-medium transition-colors"
            :class="isActive(item.to) ? 'bg-orange-50 text-ink-950' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'"
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            <Icon :name="item.icon" class="h-4 w-4" :class="isActive(item.to) ? 'text-orange-500' : 'text-ink-400'" />
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>

      <div class="flex items-center gap-2.5">
        <NuxtLink to="/create" class="btn-accent !rounded-xl !px-4 !py-2.5 text-[14px]">
          <Icon name="ph:plus-bold" class="h-4 w-4" /> <span class="hidden sm:inline">Create New</span><span class="sm:hidden">Create</span>
        </NuxtLink>

        <NuxtLink
          v-if="user"
          to="/dashboard"
          class="hidden items-center gap-2 rounded-xl border border-ink-100 px-3.5 py-2.5 text-[13px] font-medium text-ink-700 hover:border-ink-200 lg:flex"
        >
          <Icon name="ph:coins-bold" class="h-4 w-4 text-orange-500" /> {{ profile.credits }} credits
        </NuxtLink>
        <NuxtLink to="/#how-it-works" class="hidden items-center gap-2 rounded-xl border border-ink-100 px-3.5 py-2.5 text-[13px] font-medium text-ink-700 hover:border-ink-200 lg:flex">
          <Icon name="ph:question-bold" class="h-4 w-4 text-ink-500" /> Help
        </NuxtLink>

        <div v-if="user" class="relative hidden md:block">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-xl border border-ink-100 py-1.5 pl-1.5 pr-2.5 hover:border-ink-200"
            aria-label="Account menu"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-ink-950 text-xs font-semibold text-white">{{ initial }}</span>
            <Icon name="ph:caret-down-bold" class="h-3 w-3 text-ink-400" />
          </button>
          <Transition name="fade">
            <div v-if="menuOpen" class="absolute right-0 top-full mt-2 w-48 rounded-xl border border-ink-100 bg-white py-1 shadow-card-hover" @click="menuOpen = false">
              <p class="truncate px-3.5 py-2 text-xs text-ink-400">{{ profile.email }}</p>
              <NuxtLink to="/dashboard" class="block px-3.5 py-2 text-sm text-ink-700 hover:bg-ink-50">My Resolutions</NuxtLink>
              <button type="button" class="block w-full px-3.5 py-2 text-left text-sm text-ink-700 hover:bg-ink-50" @click="$emit('logout')">Log out</button>
            </div>
          </Transition>
        </div>
        <button v-else type="button" class="btn-primary !rounded-xl hidden md:inline-flex" @click="$emit('sign-in')">Sign in</button>

        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-100 text-ink-700 md:hidden"
          aria-label="Menu"
          :aria-expanded="mobileOpen"
          @click="mobileOpen = !mobileOpen"
        >
          <Icon :key="mobileOpen ? 'x' : 'list'" :name="mobileOpen ? 'ph:x-bold' : 'ph:list-bold'" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- mobile menu: Home, Library, My Resolutions, Help, Credits, Profile -->
    <nav v-if="mobileOpen" class="border-t border-ink-100 bg-white px-5 py-3 md:hidden" aria-label="Mobile" @click="mobileOpen = false">
      <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" class="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink-800 hover:bg-ink-50">
        <Icon :name="item.icon" class="h-[18px] w-[18px] text-ink-400" /> {{ item.label }}
      </NuxtLink>
      <NuxtLink to="/#how-it-works" class="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-ink-800 hover:bg-ink-50">
        <Icon name="ph:question-bold" class="h-[18px] w-[18px] text-ink-400" /> Help
      </NuxtLink>
      <template v-if="user">
        <p class="flex items-center gap-3 px-3 py-3 text-[15px] font-medium text-ink-800">
          <Icon name="ph:coins-bold" class="h-[18px] w-[18px] text-orange-500" /> {{ profile.credits }} credits
        </p>
        <button type="button" class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-ink-800 hover:bg-ink-50" @click="$emit('logout')">
          <Icon name="ph:user-circle-bold" class="h-[18px] w-[18px] text-ink-400" /> Log out ({{ profile.email }})
        </button>
      </template>
      <button v-else type="button" class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-medium text-ink-800 hover:bg-ink-50" @click="$emit('sign-in')">
        <Icon name="ph:user-circle-bold" class="h-[18px] w-[18px] text-ink-400" /> Sign in
      </button>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAuth } from "@/composables/useAuth";
import { useProfileStore } from "@/stores/useProfileStore";

defineEmits(["sign-in", "logout"]);

const { user } = useAuth();
const { profile } = storeToRefs(useProfileStore());
const route = useRoute();
const menuOpen = ref(false);
const mobileOpen = ref(false);

const navItems = computed(() => [
  { to: "/", label: "Home", icon: "ph:house-bold" },
  { to: "/library", label: "Library", icon: "ph:books-bold" },
  ...(user.value ? [{ to: "/dashboard", label: "My Resolutions", icon: "ph:clock-counter-clockwise-bold" }] : []),
]);

const initial = computed(() => (profile.value.name || profile.value.email || "?").charAt(0).toUpperCase());
const isActive = (path) => (path === "/" ? route.path === "/" : route.path.startsWith(path));

watch(() => route.fullPath, () => {
  menuOpen.value = false;
  mobileOpen.value = false;
});
</script>
