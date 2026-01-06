<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="close"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                导出模型 ({{ selectedIds.length }}个)
              </h3>

              <div class="mt-4 space-y-4">
                  <!-- Content Selection -->
                  <div>
                      <h4 class="text-sm font-medium text-gray-700 mb-2">导出内容</h4>
                      <div class="space-y-2 max-h-60 overflow-y-auto border border-gray-100 rounded p-2">
                          
                          <!-- Basic Info -->
                          <div class="flex items-center">
                              <input id="field_name" type="checkbox" v-model="options.basic.name" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                              <label for="field_name" class="ml-2 block text-sm text-gray-900">名称</label>
                          </div>
                          <div class="flex items-center">
                              <input id="field_desc" type="checkbox" v-model="options.basic.description" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                              <label for="field_desc" class="ml-2 block text-sm text-gray-900">描述</label>
                          </div>

                          <!-- Dimensions (Dynamic) -->
                          <div v-if="store.dimensions.length > 0" class="pt-2 border-t border-gray-100 mt-2">
                              <p class="text-xs text-gray-500 mb-1">标签维度</p>
                              <div v-for="dim in store.dimensions" :key="dim.name" class="flex items-center">
                                  <input :id="'dim_'+dim.name" type="checkbox" v-model="options.tags[dim.name]" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                                  <label :for="'dim_'+dim.name" class="ml-2 block text-sm text-gray-900">{{ dim.name }}</label>
                              </div>
                          </div>

                          <!-- Doc Types (Dynamic) -->
                          <div v-if="store.docTypes.length > 0" class="pt-2 border-t border-gray-100 mt-2">
                              <p class="text-xs text-gray-500 mb-1">文档内容</p>
                              <div v-for="dtype in store.docTypes" :key="dtype.name" class="flex items-center">
                                  <input :id="'doc_'+dtype.name" type="checkbox" v-model="options.docs[dtype.name]" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                                  <label :for="'doc_'+dtype.name" class="ml-2 block text-sm text-gray-900">{{ dtype.name }}</label>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- Format Selection -->
                  <div>
                      <h4 class="text-sm font-medium text-gray-700 mb-2">导出格式</h4>
                      <div class="flex space-x-4">
                          <div class="flex items-center">
                              <input id="format_md" type="checkbox" v-model="formats.md" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                              <label for="format_md" class="ml-2 block text-sm text-gray-900">Markdown (.md)</label>
                          </div>
                          <div class="flex items-center">
                              <input id="format_json" type="checkbox" v-model="formats.json" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                              <label for="format_json" class="ml-2 block text-sm text-gray-900">JSON (.json)</label>
                          </div>
                      </div>
                  </div>

                  <!-- Progress Bar -->
                  <div v-if="loading" class="mt-4">
                      <div class="text-xs text-gray-500 mb-1 flex justify-between">
                          <span>处理中...</span>
                          <span>{{ progress }}%</span>
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-1.5">
                          <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></div>
                      </div>
                  </div>

              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            @click="handleExportFile"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            :disabled="loading || (!formats.md && !formats.json)"
            :class="{'opacity-50 cursor-not-allowed': loading || (!formats.md && !formats.json)}"
          >
            导出文件
          </button>
          <button
            type="button"
            @click="handleExportClipboard"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            :disabled="loading"
          >
            复制到剪贴板
          </button>
          <button
            type="button"
            @click="close"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            :disabled="loading"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useMainStore } from '../stores';
import { modelApi } from '../api';


const props = defineProps<{
  modelValue: boolean;
  selectedIds: string[];
}>();

const emit = defineEmits(['update:modelValue']);

const store = useMainStore();
const loading = ref(false);
const progress = ref(0);

const options = reactive({
    basic: {
        name: true,
        description: true
    },
    tags: {} as Record<string, boolean>,
    docs: {} as Record<string, boolean>
});

const formats = reactive({
    md: true,
    json: false
});

const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const close = () => {
    isOpen.value = false;
};

// Persistence Logic
const STORAGE_KEY = 'export_preferences';

const loadPreferences = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge basic
            if (parsed.basic) Object.assign(options.basic, parsed.basic);
            // Merge tags (only existing)
            if (parsed.tags) {
                store.dimensions.forEach(dim => {
                    if (parsed.tags.hasOwnProperty(dim.name)) {
                        options.tags[dim.name] = parsed.tags[dim.name];
                    }
                });
            }
            // Merge docs (only existing)
            if (parsed.docs) {
                store.docTypes.forEach(dt => {
                    if (parsed.docs.hasOwnProperty(dt.name)) {
                        options.docs[dt.name] = parsed.docs[dt.name];
                    }
                });
            }
            // Merge formats
            if (parsed.formats) Object.assign(formats, parsed.formats);
        } else {
            // Default select all dynamic fields if no preference
             store.dimensions.forEach(dim => options.tags[dim.name] = true);
             store.docTypes.forEach(dt => options.docs[dt.name] = true);
        }
    } catch (e) {
        console.error('Failed to load export options', e);
    }
};

const savePreferences = () => {
    try {
        const toSave = {
            basic: options.basic,
            tags: options.tags,
            docs: options.docs,
            formats: formats
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
        console.error('Failed to save export options', e);
    }
};

// Initialize watcher for dynamic fields ensuring they exist in options object
watch(() => [store.dimensions, store.docTypes], () => {
    store.dimensions.forEach(dim => {
        if (options.tags[dim.name] === undefined) options.tags[dim.name] = true;
    });
    store.docTypes.forEach(dt => {
        if (options.docs[dt.name] === undefined) options.docs[dt.name] = true;
    });
}, { immediate: true, deep: true });

// Load prefs when modal opens
watch(() => props.modelValue, (val) => {
    if (val) {
        loadPreferences();
    }
});

// Implementation Logic
const fetchData = async () => {
    const results: any[] = [];
    const total = props.selectedIds.length;
    let completed = 0;

    for (const id of props.selectedIds) {
        try {
            let model = store.models.find(m => m.id === id);
            if (!model) {
                 try {
                     model = await modelApi.get(id);
                 } catch (e) {
                     console.error(`Failed to fetch model ${id}`, e);
                     // Skip this model but count as processed
                     continue; 
                 }
            }

            if (!model) continue;

            const item: any = {};
            
            // Basic
            if (options.basic.name) item.name = model.name;
            if (options.basic.description) item.description = model.description;
            
            // Tags
            item.tags = {};
            for (const dim of store.dimensions) {
                if (options.tags[dim.name]) {
                    item.tags[dim.name] = model.tags[dim.name] || [];
                }
            }

            // Docs
            item.docs = {};
            for (const dtype of store.docTypes) {
                if (options.docs[dtype.name]) {
                    try {
                        const content = await modelApi.getDocContent(id, dtype.name);
                        item.docs[dtype.name] = content || '';
                    } catch (e) {
                        item.docs[dtype.name] = ''; // fail gracefully
                    }
                }
            }

            results.push(item);
        } finally {
            completed++;
            progress.value = Math.floor((completed / total) * 100);
        }
    }
    
    // Ensure we show 100% for a moment
    if (progress.value === 100) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
};

const generateMarkdown = (data: any[]) => {
    return data.map(item => {
        let md = '';
        if (options.basic.name) md += `# ${item.name}\n\n`;
        if (options.basic.description && item.description) md += `> ${item.description}\n\n`;
        
        const tagLines: string[] = [];
        for (const [dim, vals] of Object.entries(item.tags as Record<string, string[]>)) {
             if (vals && vals.length > 0) {
                 tagLines.push(`**${dim}**: ${vals.join(', ')}`);
             }
        }
        if (tagLines.length > 0) md += `### 标签\n${tagLines.join('\n')}\n\n`;

        for (const [dtype, content] of Object.entries(item.docs as Record<string, string>)) {
            if (content && content.trim()) {
                md += `### ${dtype}\n\n${content}\n\n`;
            }
        }
        return md + '---\n';
    }).join('\n');
};

const handleExportClipboard = async () => {
    savePreferences();
    loading.value = true;
    progress.value = 0;
    try {
        const data = await fetchData();
        let content = '';
        if (formats.json && !formats.md) {
            content = JSON.stringify(data, null, 2);
        } else {
            // Default to MD for clipboard if MD is checked or both are checked
            // Or if only Basic/Tags are selected?
            // User requirement: "Export to clipboard" -> usually text.
            content = generateMarkdown(data);
        }
        
        await navigator.clipboard.writeText(content);
        alert('已复制到剪贴板');
        close();
    } catch (e) {
        console.error(e);
        alert('导出失败');
    } finally {
        loading.value = false;
    }
};

const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const handleExportFile = async () => {
    savePreferences();
    loading.value = true;
    progress.value = 0;
    try {
        const data = await fetchData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

        // Download JSON
        if (formats.json) {
            downloadFile(`models_export_${timestamp}.json`, JSON.stringify(data, null, 2), 'application/json');
        }

        // Download MD
        if (formats.md) {
            downloadFile(`models_export_${timestamp}.md`, generateMarkdown(data), 'text/markdown');
        }

        close();
    } catch (e) {
        console.error(e);
        alert('导出失败');
    } finally {
        loading.value = false;
    }
};

</script>
