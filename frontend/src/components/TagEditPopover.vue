<template>
  <div class="relative inline-block text-left" ref="containerRef">
    <div @click="toggle" class="cursor-pointer min-h-[24px] flex flex-wrap gap-1 items-center hover:bg-gray-50 rounded p-1 -m-1 transition-colors">
        <slot name="trigger">
            <span v-if="selectedTags.length === 0" class="text-gray-400 italic text-xs">无标签</span>
            <span
                v-for="tag in selectedTags"
                :key="tag"
                :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', colorClass]"
            >
                {{ tag }}
            </span>
        </slot>
    </div>

    <div
      v-if="isOpen"
      class="origin-top-right absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabindex="-1"
    >
      <div class="py-1" role="none">
        <div class="px-3 py-2 border-b border-gray-100 flex justify-between items-center">
             <span class="text-xs font-semibold text-gray-500">{{ dimension }}</span>
             <button @click="close" class="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div class="max-h-60 overflow-y-auto">
            <template v-for="tag in availableTags" :key="tag">
                 <a
                    href="#"
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                    @click.prevent="toggleTag(tag)"
                    role="menuitem"
                >
                    <span>{{ tag }}</span>
                    <span v-if="selectedTags.includes(tag)" class="text-indigo-600">✓</span>
                </a>
            </template>
             <div v-if="availableTags.length === 0" class="px-4 py-2 text-sm text-gray-500 italic">
                 无可用标签
             </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMainStore } from '../stores';
import { modelApi } from '../api';

const props = defineProps<{
  modelId: string;
  dimension: string;
  initialTags: string[];
  colorClass?: string;
}>();

const emit = defineEmits(['updated']);

const store = useMainStore();
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const selectedTags = ref<string[]>([...props.initialTags]);

// Compute available tags for this dimension
// We should probably get this from configuration or aggregate from all models.
// `store.dimensions` only has metadata.
// But we can aggregate from `store.models` (which might be incomplete if paginated, but here we have all)
// OR better: In `SettingsDimensions`, we don't manage specific tag values (they are created on the fly usually or pre-defined?).
// The requirement says: "Show all available tags list".
// If tags are free-text entered in edit modal, we can collect all unique ones.
const availableTags = computed(() => {
    const tags = new Set<string>();
    store.models.forEach(m => {
        if (m.tags && m.tags[props.dimension]) {
            m.tags[props.dimension].forEach(t => tags.add(t));
        }
    });
    // Ensure currently selected tags are also in the list even if not in other models
    selectedTags.value.forEach(t => tags.add(t));
    return Array.from(tags).sort();
});

const toggle = () => {
    isOpen.value = !isOpen.value;
};

const close = () => {
    isOpen.value = false;
};

const toggleTag = async (tag: string) => {
    const index = selectedTags.value.indexOf(tag);
    let newTags = [...selectedTags.value];
    if (index > -1) {
        newTags.splice(index, 1);
    } else {
        newTags.push(tag);
    }
    selectedTags.value = newTags;

    // Save immediately
    try {
        await modelApi.updateTags(props.modelId, {
            [props.dimension]: newTags
        });
        // We should also update the local store model to reflect changes immediately
        const model = store.models.find(m => m.id === props.modelId);
        if (model) {
            if (!model.tags) model.tags = {};
            model.tags[props.dimension] = newTags;
        }
        emit('updated');
    } catch (e) {
        console.error('Failed to update tags', e);
        // Revert?
    }
};

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    close();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
