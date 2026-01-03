<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="close"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
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
                            rows="3"
                            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
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

                            <div class="flex gap-2">
                              <input
                                type="text"
                                v-model="tagInputs[dim.name]"
                                @keydown.enter.prevent="addTag(dim.name)"
                                placeholder="输入标签按回车"
                                class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-xs border-gray-300 rounded-md p-1 border"
                              >
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

const form = reactive({
  name: '',
  description: '',
  tags: {} as Record<string, string[]>
});

const tagInputs = reactive<Record<string, string>>({});

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
};

watch(() => props.modelValue, async (val) => {
    if (val) {
        resetForm();
        if (isEdit.value && props.modelId) {
            try {
                // We might already have the model in store, but fetching ensures fresh data
                // Or just find it in store.models to be faster?
                // Let's fetch to be safe and consistent with previous logic.
                // Actually, if we use store.models.find, it's instant.
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
            } catch (e) {
                console.error("Error loading model", e);
            }
        }
    }
});

const addTag = (dimension: string) => {
  const val = tagInputs[dimension]?.trim();
  if (val && !form.tags[dimension].includes(val)) {
    form.tags[dimension].push(val);
    tagInputs[dimension] = '';
  }
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
    } else {
      await modelApi.create(payload);
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
