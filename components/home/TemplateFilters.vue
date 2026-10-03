<template>
  <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div class="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 xl:flex-nowrap xl:gap-1.5" role="tablist" aria-label="Template categories">
      <button
        v-for="f in filters"
        :key="f.value"
        type="button"
        role="tab"
        :aria-selected="modelValue === f.value"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors duration-150"
        :class="
          modelValue === f.value
            ? 'border-blue-200 bg-blue-50 text-ink-950 ring-1 ring-inset ring-blue-100'
            : 'border-ink-100 bg-white text-ink-600 hover:border-ink-200 hover:text-ink-900'
        "
        @click="$emit('update:modelValue', f.value)"
      >
        <Icon :name="f.icon" class="h-4 w-4" :class="modelValue === f.value ? 'text-blue-600' : 'text-ink-400'" />
        {{ f.label }}
      </button>
    </div>

    <div class="flex gap-3">
      <label class="flex min-w-0 flex-1 items-center rounded-xl border border-ink-100 bg-white transition-shadow duration-150 focus-within:border-ink-300 focus-within:ring-2 focus-within:ring-orange-200 lg:w-[210px] lg:flex-none">
        <Icon name="ph:magnifying-glass-bold" class="ml-3 h-4 w-4 shrink-0 text-ink-400" />
        <input
          :value="query"
          type="search"
          aria-label="Search templates"
          placeholder="Search templates…"
          class="w-full bg-transparent px-2.5 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
          @input="$emit('update:query', $event.target.value)"
        />
      </label>
      <label class="relative">
        <span class="sr-only">Sort templates</span>
        <Icon name="ph:sliders-horizontal-bold" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <select
          :value="sort"
          class="h-full appearance-none rounded-xl border border-ink-100 bg-white py-2.5 pl-9 pr-9 text-[13px] font-medium text-ink-800 hover:border-ink-200 focus:border-ink-300"
          @change="$emit('update:sort', $event.target.value)"
        >
          <option v-for="o in sortOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
        <Icon name="ph:caret-down-bold" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-400" />
      </label>
    </div>
  </div>
</template>

<script setup>
import { TEMPLATE_FILTERS as filters, SORT_OPTIONS as sortOptions } from "@/composables/useTemplateCatalog";

defineProps({
  modelValue: { type: String, default: "all" },
  query: { type: String, default: "" },
  sort: { type: String, default: "popular" },
});
defineEmits(["update:modelValue", "update:query", "update:sort"]);
</script>
