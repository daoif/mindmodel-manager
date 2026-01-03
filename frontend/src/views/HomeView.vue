<template>
  <div>
    <FilterBar />

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">
        {{ currentFilterDescription }}
        <span class="text-sm font-normal text-gray-500 ml-2">
           {{ filteredModels.length }}/{{ baseModelsCount }} 个模型
        </span>
      </h2>
      <div class="flex space-x-2">
         <div class="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
            <button
                @click="viewMode = 'card'"
                :class="['px-2 py-1 rounded-md text-sm font-medium transition-colors', viewMode === 'card' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700']"
            >
                🔲 卡片
            </button>
            <button
                @click="viewMode = 'list'"
                :class="['px-2 py-1 rounded-md text-sm font-medium transition-colors', viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700']"
            >
                ≡ 列表
            </button>
         </div>

          <button
            v-if="!store.currentFilter"
            @click="openNewModelModal"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            新建模型
          </button>
      </div>
    </div>

    <ModelEditModal v-model="showEditModal" :model-id="editingModelId" @saved="onModelSaved" />

    <div v-if="store.loading" class="text-center py-10">
      <p class="text-gray-500">加载中...</p>
    </div>

    <div v-else-if="filteredModels.length === 0" class="text-center py-10 bg-white rounded-lg shadow">
      <p class="text-gray-500">没有找到相关模型</p>
    </div>

    <template v-else>
        <div v-if="viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', getTagColor(dim)]"
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

        <ModelList
            v-else
            :models="filteredModels"
            @edit-model="openEditModel"
            @refresh="store.fetchModels"
        />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useMainStore } from '../stores';
import FilterBar from '../components/FilterBar.vue';
import ModelEditModal from '../components/ModelEditModal.vue';
import ModelList from '../components/ModelList.vue';

const store = useMainStore();
const showEditModal = ref(false);
const editingModelId = ref<string | null>(null);
const viewMode = ref<'card' | 'list'>('card');

// Default view settings
// "All" page -> List, Others -> Card
watch(() => store.currentFilter, (filter) => {
    if (!filter) {
        viewMode.value = 'list';
    } else {
        viewMode.value = 'card';
    }
}, { immediate: true });

const openNewModelModal = () => {
    editingModelId.value = null;
    showEditModal.value = true;
};

const openEditModel = (id: string) => {
    editingModelId.value = id;
    showEditModal.value = true;
};

const onModelSaved = () => {
    // Model saved, store already updated
};

const currentFilterDescription = computed(() => {
  if (!store.currentFilter || store.currentFilter.length === 0) return '全部模型';
  return store.currentFilter.map(f => `${f.dimension}: ${f.value}`).join(' > ');
});

// Models filtered by base filter (navigation tree)
const baseModels = computed(() => {
  if (!store.currentFilter || store.currentFilter.length === 0) return store.models;

  return store.models.filter(m => {
      // Must match ALL rules in the array (AND)
      if (!store.currentFilter) return true;
      return store.currentFilter.every(rule => {
          return m.tags[rule.dimension]?.includes(rule.value);
      });
  });
});

const baseModelsCount = computed(() => baseModels.value.length);

// Models filtered by base + additional filters + keyword
const filteredModels = computed(() => {
  let models = baseModels.value;

  // Keyword search
  if (store.keyword) {
    const k = store.keyword.toLowerCase();
    models = models.filter(m =>
      m.name.toLowerCase().includes(k) ||
      m.description.toLowerCase().includes(k)
    );
  }

  // Additional filters
  // "Multiple dimensions between AND relationship, same dimension within OR relationship"
  for (const [dim, tags] of Object.entries(store.additionalFilters)) {
      if (tags.length > 0) {
          models = models.filter(m => {
              // m.tags[dim] must contain at least one of the tags in 'tags'
              // (OR relationship within dimension)
              if (!m.tags[dim]) return false;
              return tags.some(t => m.tags[dim].includes(t));
          });
      }
  }

  return models;
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const getTagColor = (dimName: string) => {
    const dim = store.dimensions.find(d => d.name === dimName);
    return dim?.color || 'bg-gray-100 text-gray-800';
};
</script>
