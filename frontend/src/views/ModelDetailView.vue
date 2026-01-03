<template>
  <div v-if="loading" class="text-center py-10">
    <p class="text-gray-500">加载中...</p>
  </div>

  <div v-else-if="model" class="bg-white shadow rounded-lg overflow-hidden min-h-[80vh] flex flex-col">
    <!-- Header -->
    <div class="px-6 py-5 border-b border-gray-200 flex justify-between items-start bg-gray-50">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ model.name }}</h1>
        <div class="flex flex-wrap gap-2 mb-3">
          <template v-for="(values, dim) in model.tags" :key="dim">
            <span
              v-for="val in values"
              :key="val"
              :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getTagColor(dim)]"
            >
              {{ dim }}: {{ val }}
            </span>
          </template>
        </div>
        <p class="text-gray-600">{{ model.description }}</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="openEditModal"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          编辑
        </button>
        <button
          @click="deleteModel"
          class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
        >
          删除
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex px-6 space-x-8 overflow-x-auto" aria-label="Tabs">
        <button
          v-for="type in store.docTypes"
          :key="type.name"
          @click="currentTab = type.name"
          :class="[
            currentTab === type.name
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          {{ type.name }}
        </button>
      </nav>
    </div>

    <!-- Content -->
    <div class="flex-1 p-6 flex flex-col">
      <div class="flex justify-end mb-4 space-x-2">
        <button
          v-if="!isEditingDoc"
          @click="copyContent"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
        >
          <span v-if="copySuccess" class="text-green-600">已复制!</span>
          <span v-else>一键复制</span>
        </button>
        <button
          v-if="!isEditingDoc"
          @click="startEditDoc"
          class="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
        >
          编辑内容
        </button>
        <template v-else>
          <button
            @click="cancelEditDoc"
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            取消
          </button>
          <button
            @click="saveDoc"
            class="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
          >
            保存
          </button>
        </template>
      </div>

      <div v-if="isEditingDoc" class="flex-1 flex flex-col">
        <textarea
          v-model="editingContent"
          class="flex-1 w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
          placeholder="在此输入 Markdown 内容..."
        ></textarea>
      </div>
      <div v-else class="prose max-w-none flex-1 overflow-y-auto">
        <div v-if="currentDocContent" class="whitespace-pre-wrap">{{ currentDocContent }}</div>
        <div v-else class="text-gray-400 italic py-10 text-center">暂无内容</div>
      </div>
    </div>
  </div>

  <ModelEditModal v-model="showEditModal" :model-id="model?.id" @saved="onModelUpdated" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useMainStore } from '../stores';
import { modelApi } from '../api';
import type { MindModel } from '../types';
import { useRouter } from 'vue-router';
import ModelEditModal from '../components/ModelEditModal.vue';

const props = defineProps<{
  id: string;
}>();

const store = useMainStore();
const router = useRouter();
const model = ref<MindModel | null>(null);
const loading = ref(true);
const currentTab = ref('');
const currentDocContent = ref('');
const isEditingDoc = ref(false);
const editingContent = ref('');
const copySuccess = ref(false);
const showEditModal = ref(false);

const openEditModal = () => {
    showEditModal.value = true;
};

const onModelUpdated = async () => {
    await loadModel();
};

const getTagColor = (dimName: string) => {
    const dim = store.dimensions.find(d => d.name === dimName);
    return dim?.color || 'bg-gray-100 text-gray-800';
};

const loadModel = async () => {
  loading.value = true;
  try {
    model.value = await modelApi.get(props.id);
    // 默认选中第一个文档类型
    if (store.docTypes.length > 0) {
      currentTab.value = store.docTypes[0].name;
    }
  } catch (error) {
    console.error('Failed to load model', error);
    // TODO: show error notification
  } finally {
    loading.value = false;
  }
};

const loadDocContent = async () => {
  if (!currentTab.value) return;
  try {
    currentDocContent.value = await modelApi.getDocContent(props.id, currentTab.value);
  } catch (error) {
    console.error('Failed to load doc content', error);
  }
};

const startEditDoc = () => {
  editingContent.value = currentDocContent.value;
  isEditingDoc.value = true;
};

const cancelEditDoc = () => {
  isEditingDoc.value = false;
  editingContent.value = '';
};

const saveDoc = async () => {
  try {
    await modelApi.saveDocContent(props.id, currentTab.value, editingContent.value);
    currentDocContent.value = editingContent.value;
    isEditingDoc.value = false;
  } catch (error) {
    console.error('Failed to save doc', error);
  }
};

const deleteModel = async () => {
  if (!confirm('确定要删除这个模型吗？此操作不可恢复。')) return;

  try {
    await modelApi.delete(props.id);
    await store.fetchModels(); // Refresh list
    await store.fetchNavigation(); // Refresh tree
    router.push('/');
  } catch (error) {
    console.error('Failed to delete model', error);
  }
};

const copyContent = async () => {
  if (!currentDocContent.value) return;
  try {
    await navigator.clipboard.writeText(currentDocContent.value);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    console.error('Copy failed', err);
  }
};

watch(() => props.id, loadModel);
watch(currentTab, () => {
  if (currentTab.value) {
    isEditingDoc.value = false;
    loadDocContent();
  }
});

onMounted(async () => {
  if (store.docTypes.length === 0) {
    await store.fetchConfig();
  }
  await loadModel();
});
</script>
