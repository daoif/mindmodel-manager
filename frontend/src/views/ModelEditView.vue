<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="mb-6 border-b border-gray-200 pb-4">
      <h1 class="text-2xl font-bold text-gray-900">
        {{ isEdit ? '编辑模型' : '新建模型' }}
      </h1>
    </div>

    <form @submit.prevent="saveModel" class="space-y-6 max-w-3xl">
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
      <div v-for="dim in store.dimensions" :key="dim.name" class="bg-gray-50 p-4 rounded-md">
        <label class="block text-sm font-medium text-gray-900 mb-2">{{ dim.name }}</label>

        <!-- Existing tags (if we had a predefined list, we would use checkboxes) -->
        <!-- For MVP, let's use a simple text input for adding tags separated by commas,
             OR create a simple tag input component.
             Ideally we should fetch existing values for suggestions.
        -->
        <div class="flex flex-wrap gap-2 mb-2">
           <span
              v-for="(tag, index) in (form.tags[dim.name] || [])"
              :key="index"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {{ tag }}
              <button
                type="button"
                @click="removeTag(dim.name, index)"
                class="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none"
              >
                <span class="sr-only">Remove tag</span>
                ×
              </button>
            </span>
        </div>

        <div class="flex gap-2">
          <input
            type="text"
            v-model="tagInputs[dim.name]"
            @keydown.enter.prevent="addTag(dim.name)"
            placeholder="输入标签按回车添加"
            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
          >
          <button
            type="button"
            @click="addTag(dim.name)"
            class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            添加
          </button>
        </div>
      </div>

      <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          @click="$router.back()"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          取消
        </button>
        <button
          type="submit"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          :disabled="submitting"
        >
          {{ submitting ? '保存中...' : '保存' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useMainStore } from '../stores';
import { modelApi } from '../api';
import { useRouter } from 'vue-router';

const props = defineProps<{
  id?: string;
}>();

const store = useMainStore();
const router = useRouter();
const submitting = ref(false);
const isEdit = computed(() => !!props.id);

const form = reactive({
  name: '',
  description: '',
  tags: {} as Record<string, string[]>
});

const tagInputs = reactive<Record<string, string>>({});

const initForm = async () => {
  if (store.dimensions.length === 0) {
    await store.fetchConfig();
  }

  // Initialize tag arrays
  store.dimensions.forEach(dim => {
    if (!form.tags[dim.name]) {
      form.tags[dim.name] = [];
    }
    tagInputs[dim.name] = '';
  });

  if (isEdit.value && props.id) {
    try {
      const model = await modelApi.get(props.id);
      form.name = model.name;
      form.description = model.description;
      // Merge tags
      store.dimensions.forEach(dim => {
        form.tags[dim.name] = model.tags[dim.name] || [];
      });
    } catch (error) {
      console.error('Failed to fetch model', error);
      router.push('/');
    }
  }
};

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
    // Clean up empty tag lists
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

    let savedId;
    if (isEdit.value && props.id) {
      await modelApi.update(props.id, payload);
      savedId = props.id;
    } else {
      const result = await modelApi.create(payload);
      savedId = result.id;
    }

    // Refresh store data
    await store.fetchModels();
    await store.fetchNavigation();

    router.push(`/model/${savedId}`);
  } catch (error) {
    console.error('Failed to save model', error);
  } finally {
    submitting.value = false;
  }
};

onMounted(initForm);
</script>
