<template>
  <div class="h-screen flex flex-col overflow-hidden bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center">
          <div class="flex-shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-gray-900">MindModel Manager</h1>
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
