<template>
  <div class="h-screen flex flex-col overflow-hidden bg-gray-50">
    <!-- Server Error Banner -->
    <div v-if="!store.serverConnected" class="bg-red-500 text-white text-center py-2 px-4 text-sm">
      ⚠️ 未连接到服务器 — {{ store.serverError || '请确保后端服务已启动' }}
      <button @click="retryConnection" class="ml-4 underline hover:no-underline">重试</button>
    </div>

    <!-- Header -->
    <header class="bg-white shadow-sm z-10">
      <div class="w-full px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex-shrink-0 flex items-center gap-3">
            <img src="/logo.png" alt="MindModel" class="h-8 w-8" />
            <h1 class="text-xl font-bold text-gray-900">MindModel Manager</h1>
          </div>
          <div class="flex items-center space-x-4">
             <router-link to="/settings/dimensions" class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                设置
             </router-link>
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
      <main class="flex-1 overflow-y-auto p-8 pb-64">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useMainStore } from './stores';
import NavigationTree from './components/NavigationTree.vue';
import { startServer } from './utils/sidecar';

const store = useMainStore();

const retryConnection = async () => {
  try {
    if (window.__TAURI__) {
      await startServer();
    }
  } catch (e) {
    console.warn('Retry: Sidecar start failed', e);
  }
  await store.init();
};

onMounted(async () => {
  try {
    // 尝试启动 Sidecar (仅在 Tauri 环境下有效，Web 环境会报错或被忽略)
    if (window.__TAURI__) {
      await startServer();
    }
  } catch (e) {
    console.warn('Sidecar start failed (normal in Web Dev):', e);
  }
  store.init();
});
</script>
