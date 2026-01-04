<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="mb-6 border-b border-gray-200 pb-4 flex justify-between items-center">
      <div>
         <h1 class="text-2xl font-bold text-gray-900">文档类型管理</h1>
         <div class="mt-2 space-x-2">
             <router-link to="/settings/dimensions" class="text-sm font-medium text-gray-500 hover:text-gray-900">标签维度</router-link>
             <span class="text-gray-300">|</span>
             <router-link to="/settings/doc-types" class="text-sm font-medium text-indigo-600">文档类型</router-link>
         </div>
      </div>
      <button @click="openAddModal" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">
        添加类型
      </button>
    </div>

    <!-- Global Settings -->
    <div class="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 class="text-sm font-medium text-gray-700 mb-2">全局显示设置</h3>
        <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">一键复制按钮位置:</span>
            <label class="inline-flex items-center cursor-pointer">
                <input type="radio" v-model="store.copyButtonPosition" value="footer" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300">
                <span class="ml-2 text-sm text-gray-700">底部 (默认)</span>
            </label>
            <label class="inline-flex items-center cursor-pointer">
                <input type="radio" v-model="store.copyButtonPosition" value="content" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300">
                <span class="ml-2 text-sm text-gray-700">标题下方/右侧</span>
            </label>
        </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">排序</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">简化名称</th>
            <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">显示一键复制</th>
            <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="(type, index) in store.docTypes" :key="type.name">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                <span class="mr-2 w-4">{{ type.display_order }}</span>
                <div class="flex flex-col">
                    <button @click="moveUp(index)" :disabled="index === 0" class="text-gray-400 hover:text-gray-600 disabled:opacity-30">▲</button>
                    <button @click="moveDown(index)" :disabled="index === store.docTypes.length - 1" class="text-gray-400 hover:text-gray-600 disabled:opacity-30">▼</button>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ type.name }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ type.short_name || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                <input
                    type="checkbox"
                    :checked="!!type.show_in_copy"
                    @change="toggleShowInCopy(type, $event)"
                    class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                >
            </td>
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
                            <label class="block text-sm font-medium text-gray-700">简化名称(选填)</label>
                            <input v-model="form.short_name" type="text" placeholder="用于按钮显示" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700">排序</label>
                            <input v-model.number="form.display_order" type="number" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>
                        <div class="mb-4 flex items-center">
                            <input id="show_in_copy" v-model="form.show_in_copy" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                            <label for="show_in_copy" class="ml-2 block text-sm text-gray-900">
                                在列表/卡片中显示“一键复制”
                            </label>
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
import type { DocType } from '../types';
import { configApi } from '../api';

const store = useMainStore();
const showModal = ref(false);
const isEdit = ref(false);
const originalName = ref('');

const form = reactive({
    name: '',
    display_order: 0,
    show_in_copy: true,
    short_name: ''
});

const openAddModal = () => {
    isEdit.value = false;
    form.name = '';
    form.display_order = (store.docTypes.length + 1);
    form.show_in_copy = true;
    form.short_name = '';
    showModal.value = true;
};

const editType = (type: DocType) => {
    isEdit.value = true;
    originalName.value = type.name;
    form.name = type.name;
    form.display_order = type.display_order;
    form.show_in_copy = !!type.show_in_copy;
    form.short_name = type.short_name || '';
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
                display_order: form.display_order,
                show_in_copy: form.show_in_copy,
                short_name: form.short_name
            });
        } else {
            await configApi.addDocType({
                name: form.name,
                show_in_copy: form.show_in_copy,
                short_name: form.short_name
            });
             // Order update logic is redundant if backend assigns it correctly, but handled for safety if user edited it.
             // But configApi.addDocType doesn't take display_order in args we defined unless we updated it.
             // We update it: `addDocType` takes `show_in_copy`.
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

const moveUp = async (index: number) => {
    if (index === 0) return;
    const current = store.docTypes[index];
    const prev = store.docTypes[index - 1];
    await swapOrder(current, prev);
};

const moveDown = async (index: number) => {
    if (index === store.docTypes.length - 1) return;
    const current = store.docTypes[index];
    const next = store.docTypes[index + 1];
    await swapOrder(current, next);
};

const swapOrder = async (a: DocType, b: DocType) => {
    try {
        const orderA = a.display_order;
        const orderB = b.display_order;

        await configApi.updateDocType(a.name, { ...a, display_order: orderB });
        await configApi.updateDocType(b.name, { ...b, display_order: orderA });

        await store.fetchConfig();
    } catch (e) {
        console.error(e);
        alert('排序更新失败');
    }
};

const toggleShowInCopy = async (type: DocType, event: Event) => {
    const checked = (event.target as HTMLInputElement).checked;
    try {
        // Backend expects boolean or number? API handles boolean.
        await configApi.updateDocType(type.name, {
            show_in_copy: checked
        });
        await store.fetchConfig();
    } catch (e) {
        console.error(e);
        alert('更新失败');
        // Revert UI?
        (event.target as HTMLInputElement).checked = !checked;
    }
};
</script>
