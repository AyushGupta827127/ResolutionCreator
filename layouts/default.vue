<template>
  <div class="flex min-h-screen flex-col bg-[#FAFBFF]">
    <LayoutResolutionHeader @sign-in="showAuth = true" @logout="handleLogout" />

    <main class="flex-1">
      <slot />
    </main>

    <LayoutAppFooter />

    <Transition name="fade">
      <UtilAuthModal v-if="showAuth" @close="showAuth = false" />
    </Transition>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";

const { signOutUser } = useAuth();
const showAuth = ref(false);

const handleLogout = async () => {
  await signOutUser();
  navigateTo("/");
};
</script>
