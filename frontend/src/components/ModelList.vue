<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <ul role="list" class="divide-y divide-gray-200">
      <li 
        v-for="model in models" 
        :key="model.id" 
        class="hover:bg-gray-50 transition-colors cursor-pointer"
        @click="openEditModal(model)"
      >
        <div class="px-4 h-16 flex items-center">
            <!-- 1. Name -->
            <div class="w-48 flex-shrink-0 mr-4">
                <p class="text-sm font-medium text-indigo-600 truncate" :title="model.name">
                    {{ model.name }}
                </p>
            </div>

            <div v-if="store.copyButtonPosition === 'content'" class="flex gap-1 mr-4">
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

            <!-- 2. Description (Elastic) -->
            <div class="flex-1 min-w-0 mr-4">
                <p class="text-sm text-gray-500 truncate" :title="model.description || '无描述'">
                    {{ model.description || '-' }}
                </p>
            </div>

            <!-- 3. Tags (Compact) -->
            <div class="flex-shrink-0 flex items-center gap-2 max-w-[30%] overflow-hidden mr-4" @click.stop>
                <div class="flex items-center gap-1 overflow-hidden" title="点击详情编辑标签">
                    <template v-for="dim in store.dimensions" :key="dim.name">
                         <span
                            v-for="val in (model.tags[dim.name] || [])"
                            :key="`${dim.name}-${val}`"
                            :class="['inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium whitespace-nowrap', dim.color || 'bg-gray-100 text-gray-800']"
                         >
                            {{ val }}
                        </span>
                    </template>
                </div>
            </div>

            <!-- 4. Actions & Info -->
            <div class="flex-shrink-0 flex items-center space-x-4 text-xs text-gray-400">
                <div v-if="store.copyButtonPosition === 'footer'" class="flex gap-1">
                     <button
                        v-for="dtype in visibleDocTypes"
                        :key="dtype.name"
                        @click.stop="copyDocContent(model.id, dtype.name)"
                        class="px-2 py-0.5 rounded border bg-white border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                        :class="{'!text-green-600 !border-green-200 !bg-green-50': copyStatus[`${model.id}_${dtype.name}`] === 'success'}"
                     >
                        {{ copyStatus[`${model.id}_${dtype.name}`] === 'success' ? '已复制' : (copyStatus[`${model.id}_${dtype.name}`] === 'loading' ? '...' : (dtype.short_name || dtype.name)) }}
                     </button>
                </div>
                <span class="hidden sm:inline-block">{{ formatDate(model.updated_at) }}</span>
                <button @click.stop="openEditModal(model)" class="text-indigo-600 hover:text-indigo-900 font-medium whitespace-nowrap">编辑</button>
                <button @click.stop="deleteModel(model)" class="text-red-600 hover:text-red-900 whitespace-nowrap">删除</button>
            </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { MindModel } from '../types';
import { useMainStore } from '../stores';
import { modelApi } from '../api';

defineProps<{
  models: MindModel[];
}>();

const emit = defineEmits(['edit-model', 'refresh']);

const store = useMainStore();

const visibleDocTypes = computed(() => store.docTypes.filter(t => t.show_in_copy !== 0 && t.show_in_copy !== false));

const openEditModal = (model: MindModel) => {
    emit('edit-model', model);
};

const deleteModel = async (model: MindModel) => {
    if (!confirm(`确定要删除 "${model.name}" 吗?`)) return;
    try {
        await modelApi.delete(model.id);
        emit('refresh');
    } catch (e) {
        console.error(e);
    }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

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
