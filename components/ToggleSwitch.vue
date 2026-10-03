<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200"
    :class="modelValue ? 'bg-ink-900' : 'bg-ink-200'"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
      :class="modelValue ? 'translate-x-[22px]' : 'translate-x-0.5'"
    />
  </button>
</template>

<script setup>
defineProps({ modelValue: { type: Boolean, default: false } });
defineEmits(["update:modelValue"]);
</script>
