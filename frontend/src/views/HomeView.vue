<template>
  <div>
    <h2 class="text-2xl font-bold mb-6 text-gray-800">
      {{ currentFilterDescription }}
    </h2>

    <div v-if="store.loading" class="text-center py-10">
      <p class="text-gray-500">加载中...</p>
    </div>

    <div v-else-if="filteredModels.length === 0" class="text-center py-10 bg-white rounded-lg shadow">
      <p class="text-gray-500">没有找到相关模型</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="model in filteredModels"
        :key="model.id"
        class="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col"
        @click="$router.push(`/model/${model.id}`)"
      >
        <div class="p-5 flex-1">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-semibold text-gray-900 line-clamp-1" :title="model.name">{{ model.name }}</h3>
          </div>
          <p class="text-gray-500 text-sm mb-4 line-clamp-3">{{ model.description }}</p>

          <div class="flex flex-wrap gap-2 mt-auto">
            <template v-for="(values, dim) in model.tags" :key="dim">
              <span
                v-for="val in values"
                :key="val"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {{ val }}
              </span>
            </template>
          </div>
        </div>
        <div class="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>更新于: {{ formatDate(model.updated_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMainStore } from '../stores';

const store = useMainStore();

const currentFilterDescription = computed(() => {
  if (!store.currentFilter) return '全部模型';
  return `${store.currentFilter.dimension}: ${store.currentFilter.value}`;
});

const filteredModels = computed(() => {
  if (!store.currentFilter) return store.models;

  const { dimension, value } = store.currentFilter;
  return store.models.filter(m => {
    return m.tags[dimension]?.includes(value);
  });
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};
</script>
