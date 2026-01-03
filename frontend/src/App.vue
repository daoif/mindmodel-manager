<template>
  <div class="h-screen flex flex-col overflow-hidden bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center cursor-pointer" @click="$router.push('/')">
              <h1 class="text-xl font-bold text-gray-900">MindModel Manager</h1>
            </div>
          </div>
          <div class="flex items-center">
            <button
              @click="$router.push('/model/new')"
              class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              新建模型
            </button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-64 bg-white shadow-md overflow-y-auto">
        <nav class="mt-5 px-2">
          <NavigationTree v-if="store" :nodes="store.navigationTree" />
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-8">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useMainStore } from './stores';
import NavigationTree from './components/NavigationTree.vue';

const store = useMainStore();

onMounted(() => {
  store.init();
});
</script>
