<template>
  <div class="bg-white rounded-lg shadow mb-6 overflow-hidden transition-all duration-300">
    <div class="p-4 border-b border-gray-100 flex items-center">
      <div class="relative flex-grow max-w-lg">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </div>
        <input
          v-model="store.keyword"
          type="text"
          class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="搜索模型名称..."
        />
      </div>

      <div v-if="store.currentFilter" class="ml-4">
        <button
            @click="isExpanded = !isExpanded"
            class="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
             <span v-if="isExpanded">▲</span>
             <span v-else>▼</span>
        </button>
      </div>
    </div>

    <div v-if="isExpanded || !store.currentFilter" class="p-4 bg-gray-50">
      <div v-for="dim in store.dimensions" :key="dim.name" class="flex mb-2 last:mb-0">
        <div class="w-16 flex-shrink-0 text-sm font-medium text-gray-700 pt-1">
          {{ dim.name }}:
        </div>
        <div class="flex-grow flex flex-wrap gap-2">
            <!-- Iterate over all unique tags for this dimension across all models -->
            <!-- But to be efficient and show only relevant tags, we might want to compute available tags.
                 For MVP enhancement, listing all known tags or tags present in current subset is fine.
                 Let's list all unique tags found in store.models for this dimension. -->
            <button
                v-for="tag in getUniqueTags(dim.name)"
                :key="tag"
                @click="toggleFilter(dim.name, tag)"
                :disabled="isLocked(dim.name, tag)"
                :class="[
                    'px-2 py-1 text-xs rounded border transition-colors duration-200',
                    isLocked(dim.name, tag)
                        ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed'
                        : isSelected(dim.name, tag)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                ]"
            >
                {{ tag }}
                <span v-if="isLocked(dim.name, tag)" class="ml-1 text-[10px] text-gray-400">🔒</span>
            </button>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
          <div class="flex flex-wrap gap-2 items-center">
              <span class="text-gray-500">已选:</span>
              <template v-for="(tags, dim) in store.additionalFilters" :key="dim">
                  <span v-for="tag in tags" :key="tag" class="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded flex items-center">
                      {{ dim }}:{{ tag }}
                      <button @click="store.setAdditionalFilter(dim, tag)" class="ml-1 text-indigo-500 hover:text-indigo-700">×</button>
                  </span>
              </template>
          </div>
          <button @click="store.clearAdditionalFilters" class="text-indigo-600 hover:text-indigo-900">清除全部</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMainStore } from '../stores';

const store = useMainStore();
const isExpanded = ref(true);

// Collapse by default if there is a base filter (currentFilter is set)
watch(() => store.currentFilter, (newVal) => {
    if (newVal) {
        isExpanded.value = false;
    } else {
        isExpanded.value = true;
    }
}, { immediate: true });

const getUniqueTags = (dimension: string) => {
    const tags = new Set<string>();
    store.models.forEach(m => {
        if (m.tags && m.tags[dimension]) {
            m.tags[dimension].forEach(t => tags.add(t));
        }
    });
    return Array.from(tags).sort();
};

const isSelected = (dimension: string, tag: string) => {
    // Check if it's locked (base filter)
    if (isLocked(dimension, tag)) return true;
    // Check additional filters
    return store.additionalFilters[dimension]?.includes(tag);
};

const isLocked = (dimension: string, tag: string) => {
    if (!store.currentFilter) return false;
    // Check if this specific tag is in the base filter
    return store.currentFilter.some(f => f.dimension === dimension && f.value === tag);
};

const toggleFilter = (dimension: string, tag: string) => {
    if (isLocked(dimension, tag)) return;
    store.setAdditionalFilter(dimension, tag);
};

const hasActiveFilters = computed(() => {
    return Object.keys(store.additionalFilters).length > 0;
});
</script>
