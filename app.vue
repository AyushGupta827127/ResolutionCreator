<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuth } from "@/composables/useAuth";

useHead({
  titleTemplate: (title) => (title ? `${title} · Resolution Creator` : "Resolution Creator"),
});

const { monitorAuthState } = useAuth();
onMounted(() => monitorAuthState());
</script>
