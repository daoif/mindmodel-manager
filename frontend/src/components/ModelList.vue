<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-md">
    <ul role="list" class="divide-y divide-gray-200">
      <li v-for="model in models" :key="model.id" class="hover:bg-gray-50">
        <div class="px-4 py-4 sm:px-6">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0 pr-4">
              <!-- Name Editing -->
              <div v-if="editingId === model.id && editingField === 'name'" class="flex items-center">
                  <input
                    ref="editInput"
                    type="text"
                    v-model="editValue"
                    @blur="saveEdit(model)"
                    @keyup.enter="saveEdit(model)"
                    class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-1"
                  >
              </div>
              <p v-else
                 class="text-sm font-medium text-indigo-600 truncate cursor-pointer hover:underline"
                 @click="startEdit(model, 'name', model.name)"
              >
                {{ model.name }}
              </p>

              <!-- Description Editing -->
               <div v-if="editingId === model.id && editingField === 'description'" class="mt-2">
                  <textarea
                    ref="editInput"
                    v-model="editValue"
                    @blur="saveEdit(model)"
                    class="block w-full shadow-sm sm:text-sm border-gray-300 rounded-md border p-1"
                    rows="2"
                  ></textarea>
              </div>
              <p v-else
                 class="mt-1 flex items-center text-sm text-gray-500 line-clamp-2 cursor-pointer hover:text-gray-900"
                 @click="startEdit(model, 'description', model.description)"
              >
                {{ model.description || '无描述 (点击编辑)' }}
              </p>
            </div>

            <div class="flex flex-col items-end flex-shrink-0 space-y-2">
               <!-- Tags -->
               <div class="flex flex-wrap gap-2 justify-end max-w-xs">
                  <template v-for="dim in store.dimensions" :key="dim.name">
                      <!-- Always show trigger for each dimension, even if empty -->
                      <TagEditPopover
                        :model-id="model.id"
                        :dimension="dim.name"
                        :initial-tags="model.tags[dim.name] || []"
                        :color-class="dim.color || 'bg-gray-100 text-gray-800'"
                        @updated="emit('refresh')"
                      >
                         <template #trigger>
                             <template v-if="model.tags[dim.name] && model.tags[dim.name].length > 0">
                                <span
                                    v-for="val in model.tags[dim.name]"
                                    :key="val"
                                    :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer mb-1 mr-1', dim.color || 'bg-gray-100 text-gray-800']"
                                >
                                    {{ val }}
                                </span>
                             </template>
                             <template v-else>
                                 <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 mb-1 mr-1">
                                    + {{ dim.name }}
                                 </span>
                             </template>
                         </template>
                      </TagEditPopover>
                  </template>
               </div>

               <div class="flex items-center text-xs text-gray-400">
                 <p>
                   更新于 {{ formatDate(model.updated_at) }}
                 </p>
                 <button @click.stop="openEditModal(model)" class="ml-4 text-indigo-600 hover:text-indigo-900">详情</button>
                 <button @click.stop="deleteModel(model)" class="ml-2 text-red-600 hover:text-red-900">删除</button>
               </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import type { MindModel } from '../types';
import { useMainStore } from '../stores';
import { modelApi } from '../api';
import TagEditPopover from './TagEditPopover.vue';

defineProps<{
  models: MindModel[];
}>();

const emit = defineEmits(['edit-model', 'refresh']);

const store = useMainStore();
const editingId = ref<string | null>(null);
const editingField = ref<string | null>(null);
const editValue = ref('');
const editInput = ref<HTMLInputElement | null>(null);

const startEdit = (model: MindModel, field: string, value: string) => {
    editingId.value = model.id;
    editingField.value = field;
    editValue.value = value;
    nextTick(() => {
        if (editInput.value) {
            if (Array.isArray(editInput.value)) {
                editInput.value[0]?.focus();
            } else {
                editInput.value?.focus();
            }
        }
    });
};

const saveEdit = async (model: MindModel) => {
    if (!editingId.value || !editingField.value) return;

    // Check if changed
    if (editingField.value === 'name' && editValue.value === model.name) {
        cancelEdit();
        return;
    }
    if (editingField.value === 'description' && editValue.value === model.description) {
        cancelEdit();
        return;
    }

    try {
        const payload: any = {
            name: model.name,
            description: model.description,
            tags: model.tags
        };
        payload[editingField.value] = editValue.value;

        await modelApi.update(model.id, payload);
        emit('refresh');
    } catch (error) {
        console.error("Failed to update", error);
    } finally {
        cancelEdit();
    }
};

const cancelEdit = () => {
    editingId.value = null;
    editingField.value = null;
    editValue.value = '';
};

const openEditModal = (model: MindModel) => {
    emit('edit-model', model.id);
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
</script>
