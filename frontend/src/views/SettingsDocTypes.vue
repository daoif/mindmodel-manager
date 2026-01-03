<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="mb-6 border-b border-gray-200 pb-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">文档类型管理</h1>
      <button @click="openAddModal" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
        添加类型
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排序</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="type in store.docTypes" :key="type.name">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ type.display_order }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ type.name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="editType(type)" class="text-indigo-600 hover:text-indigo-900 mr-4">编辑</button>
              <button @click="deleteType(type)" class="text-red-600 hover:text-red-900">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit/Add Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModal"></div>
            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">{{ isEdit ? '编辑类型' : '添加类型' }}</h3>
                    <form @submit.prevent="save">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700">名称</label>
                            <input v-model="form.name" type="text" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700">排序</label>
                            <input v-model.number="form.display_order" type="number" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                        <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button type="submit" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:col-start-2 sm:text-sm">保存</button>
                            <button type="button" @click="closeModal" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useMainStore } from '../stores';
import { DocType } from '../types';
import { configApi } from '../api';

const store = useMainStore();
const showModal = ref(false);
const isEdit = ref(false);
const originalName = ref('');

const form = reactive({
    name: '',
    display_order: 0
});

const openAddModal = () => {
    isEdit.value = false;
    form.name = '';
    form.display_order = (store.docTypes.length + 1);
    showModal.value = true;
};

const editType = (type: DocType) => {
    isEdit.value = true;
    originalName.value = type.name;
    form.name = type.name;
    form.display_order = type.display_order;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const save = async () => {
    try {
        if (isEdit.value) {
            await configApi.updateDocType(originalName.value, {
                newName: form.name,
                display_order: form.display_order
            });
        } else {
            await configApi.addDocType({
                name: form.name
            });
             // Update immediately for order if needed
            if (form.display_order) {
                 await configApi.updateDocType(form.name, {
                    display_order: form.display_order
                });
            }
        }
        await store.fetchConfig();
        closeModal();
    } catch (e) {
        console.error(e);
        alert('操作失败: ' + e);
    }
};

const deleteType = async (type: DocType) => {
    if (!confirm(`确定要删除类型 "${type.name}" 吗？`)) return;
    try {
        await configApi.deleteDocType(type.name);
        await store.fetchConfig();
    } catch (e) {
        console.error(e);
        alert('删除失败');
    }
};
</script>
