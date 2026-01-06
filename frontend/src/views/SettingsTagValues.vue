<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="mb-6">
      <SettingsNav />
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">标签管理</h1>
        <div class="flex gap-2">
          <button 
            v-if="totalOrphanCount > 0"
            @click="cleanupAllOrphans" 
            :disabled="cleaning"
            class="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 rounded text-orange-700 disabled:opacity-50"
          >
            {{ cleaning ? '清理中...' : `清理所有孤立记录 (${totalOrphanCount})` }}
          </button>
          <button 
            @click="loadTagValues" 
            class="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            刷新
          </button>
        </div>
      </div>
      <p class="mt-2 text-sm text-gray-500">
        管理所有维度下的标签值。只有当标签没有被任何模型使用时才能删除。
      </p>
    </div>

    <!-- 筛选 -->
    <div class="mb-4">
      <label class="text-sm font-medium text-gray-700 mr-2">筛选维度：</label>
      <select 
        v-model="selectedDimension" 
        class="border border-gray-300 rounded px-3 py-1 text-sm"
      >
        <option value="">全部</option>
        <option v-for="dim in dimensions" :key="dim" :value="dim">{{ dim }}</option>
      </select>
    </div>

    <!-- 表格 -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">维度</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标签值</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">关联模型</th>
            <th v-if="totalOrphanCount > 0" scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">孤立记录</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="tag in filteredTags" :key="`${tag.dimension}-${tag.value}`">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ tag.dimension }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getDimensionColor(tag.dimension)"
              >
                {{ tag.value }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ tag.model_count }}
            </td>
            <td v-if="totalOrphanCount > 0" class="px-6 py-4 whitespace-nowrap text-sm">
              <span v-if="tag.orphan_count > 0" class="text-orange-600 font-medium">{{ tag.orphan_count }}</span>
              <span v-else class="text-gray-400">0</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                @click="openEditModal(tag)"
                class="text-indigo-600 hover:text-indigo-900 mr-3"
              >
                编辑
              </button>
              <button 
                v-if="tag.model_count === 0"
                @click="confirmDelete(tag)" 
                class="text-red-600 hover:text-red-900"
              >
                {{ tag.orphan_count > 0 ? '清理孤立' : '删除' }}
              </button>
              <span v-else class="text-gray-400 cursor-not-allowed" title="仍有模型使用此标签">
                有模型使用
              </span>
            </td>
          </tr>
          <tr v-if="filteredTags.length === 0">
            <td :colspan="totalOrphanCount > 0 ? 5 : 4" class="px-6 py-4 text-center text-sm text-gray-500">
              {{ loading ? '加载中...' : '暂无数据' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 编辑标签弹窗 -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeEditModal"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">编辑标签</h3>
                <div class="mt-2">
                  <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700">维度</label>
                    <p class="mt-1 text-sm text-gray-900">{{ editingTag?.dimension }}</p>
                  </div>
                  <div class="mb-4">
                     <label for="tagName" class="block text-sm font-medium text-gray-700">标签名称</label>
                     <input 
                      type="text" 
                      id="tagName"
                      v-model="editTagName" 
                      class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      @keyup.enter="saveEditTag"
                      ref="editInputRef"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              @click="saveEditTag"
              :disabled="saving"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button 
              type="button" 
              @click="closeEditModal"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showDeleteModal = false"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">确认删除</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    确定要删除维度 <strong>{{ tagToDelete?.dimension }}</strong> 下的标签 
                    <strong>{{ tagToDelete?.value }}</strong> 吗？此操作不可撤销。
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              @click="deleteTag"
              :disabled="deleting"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ deleting ? '删除中...' : '删除' }}
            </button>
            <button 
              type="button" 
              @click="showDeleteModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 清理孤立记录确认弹窗 -->
    <div v-if="showCleanupModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="showCleanupModal = false"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">清理孤立记录</h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    确定要清理所有 <strong class="text-orange-600">{{ totalOrphanCount }}</strong> 条孤立记录吗？
                    这些记录指向已删除的模型，清理后不会影响现有数据。
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              @click="doCleanupOrphans"
              :disabled="cleaning"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {{ cleaning ? '清理中...' : '确认清理' }}
            </button>
            <button 
              type="button" 
              @click="showCleanupModal = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useMainStore } from '../stores';
import SettingsNav from '../components/SettingsNav.vue';
import { configApi } from '../api';

interface TagValue {
  dimension: string;
  value: string;
  model_count: number;
  orphan_count: number;
}

const store = useMainStore();
const tagValues = ref<TagValue[]>([]);
const loading = ref(false);
const cleaning = ref(false);
const selectedDimension = ref('');
const showDeleteModal = ref(false);
const showCleanupModal = ref(false);
const tagToDelete = ref<TagValue | null>(null);
const deleting = ref(false);

// 编辑相关
const showEditModal = ref(false);
const editingTag = ref<TagValue | null>(null);
const editTagName = ref('');
const saving = ref(false);
const editInputRef = ref<HTMLInputElement | null>(null);

// 计算孤立记录总数
const totalOrphanCount = computed(() => {
  return tagValues.value.reduce((sum, t) => sum + (t.orphan_count || 0), 0);
});

// 获取所有维度名称
const dimensions = computed(() => {
  const dims = new Set(tagValues.value.map(t => t.dimension));
  return Array.from(dims).sort();
});

// 筛选后的标签
const filteredTags = computed(() => {
  if (!selectedDimension.value) return tagValues.value;
  return tagValues.value.filter(t => t.dimension === selectedDimension.value);
});

// 获取维度颜色
const getDimensionColor = (dimension: string) => {
  const dim = store.dimensions.find(d => d.name === dimension);
  return dim?.color || 'bg-gray-100 text-gray-800';
};

// 加载标签值
const loadTagValues = async () => {
  loading.value = true;
  try {
    const response = await configApi.getTagValues();
    tagValues.value = response.data;
  } catch (error) {
    console.error('Failed to load tag values:', error);
  } finally {
    loading.value = false;
  }
};

// 确认删除
const confirmDelete = (tag: TagValue) => {
  tagToDelete.value = tag;
  showDeleteModal.value = true;
};

// 执行删除
const deleteTag = async () => {
  if (!tagToDelete.value) return;
  
  deleting.value = true;
  try {
    await configApi.deleteTagValue(tagToDelete.value.dimension, tagToDelete.value.value);
    showDeleteModal.value = false;
    tagToDelete.value = null;
    // 刷新列表
    await loadTagValues();
    // 刷新导航（因为删除标签可能影响导航树）
    await store.fetchNavigation();
  } catch (error: any) {
    alert(error.response?.data?.error || '删除失败');
  } finally {
    deleting.value = false;
  }
};

// 显示清理确认弹窗
const cleanupAllOrphans = () => {
  showCleanupModal.value = true;
};

// 执行清理孤立记录
const doCleanupOrphans = async () => {
  cleaning.value = true;
  try {
    await configApi.cleanupOrphans();
    showCleanupModal.value = false;
    // 刷新列表
    await loadTagValues();
    // 刷新导航
    await store.fetchNavigation();
  } catch (error: any) {
    console.error('清理失败:', error);
  } finally {
    cleaning.value = false;
  }
};

// 打开编辑弹窗
const openEditModal = (tag: TagValue) => {
  editingTag.value = tag;
  editTagName.value = tag.value;
  showEditModal.value = true;
  nextTick(() => {
    editInputRef.value?.focus();
  });
};

// 关闭编辑弹窗
const closeEditModal = () => {
  showEditModal.value = false;
  editingTag.value = null;
  editTagName.value = '';
};

// 保存编辑
const saveEditTag = async () => {
  if (!editingTag.value || !editTagName.value.trim()) return;
  if (editTagName.value.trim() === editingTag.value.value) {
    closeEditModal();
    return;
  }

  saving.value = true;
  try {
    await configApi.updateTagValue(
      editingTag.value.dimension,
      editingTag.value.value,
      editTagName.value.trim()
    );
    closeEditModal();
    // 刷新
    await loadTagValues();
    await store.fetchNavigation();
  } catch (error: any) {
    if (error.response?.status === 409 && error.response.data.requiresConfirmation) {
      if (confirm(error.response.data.message)) {
        // 确认合并
        try {
          await configApi.updateTagValue(
            editingTag.value!.dimension,
            editingTag.value!.value,
            editTagName.value.trim(),
            true // confirmMerge
          );
          closeEditModal();
          await loadTagValues();
          await store.fetchNavigation();
        } catch (mergeError: any) {
          alert(mergeError.response?.data?.error || '合并失败');
        }
      }
    } else {
      alert(error.response?.data?.error || '保存失败');
    }
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadTagValues();
});
</script>
