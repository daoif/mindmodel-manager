<template>
  <div>
    <div v-for="node in nodes" :key="node.id" class="ml-2">
      <div
        class="flex items-center py-2 px-2 hover:bg-gray-100 rounded cursor-pointer"
        :class="{ 'bg-indigo-50 text-indigo-700': isSelected(node) }"
        @click="selectNode(node)"
      >
        <span class="mr-2 text-gray-400" v-if="node.children.length > 0">
          <svg v-if="isOpen(node.id)" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span class="mr-2 text-gray-300" v-else>
          •
        </span>
        <span class="text-sm font-medium">{{ node.name }}</span>
      </div>

      <div v-if="isOpen(node.id) && node.children.length > 0" class="ml-4 border-l border-gray-200">
        <NavigationTree :nodes="node.children" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { NavigationNode } from '../types';
import { useMainStore } from '../stores';
import { useRouter } from 'vue-router';

defineProps<{
  nodes: NavigationNode[];
}>();

const store = useMainStore();
const router = useRouter();
const openNodes = ref<Set<string>>(new Set(['all'])); // 默认展开根节点

const isOpen = (id: string) => openNodes.value.has(id);

const toggle = (id: string) => {
  if (openNodes.value.has(id)) {
    openNodes.value.delete(id);
  } else {
    openNodes.value.add(id);
  }
};

const isSelected = (node: NavigationNode) => {
  // Handle 'all' case
  if ((!store.currentFilter || store.currentFilter.length === 0) && node.id === 'all') return true;

  // Handle array rule
  if (store.currentFilter && node.rule) {
      if (node.rule.length !== store.currentFilter.length) return false;
      // Check if all rules match
      // Assuming order might match if generated consistently, or use explicit check
      // For simplicity, strict equality check of key fields
      return node.rule.every((r, i) => {
          const filterRule = store.currentFilter![i];
          return filterRule && filterRule.dimension === r.dimension && filterRule.value === r.value;
      });
  }
  return false;
};

const selectNode = (node: NavigationNode) => {
  if (node.children.length > 0) {
    toggle(node.id);
  }

  if (node.rule !== undefined) {
    store.setFilter(node.rule || null);
    router.push('/');
  }
};
</script>
