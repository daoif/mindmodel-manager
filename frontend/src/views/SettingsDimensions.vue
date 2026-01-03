<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="mb-6 border-b border-gray-200 pb-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">维度管理</h1>
      <button @click="openAddModal" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
        添加维度
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排序</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">导航显示</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">颜色</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="dim in store.dimensions" :key="dim.name">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ dim.display_order }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ dim.name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span v-if="dim.show_in_nav" class="text-green-600">显示</span>
                <span v-else class="text-gray-400">隐藏</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span :class="['px-2 py-1 rounded text-xs', dim.color || 'bg-gray-100 text-gray-800']">Example</span>
                <span class="ml-2 text-xs text-gray-400">{{ dim.color }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="editDimension(dim)" class="text-indigo-600 hover:text-indigo-900 mr-4">编辑</button>
              <button @click="deleteDimension(dim)" class="text-red-600 hover:text-red-900">删除</button>
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
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">{{ isEdit ? '编辑维度' : '添加维度' }}</h3>
                    <form @submit.prevent="save">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700">名称</label>
                            <input v-model="form.name" type="text" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700">排序</label>
                            <input v-model.number="form.display_order" type="number" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                        <div class="mb-4 flex items-center">
                            <input id="show_in_nav" v-model="form.show_in_nav" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                            <label for="show_in_nav" class="ml-2 block text-sm text-gray-900">在侧边导航显示</label>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700">颜色 (Tailwind classes, e.g., 'bg-blue-100 text-blue-800')</label>
                            <input v-model="form.color" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
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
import { TagDimension } from '../types';
import { configApi } from '../api';

const store = useMainStore();
const showModal = ref(false);
const isEdit = ref(false);
const originalName = ref('');

const form = reactive({
    name: '',
    display_order: 0,
    color: '',
    show_in_nav: true
});

const openAddModal = () => {
    isEdit.value = false;
    form.name = '';
    form.display_order = (store.dimensions.length + 1);
    form.color = 'bg-gray-100 text-gray-800';
    form.show_in_nav = true;
    showModal.value = true;
};

const editDimension = (dim: TagDimension) => {
    isEdit.value = true;
    originalName.value = dim.name;
    form.name = dim.name;
    form.display_order = dim.display_order;
    form.color = dim.color || '';
    form.show_in_nav = dim.show_in_nav !== undefined ? !!dim.show_in_nav : true;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const save = async () => {
    try {
        if (isEdit.value) {
            await configApi.updateDimension(originalName.value, {
                newName: form.name,
                display_order: form.display_order,
                color: form.color,
                show_in_nav: form.show_in_nav
            });
        } else {
            await configApi.addDimension({
                name: form.name
            });
            // Update immediately for extra fields
            await configApi.updateDimension(form.name, {
                display_order: form.display_order,
                color: form.color,
                show_in_nav: form.show_in_nav
            });
        }
        await store.fetchConfig();
        closeModal();
    } catch (e) {
        console.error(e);
        alert('操作失败: ' + e);
    }
};

const deleteDimension = async (dim: TagDimension) => {
    if (!confirm(`确定要删除维度 "${dim.name}" 吗？关联的标签也将被删除。`)) return;
    try {
        await configApi.deleteDimension(dim.name);
        await store.fetchConfig();
    } catch (e) {
        console.error(e);
        alert('删除失败');
    }
};
</script>
