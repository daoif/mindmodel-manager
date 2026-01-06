<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">

      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="close"></div>

      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <div class="inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4" id="modal-title">
                导入模型
              </h3>

              <!-- Step 1: Input -->
              <div v-if="step === 'input'">
                  <div class="flex flex-wrap gap-2 mb-4">
                      <button @click="copyTemplate('json')" class="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700">
                          复制 JSON 模板
                      </button>
                      <button @click="copyTemplate('md')" class="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 text-gray-700">
                          复制 MD 模板
                      </button>
                      
                      <label class="px-3 py-1 text-xs border border-indigo-300 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer">
                          选择导入文件
                          <input type="file" class="hidden" accept=".json,.md,.txt" @change="handleFileSelect">
                      </label>
                  </div>

                  <textarea
                    v-model="importContent"
                    rows="15"
                    class="w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md p-2 border font-mono text-xs"
                    placeholder="在此粘贴 JSON 或 Markdown 内容..."
                  ></textarea>
              </div>

              <!-- Step 2: Confirmation / Preview -->
              <div v-else-if="step === 'confirm'" class="max-h-[60vh] overflow-y-auto">
                  <div class="grid grid-cols-4 gap-4 mb-6 text-center">
                      <div class="p-2 bg-gray-50 rounded">
                          <div class="text-xs text-gray-500">发现模型</div>
                          <div class="text-xl font-bold">{{ parseStats.total }}</div>
                      </div>
                      <div class="p-2 bg-green-50 rounded text-green-700">
                          <div class="text-xs">有效待导入</div>
                          <div class="text-xl font-bold">{{ parseStats.valid }}</div>
                      </div>
                      <div class="p-2 bg-yellow-50 rounded text-yellow-700">
                          <div class="text-xs">已存在 (跳过)</div>
                          <div class="text-xl font-bold">{{ parseStats.exist }}</div>
                      </div>
                      <div class="p-2 bg-orange-50 rounded text-orange-700">
                          <div class="text-xs">内部重复 (跳过)</div>
                          <div class="text-xl font-bold">{{ parseStats.internalDupe }}</div>
                      </div>
                  </div>

                  <div v-if="parsedItems.length > 0" class="space-y-4">
                      <div v-if="validItems.length > 0">
                          <h4 class="text-sm font-medium text-green-700 mb-2">即将导入 ({{ validItems.length }})</h4>
                          <ul class="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto list-disc pl-5">
                              <li v-for="item in validItems" :key="item.name">{{ item.name }}</li>
                          </ul>
                      </div>

                      <div v-if="skippedItems.length > 0">
                          <h4 class="text-sm font-medium text-red-700 mb-2">将跳过 ({{ skippedItems.length }})</h4>
                          <ul class="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                              <li v-for="item in skippedItems" :key="item.name + item.reason" class="flex justify-between">
                                  <span>{{ item.name }}</span>
                                  <span class="text-gray-400 italic">{{ item.reason }}</span>
                              </li>
                          </ul>
                      </div>
                  </div>
                  <div v-else class="text-center py-8 text-gray-500">
                      未解析到有效数据，请检查格式。
                  </div>
              </div>

              <!-- Step 3: Progress -->
              <div v-else-if="step === 'progress'">
                  <div class="text-center py-8">
                       <h4 class="text-lg font-medium text-gray-900 mb-4">正在导入...</h4>
                       <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                          <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" :style="{ width: progress + '%' }"></div>
                       </div>
                       <p class="text-sm text-gray-500">{{ completedCount }} / {{ parseStats.valid }}</p>
                  </div>
              </div>

            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <template v-if="step === 'input'">
              <button
                type="button"
                @click="parseAndCheck"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                :disabled="!importContent.trim()"
                :class="{'opacity-50 cursor-not-allowed': !importContent.trim()}"
              >
                解析内容
              </button>
              <button
                type="button"
                @click="close"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                取消
              </button>
          </template>

          <template v-else-if="step === 'confirm'">
              <button
                type="button"
                @click="executeImport"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                :disabled="parseStats.valid === 0"
                :class="{'opacity-50 cursor-not-allowed': parseStats.valid === 0}"
              >
                确认导入
              </button>
              <button
                type="button"
                @click="step = 'input'"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                返回编辑
              </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMainStore } from '../stores';
import { modelApi } from '../api';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'imported']);

const store = useMainStore();
const step = ref<'input' | 'confirm' | 'progress'>('input');
const importContent = ref('');

const isOpen = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const close = () => {
    isOpen.value = false;
    step.value = 'input';
    importContent.value = '';
    parsedItems.value = [];
};

// --- Templates ---
const templates = {
    json: `[
  {
    "name": "示例模型 1",
    "description": "这是第一个模型的描述",
    "tags": {
      "分类": ["AI"],
      "状态": ["草稿"]
    },
    "docs": {
        "摘要": "这是文档内容..."
    }
  },
  {
    "name": "示例模型 2",
    "description": "这是第二个模型的描述",
    "tags": {
      "分类": ["测试"],
      "状态": ["已发布"]
    },
    "docs": {
        "摘要": "第二个模型的文档内容..."
    }
  }
]`,
    md: `# 示例模型 1

> 这是第一个模型的描述

### 标签
**分类**: AI
**状态**: 草稿

### 摘要

这是文档内容...

---

# 示例模型 2

> 这是第二个模型的描述

### 标签
**分类**: 测试
**状态**: 已发布

### 摘要

第二个模型的文档内容...
`
};

const copyTemplate = async (type: 'json' | 'md') => {
    await navigator.clipboard.writeText(templates[type]);
    alert('模板已复制到剪贴板');
};

// --- File Handling ---
const handleFileSelect = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
            importContent.value = text;
        }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again if needed
    (event.target as HTMLInputElement).value = '';
};

// --- Parsing Logic ---
interface ParsedItem {
    name: string;
    description: string;
    tags: Record<string, string[]>;
    docs: Record<string, string>;
    status?: 'valid' | 'exist' | 'internal_dupe';
}

const parsedItems = ref<ParsedItem[]>([]);

const parseJSON = (text: string): ParsedItem[] => {
    try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('Root must be an array');
        return data.map((item: any) => ({
            name: item.name || '',
            description: item.description || '',
            tags: item.tags || {},
            docs: item.docs || {}
        })).filter(i => i.name); // Filter out nameless
    } catch (e) {
        console.error('JSON Parse Error', e);
        alert('JSON 解析失败: 格式错误');
        return [];
    }
};

const parseMarkdown = (text: string): ParsedItem[] => {
    const items: ParsedItem[] = [];
    // Split by horizontal rule '---', but only if it looks like a separator between models
    // Since exporting uses "---" at the end of each model.
    const chunks = text.split(/^---$/gm).map(s => s.trim()).filter(s => s);
    
    for (const chunk of chunks) {
        const lines = chunk.split('\n');
        let name = '';
        let description = '';
        const tags: Record<string, string[]> = {};
        const docs: Record<string, string> = {};
        
        let currentSection: 'header' | 'tags' | 'doc' | null = 'header';
        let currentDocType = '';
        let currentDocContent: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Name detection: # Name
            if (line.startsWith('# ')) {
                // If we hit a new name header inside a chunk (shouldn't happen if split correctly, but safeguard)
                // Actually, our chunks might just be one model.
                // Assuming one model per chunk starting with #
                if (!name) {
                    name = line.substring(2).trim();
                    continue;
                }
            }

            // Description: > Desc
            if (line.startsWith('> ') && currentSection === 'header' && !description) {
                // Collect multi-line blockquotes? For now just simple single/multi line
                 description = line.substring(2).trim();
                 // Check next lines for more quote
                 continue;
            }

            // Tags Section
            if (line.startsWith('### 标签') || line.startsWith('### Tags')) {
                currentSection = 'tags';
                continue;
            }

            // Doc Section detection (Match known doc types or just ### Something)
            if (line.startsWith('### ') && !line.startsWith('### 标签') && !line.startsWith('### Tags')) {
                // Save previous doc if exists
                if (currentDocType) {
                    docs[currentDocType] = currentDocContent.join('\n').trim();
                }
                currentDocType = line.substring(4).trim();
                currentDocContent = [];
                currentSection = 'doc';
                continue;
            }

            // Content processing based on section
            if (currentSection === 'tags') {
                // **Dim**: Val, Val2
                const match = line.match(/\*\*(.+?)\*\*:(.+)/);
                if (match) {
                    const dim = match[1].trim();
                    const vals = match[2].split(/,|，/).map(v => v.trim()).filter(v => v);
                    tags[dim] = vals;
                }
            } else if (currentSection === 'doc') {
                currentDocContent.push(lines[i]); // Keep original line for formatting (don't trim)
            }
        }
        
        // Save last doc
        if (currentDocType) {
            docs[currentDocType] = currentDocContent.join('\n').trim();
        }

        if (name) {
            items.push({ name, description, tags, docs });
        }
    }
    return items;
};

const parseAndCheck = () => {
    let items: ParsedItem[] = [];
    const text = importContent.value.trim();
    if (text.startsWith('[') || text.startsWith('{')) {
        items = parseJSON(text);
    } else {
        items = parseMarkdown(text);
    }

    if (items.length === 0) {
        alert('未找到有效数据，请检查格式');
        return;
    }

    // Check Duplicates
    const seenNames = new Set<string>();
    
    items.forEach(item => {
        // Global check
        const exists = store.models.some(m => m.name === item.name);
        if (exists) {
            item.status = 'exist';
        } 
        // Internal check
        else if (seenNames.has(item.name)) {
            item.status = 'internal_dupe';
        } 
        else {
            item.status = 'valid';
            seenNames.add(item.name);
        }
    });

    parsedItems.value = items;
    step.value = 'confirm';
};

// --- Stats & confirm ---
const parseStats = computed(() => {
    return {
        total: parsedItems.value.length,
        valid: parsedItems.value.filter(i => i.status === 'valid').length,
        exist: parsedItems.value.filter(i => i.status === 'exist').length,
        internalDupe: parsedItems.value.filter(i => i.status === 'internal_dupe').length,
    };
});

const validItems = computed(() => parsedItems.value.filter(i => i.status === 'valid'));
const skippedItems = computed(() => parsedItems.value.filter(i => i.status !== 'valid').map(i => ({
    name: i.name,
    reason: i.status === 'exist' ? '已存在' : '内部重复'
})));

// --- Execution ---
const progress = ref(0);
const completedCount = ref(0);

const executeImport = async () => {
    step.value = 'progress';
    const total = validItems.value.length;
    completedCount.value = 0;
    progress.value = 0;

    for (const item of validItems.value) {
        try {
            const payload = {
                name: item.name,
                description: item.description,
                tags: item.tags
            };
            
            // Create Model
            const created = await modelApi.create(payload);
            
            // Save docs
            for (const [dtype, content] of Object.entries(item.docs)) {
                if (content && content.trim()) {
                    await modelApi.saveDocContent(created.id, dtype, content);
                }
            }
        } catch (e) {
            console.error(`Failed to import ${item.name}`, e);
        } finally {
            completedCount.value++;
            progress.value = Math.floor((completedCount.value / total) * 100);
        }
    }

    // Finish
    if (progress.value === 100) {
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    await store.fetchModels();
    emit('imported');
    close();
    alert(`导入完成, 成功导入 ${completedCount.value} 个模型`);
};

</script>
