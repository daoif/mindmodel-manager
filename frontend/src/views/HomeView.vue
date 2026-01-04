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
         <!-- Sort Dropdown -->
         <div class="relative inline-block text-left mr-2">
            <div>
              <button @click="showSortMenu = !showSortMenu" type="button" class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" id="menu-button" aria-expanded="true" aria-haspopup="true">
                {{ sortOptions.find(o => o.value === sortOption)?.label || '排序' }}
                <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <div v-if="showSortMenu" class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
              <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabindex="-1">
                <a
                    v-for="opt in sortOptions"
                    :key="opt.value"
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    :class="{'bg-gray-100 font-semibold': sortOption === opt.value}"
                    role="menuitem"
                    @click.prevent="sortOption = opt.value; showSortMenu = false"
                >
                    {{ opt.label }}
                </a>
              </div>
            </div>
         </div>
         <!-- Overlay to close menu on click outside -->
         <div v-if="showSortMenu" class="fixed inset-0 z-10" @click="showSortMenu = false"></div>

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
            v-if="!store.currentFilter || store.currentFilter.length === 0"
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
            @click="openEditModal(model)"
          >
            <div class="p-5 flex-1">
              <div class="flex justify-between items-start mb-2">
                <h3 class="text-lg font-semibold text-gray-900 line-clamp-1" :title="model.name">{{ model.name }}</h3>
              </div>
              
              <div v-if="store.copyButtonPosition === 'content'" class="flex gap-1 overflow-x-auto no-scrollbar mb-2">
                 <button
                    v-for="dtype in visibleDocTypes"
                    :key="dtype.name"
                    @click.stop="copyDocContent(model.id, dtype.name)"
                    class="px-2 py-0.5 rounded border bg-white border-gray-200 text-gray-500 text-xs hover:bg-gray-50 transition-colors whitespace-nowrap"
                    :class="{'!text-green-600 !border-green-200 !bg-green-50': copyStatus[`${model.id}_${dtype.name}`] === 'success'}"
                 >
                    {{ copyStatus[`${model.id}_${dtype.name}`] === 'success' ? '已复制' : (copyStatus[`${model.id}_${dtype.name}`] === 'loading' ? '...' : (dtype.short_name || dtype.name)) }}
                 </button>
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
            <div class="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs">
              <div v-if="store.copyButtonPosition === 'footer'" class="flex gap-1 overflow-x-auto no-scrollbar mr-2">
                 <button
                    v-for="dtype in visibleDocTypes"
                    :key="dtype.name"
                    @click.stop="copyDocContent(model.id, dtype.name)"
                    class="px-2 py-1 rounded border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                    :class="{'!text-green-600 !border-green-200 !bg-green-50': copyStatus[`${model.id}_${dtype.name}`] === 'success'}"
                 >
                    {{ copyStatus[`${model.id}_${dtype.name}`] === 'success' ? '已复制' : (copyStatus[`${model.id}_${dtype.name}`] === 'loading' ? '...' : (dtype.short_name || dtype.name)) }}
                 </button>
              </div>
              <div class="flex space-x-2 flex-shrink-0">
                  <button @click.stop="openEditModal(model)" class="text-indigo-600 hover:text-indigo-900 font-medium">编辑</button>
                  <button @click.stop="deleteModel(model)" class="text-red-600 hover:text-red-900">删除</button>
              </div>
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
import { ref, computed, watch, reactive } from 'vue';
import { useMainStore } from '../stores';
import FilterBar from '../components/FilterBar.vue';
import ModelEditModal from '../components/ModelEditModal.vue';
import ModelList from '../components/ModelList.vue';
import type { MindModel } from '../types';
import { modelApi } from '../api';

const store = useMainStore();
const showEditModal = ref(false);
const editingModelId = ref<string | null>(null);
const viewMode = ref<'card' | 'list'>('card');

const sortOption = ref('updated_desc');
const showSortMenu = ref(false);

const sortOptions = [
    { label: '最新更新 (降序)', value: 'updated_desc' },
    { label: '最新更新 (升序)', value: 'updated_asc' },
    { label: '名称 (A-Z)', value: 'name_asc' },
    { label: '名称 (Z-A)', value: 'name_desc' },
    { label: '类别 (正序)', value: 'category_asc' },
    { label: '类别 (倒序)', value: 'category_desc' },
];

const getSortKey = (filter: any) => {
    if (!filter || filter.length === 0) return 'sort_pref_all';
    const parts = filter.map((f: any) => `${f.dimension}_${f.value}`);
    return `sort_pref_${parts.join('_')}`;
};

const getViewModeKey = (filter: any) => {
    if (!filter || filter.length === 0) return 'view_pref_all';
    const parts = filter.map((f: any) => `${f.dimension}_${f.value}`);
    return `view_pref_${parts.join('_')}`;
};

// Restore settings
watch(() => store.currentFilter, (filter) => {
    // View Mode
    const viewKey = getViewModeKey(filter);
    const savedView = localStorage.getItem(viewKey);
    if (savedView === 'card' || savedView === 'list') {
        viewMode.value = savedView;
    } else {
        viewMode.value = (!filter || filter.length === 0) ? 'list' : 'card';
    }

    // Sort Option
    const sortKey = getSortKey(filter);
    const savedSort = localStorage.getItem(sortKey);
    if (savedSort && sortOptions.some(o => o.value === savedSort)) {
        sortOption.value = savedSort;
    } else {
        sortOption.value = 'updated_desc';
    }
}, { immediate: true });

// Save settings
watch(viewMode, (newVal) => {
    const key = getViewModeKey(store.currentFilter);
    localStorage.setItem(key, newVal);
});

watch(sortOption, (newVal) => {
    const key = getSortKey(store.currentFilter);
    localStorage.setItem(key, newVal);
});

const openNewModelModal = () => {
    editingModelId.value = null;
    showEditModal.value = true;
};

const openEditModal = (model: MindModel | {id: string}) => {
    editingModelId.value = model.id;
    showEditModal.value = true;
};
// Compatible alias if needed, but we updated template to use openEditModal
const openEditModel = (model: MindModel) => openEditModal(model);


const deleteModel = async (model: MindModel) => {
    if (!confirm(`确定要删除 "${model.name}" 吗?`)) return;
    try {
        await modelApi.delete(model.id);
        await store.fetchModels();
    } catch (e) {
        console.error(e);
    }
};

const onModelSaved = () => {
    // Model saved
};

const currentFilterDescription = computed(() => {
  if (!store.currentFilter || store.currentFilter.length === 0) return '全部模型';
  return store.currentFilter.map(f => {
      if (f.value === '*') return f.dimension;
      return `${f.dimension}: ${f.value}`;
  }).join(' > ');
});

const baseModels = computed(() => {
  if (!store.currentFilter || store.currentFilter.length === 0) return store.models;

  return store.models.filter(m => {
      if (!store.currentFilter) return true;
      return store.currentFilter.every(rule => {
          if (rule.value === '*') {
              return m.tags[rule.dimension] && m.tags[rule.dimension].length > 0;
          }
          return m.tags[rule.dimension]?.includes(rule.value);
      });
  });
});

const baseModelsCount = computed(() => baseModels.value.length);

const getCategorySortValue = (model: MindModel) => {
    for (const dim of store.dimensions) {
        if (model.tags && model.tags[dim.name] && model.tags[dim.name].length > 0) {
             return model.tags[dim.name][0];
        }
    }
    return '';
};

const filteredModels = computed(() => {
  let models = baseModels.value;

  if (store.keyword) {
    const k = store.keyword.toLowerCase();
    models = models.filter(m =>
      m.name.toLowerCase().includes(k) ||
      m.description.toLowerCase().includes(k)
    );
  }

  for (const [dim, tags] of Object.entries(store.additionalFilters)) {
      if (tags.length > 0) {
          models = models.filter(m => {
              if (!m.tags[dim]) return false;
              return tags.some(t => m.tags[dim].includes(t));
          });
      }
  }

  // Sorting
  return [...models].sort((a, b) => {
      const [field, direction] = sortOption.value.split('_');
      const isAsc = direction === 'asc';
      
      let valA: any = '';
      let valB: any = '';

      if (field === 'updated') {
          valA = new Date(a.updated_at).getTime();
          valB = new Date(b.updated_at).getTime();
      } else if (field === 'name') {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
      } else if (field === 'category') {
          valA = getCategorySortValue(a);
          valB = getCategorySortValue(b);
      }

      if (valA < valB) return isAsc ? -1 : 1;
      if (valA > valB) return isAsc ? 1 : -1;
      return 0;
  });
});

const getTagColor = (dimName: string) => {
    const dim = store.dimensions.find(d => d.name === dimName);
    return dim?.color || 'bg-gray-100 text-gray-800';
};

const visibleDocTypes = computed(() => store.docTypes.filter(t => t.show_in_copy !== 0 && t.show_in_copy !== false));

const copyStatus = reactive<Record<string, 'loading' | 'success' | 'error' | 'idle'>>({});

const copyDocContent = async (modelId: string, docType: string) => {
    const key = `${modelId}_${docType}`;
    if (copyStatus[key] === 'loading') return;

    copyStatus[key] = 'loading';
    try {
        const content = await modelApi.getDocContent(modelId, docType);
        if (content) {
            await navigator.clipboard.writeText(content);
            copyStatus[key] = 'success';
        } else {
             // Handle empty? Just show success (copied empty string) or error?
             // Let's assume empty is valid but inform user?
             // Or write empty string.
             await navigator.clipboard.writeText('');
             copyStatus[key] = 'success';
        }
    } catch (e) {
        console.error('Copy failed', e);
        copyStatus[key] = 'error';
    } finally {
        setTimeout(() => {
            copyStatus[key] = 'idle'; // Reset after 2s
        }, 2000);
    }
};
</script>
