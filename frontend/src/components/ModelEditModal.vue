<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="close"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                {{ isEdit ? '编辑模型' : '新建模型' }}
              </h3>

              <div class="mt-4">
                  <form @submit.prevent="saveModel" class="space-y-6">
                      <!-- Basic Info -->
                      <div>
                        <label for="name" class="block text-sm font-medium text-gray-700">模型名称</label>
                        <div class="mt-1">
                          <input
                            type="text"
                            id="name"
                            v-model="form.name"
                            required
                            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          >
                        </div>
                      </div>

                      <div>
                        <label for="description" class="block text-sm font-medium text-gray-700">描述</label>
                        <div class="mt-1">
                          <textarea
                            id="description"
                            v-model="form.description"
                            rows="2"
                            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                          ></textarea>
                        </div>
                      </div>

                      <!-- Sub Docs (Unified) - Only in Edit Mode -->
                      <div v-if="isEdit" class="border-t border-gray-100 pt-4">
                          <div class="border-b border-gray-200 mb-2">
                              <nav class="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                                <button
                                  v-for="type in store.docTypes"
                                  :key="type.name"
                                  type="button"
                                  @click="currentTab = type.name"
                                  :class="[
                                    currentTab === type.name
                                      ? 'border-indigo-500 text-indigo-600'
                                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                    'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs'
                                  ]"
                                >
                                  {{ type.name }}
                                </button>
                              </nav>
                          </div>
                          <div class="relative">
                              <div v-if="docLoading" class="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
                                  <span class="text-xs text-gray-500">加载中...</span>
                              </div>
                              <textarea
                                v-model="currentDocContent"
                                rows="10"
                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border font-mono"
                                placeholder="在此编辑文档内容 (Markdown)..."
                              ></textarea>
                          </div>
                      </div>

                      <!-- Tags Section -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div v-for="dim in store.dimensions" :key="dim.name" class="bg-gray-50 p-3 rounded-md">
                            <label class="block text-sm font-medium text-gray-900 mb-2">{{ dim.name }}</label>

                            <div class="flex flex-wrap gap-2 mb-2">
                               <span
                                  v-for="(tag, index) in (form.tags[dim.name] || [])"
                                  :key="index"
                                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                  {{ tag }}
                                  <button
                                    type="button"
                                    @click="removeTag(dim.name, index)"
                                    class="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
                                  >
                                    ×
                                  </button>
                                </span>
                            </div>

                            <div class="flex gap-2 relative">
                              <input
                                type="text"
                                v-model="tagInputs[dim.name]"
                                @keydown.enter.prevent="addTag(dim.name)"
                                @focus="openTagDropdown(dim.name, $event)"
                                @blur="handleInputBlur(dim.name)"
                                placeholder="输入新增或选择..."
                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-xs border-gray-300 rounded-md p-1 border"
                              >
                              <!-- Dropdown for available tags -->
                              <div
                                v-if="activeTagDropdown === dim.name"
                                :class="[
                                    'absolute left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto',
                                    dropdownPositions[dim.name] === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                                ]"
                              >
                                  <div
                                    v-for="tag in getAvailableTags(dim.name)"
                                    :key="tag"
                                    @mousedown.prevent="selectTag(dim.name, tag)"
                                    class="px-3 py-2 text-xs text-gray-700 hover:bg-gray-100 cursor-pointer"
                                  >
                                      {{ tag }}
                                  </div>
                                  <div v-if="getAvailableTags(dim.name).length === 0" class="px-3 py-2 text-xs text-gray-400 italic">
                                      无历史标签 (直接输入回车添加)
                                  </div>
                              </div>
                            </div>
                          </div>
                      </div>
                  </form>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            @click="saveModel"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            :disabled="submitting"
          >
            {{ submitting ? '保存中...' : '保存' }}
          </button>
          <button
            type="button"
            @click="close"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useMainStore } from '../stores';
import { modelApi } from '../api';

const props = defineProps<{
  modelValue: boolean;
  modelId?: string | null; // If present, edit mode
}>();

const emit = defineEmits(['update:modelValue', 'saved']);

const store = useMainStore();
const submitting = ref(false);
const isEdit = computed(() => !!props.modelId);

// Basic Info Form
const form = reactive({
  name: '',
  description: '',
  tags: {} as Record<string, string[]>
});
const tagInputs = reactive<Record<string, string>>({});

// Sub-Docs Logic
const currentTab = ref('');
const currentDocContent = ref('');
const docLoading = ref(false);
const docSaving = ref(false);

const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const close = () => {
    isOpen.value = false;
};

const resetForm = () => {
    form.name = '';
    form.description = '';
    form.tags = {};
    store.dimensions.forEach(dim => {
        form.tags[dim.name] = [];
        tagInputs[dim.name] = '';
    });
    // Default tab
    if (store.docTypes.length > 0) {
        currentTab.value = store.docTypes[0].name;
    }
    currentDocContent.value = '';
};

// Load sub-doc content when tab or modelId changes
const loadDocContent = async () => {
    if (!props.modelId || !currentTab.value) {
        currentDocContent.value = '';
        return;
    }
    docLoading.value = true;
    try {
        currentDocContent.value = await modelApi.getDocContent(props.modelId, currentTab.value);
    } catch (e) {
        console.error("Failed to load doc", e);
        currentDocContent.value = ''; // or keep prev?
    } finally {
        docLoading.value = false;
    }
};

watch(() => currentTab.value, () => {
    if (isOpen.value && isEdit.value) {
        loadDocContent();
    }
});

watch(() => props.modelValue, async (val) => {
    if (val) {
        resetForm();
        if (isEdit.value && props.modelId) {
            try {
                // Fetch model details
                let model = store.models.find(m => m.id === props.modelId);
                if (!model) {
                   model = await modelApi.get(props.modelId);
                }

                if (model) {
                    form.name = model.name;
                    form.description = model.description;
                    // Deep copy tags
                    store.dimensions.forEach(dim => {
                        form.tags[dim.name] = model.tags[dim.name] ? [...model.tags[dim.name]] : [];
                    });
                }
                
                // Load Sub-doc for initial tab
                await loadDocContent();

            } catch (e) {
                console.error("Error loading model", e);
            }
        }
    }
});

const dropdownPositions = reactive<Record<string, 'bottom' | 'top'>>({});

const activeTagDropdown = ref<string | null>(null);

const addTag = (dimension: string) => {
  const val = tagInputs[dimension]?.trim();
  if (val && !form.tags[dimension].includes(val)) {
    form.tags[dimension].push(val);
    tagInputs[dimension] = '';
  }
};

const openTagDropdown = (dimension: string, event: FocusEvent) => {
    activeTagDropdown.value = dimension;
    // Check position
    const target = event.target as HTMLElement;
    if (target) {
        const rect = target.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 200px space below, flip up
        dropdownPositions[dimension] = spaceBelow < 200 ? 'top' : 'bottom';
    } else {
        dropdownPositions[dimension] = 'bottom';
    }
};

// Use mousedown on options to prevent blur from firing before click
const selectTag = (dimension: string, tag: string) => {
    if (!form.tags[dimension].includes(tag)) {
        form.tags[dimension].push(tag);
    }
    tagInputs[dimension] = '';
    activeTagDropdown.value = null;
};

const getAvailableTags = (dimension: string) => {
    const tags = new Set<string>();
    store.models.forEach(m => {
        if (m.tags && m.tags[dimension]) {
           m.tags[dimension].forEach(t => tags.add(t));
        }
    });
    // Filter out already selected
    const selected = form.tags[dimension] || [];
    // Filter by current input? (Optional, let's keep it simple 'Show All' or 'Filter')
    // Requirement is "Dropdowns". Usually means "Select from valid options".
    // Let's implement filtering if input has text.
    const input = tagInputs[dimension]?.toLowerCase() || '';
    
    return Array.from(tags)
        .filter(t => !selected.includes(t)) // Don't show already selected
        .filter(t => t.toLowerCase().includes(input)) // Filter by input
        .sort();
};

const handleInputBlur = (dimension: string) => {
    // Small delay to allow click to register
    setTimeout(() => {
        if (activeTagDropdown.value === dimension) {
            activeTagDropdown.value = null;
        }
    }, 200);
};

const removeTag = (dimension: string, index: number) => {
  form.tags[dimension].splice(index, 1);
};

const saveModel = async () => {
  if (!form.name) return;

  submitting.value = true;
  try {
    const cleanTags: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(form.tags)) {
      if (val.length > 0) {
        cleanTags[key] = val;
      }
    }

    const payload = {
      name: form.name,
      description: form.description,
      tags: cleanTags
    };

    if (isEdit.value && props.modelId) {
      await modelApi.update(props.modelId, payload);
      // Also save current doc content if changed? 
      // Requirement says "Unified Modal". 
      // Usually users expect "Save" to save EVERYTHING.
      // But doc content is large. 
      // Let's autosave doc content when switching tabs? Or explicit save?
      // User asked for "Unified Edit Modal".
      // Let's simple approach: When clicking "Save", we save Basic Info AND Current Tab Content.
      // (And maybe other tabs if we tracked dirty state, but simpler is just current tab).
      
      if (currentTab.value) {
          await modelApi.saveDocContent(props.modelId, currentTab.value, currentDocContent.value);
      }

    } else {
      const newModel = await modelApi.create(payload);
      // If new model, we might want to save doc content too if user entered any?
      // But UI for Sub-docs might be hidden for "New Model" to simplify? 
      // "Sub-docs only available after creating model" is a common pattern.
      // Let's stick to that for now unless requested otherwise.
    }

    // Refresh store data
    await store.fetchModels();
    await store.fetchNavigation();

    emit('saved');
    close();
  } catch (error) {
    console.error('Failed to save model', error);
  } finally {
    submitting.value = false;
  }
};
</script>
