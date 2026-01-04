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

    <Teleport to="body">
        <div
            v-if="isOpen"
            ref="popoverRef"
            :style="popoverStyle"
            class="fixed rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
            tabindex="-1"
            @click.stop
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
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
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
const popoverRef = ref<HTMLElement | null>(null);
const selectedTags = ref<string[]>([...props.initialTags]);
const popoverStyle = ref({
    top: '0px',
    left: '0px',
    width: '224px' // w-56 equivalent
});

// Compute available tags for this dimension
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

const calculatePosition = () => {
    if (!containerRef.value) return;
    const rect = containerRef.value.getBoundingClientRect();
    const width = 224; // w-56
    const height = 250; // Approximated max height (since we have max-h-60 which is 15rem + header + padding ~= 240-260px)
    
    // Default: Position below and aligned to left
    let top = rect.bottom + 5;
    let left = rect.left;
    
    // Check vertical overflow
    if (top + height > window.innerHeight) {
        // Flip up
        top = rect.top - height - 5;
        // If it goes off top, stick to top?
        if (top < 0) top = 10;
        
        // Since we are flipping up, we might want to ensure the maxHeight is dynamic if space is tight?
        // But for now, simple flip is usually enough given 250px is small.
    }
    
    // Adjustment to ensure it doesn't go off-screen right
    if (left + width > window.innerWidth) {
        left = window.innerWidth - width - 10;
    }

    popoverStyle.value = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`
    };
};

const toggle = async () => {
    if (isOpen.value) {
        close();
    } else {
        isOpen.value = true;
        await nextTick();
        calculatePosition();
    }
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
        
        // Don't close immediately? Or do? 
        // User might want to multi-select. 
        // Current logic keeps it open.
    } catch (e) {
        console.error('Failed to update tags', e);
    }
};

const handleClickOutside = (event: MouseEvent) => {
  // Check if click is inside container (trigger) OR inside popover
  const isClickInsideContainer = containerRef.value && containerRef.value.contains(event.target as Node);
  const isClickInsidePopover = popoverRef.value && popoverRef.value.contains(event.target as Node);
  
  if (!isClickInsideContainer && !isClickInsidePopover) {
    close();
  }
};

const handleScroll = () => {
    if (isOpen.value) {
        // Option A: Update position (Computationally expensive if continuous)
        // Option B: Close popover (Standard behavior for simple popovers)
        // Let's trying updating position for better UX, or close if simpler. Close is safer.
        calculatePosition();
    }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside); // mousedown handles clicks better than click for outside detection sometimes
  window.addEventListener('scroll', handleScroll, true); // true for capture, to detect scroll of any parent
  window.addEventListener('resize', handleScroll); 
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleScroll);
});
</script>
