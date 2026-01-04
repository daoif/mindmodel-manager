<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="mb-6">
        <SettingsNav />
        <h2 class="text-2xl font-bold text-gray-900">桌面端设置</h2>
    </div>

    <div class="space-y-6">

    <div v-if="!isTauri" class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <!-- Heroicon name: mini/exclamation-triangle -->
          <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">
            检测到您正在浏览器环境中运行。桌面端特定功能（自启动、全局快捷键等）仅在客户端中可用。
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">开机自启</h3>
        <div class="mt-2 text-sm text-gray-500">
          <p>设置应用是否随系统启动。</p>
        </div>
        <div class="mt-5">
          <button
            type="button"
            @click="toggleAutoStart"
            :class="[
              isAutoStartEnabled ? 'bg-indigo-600' : 'bg-gray-200',
              'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            ]"
            role="switch"
            :aria-checked="isAutoStartEnabled"
          >
            <span
              aria-hidden="true"
              :class="[
                isAutoStartEnabled ? 'translate-x-5' : 'translate-x-0',
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200'
              ]"
            ></span>
          </button>
          <span class="ml-3 text-sm font-medium text-gray-900">{{ isAutoStartEnabled ? '已启用' : '已禁用' }}</span>
        </div>
      </div>
    </div>

    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">全局快捷键</h3>
        <div class="mt-2 text-sm text-gray-500">
          <p>用于显示/隐藏应用窗口。点击下方输入框并按下组合键即可修改。</p>
        </div>
        <div class="mt-5">
             <div class="flex items-center gap-4">
               <div class="relative">
                   <input 
                    type="text" 
                    :value="isRecording ? '请按键...' : currentHotkey"
                    @keydown="handleKeyDown"
                    @focus="startRecording"
                    @blur="isRecording = false"
                    class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 cursor-pointer text-center font-mono"
                    readonly
                   />
               </div>
               
               <span 
                class="text-sm" 
                :class="isHotkeyRegistered ? 'text-green-600' : 'text-gray-500'"
               >
                 {{ isHotkeyRegistered ? '已生效' : '未注册' }}
               </span>
             </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import SettingsNav from '../components/SettingsNav.vue';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow } from '@tauri-apps/api/window';

const isAutoStartEnabled = ref(false);
const isHotkeyRegistered = ref(false);
// Default hotkey
const currentHotkey = ref('Alt+Space');
const isRecording = ref(false);

const isTauri = computed(() => !!window.__TAURI__);

async function checkStatus() {
  if (!isTauri.value) return;
  
  try {
    isAutoStartEnabled.value = await isEnabled();
  } catch (e) {
    console.error('Failed to check autostart status:', e);
  }

  // Load saved hotkey
  const saved = localStorage.getItem('global_hotkey');
  if (saved) {
      currentHotkey.value = saved;
  }

  try {
    const registered = await isRegistered(currentHotkey.value);
    isHotkeyRegistered.value = registered;
    if (!registered) {
        // Try to auto-register the (possibly saved) hotkey
        await registerHotkey();
    }
  } catch (e) {
    console.error('Failed to check hotkey status:', e);
  }
}

async function toggleAutoStart() {
  if (!isTauri.value) return;
  try {
    if (isAutoStartEnabled.value) {
      await disable();
      isAutoStartEnabled.value = false;
    } else {
      await enable();
      isAutoStartEnabled.value = true;
    }
  } catch (e) {
    console.error('Failed to toggle autostart:', e);
    alert('操作失败: ' + e);
  }
}

async function registerHotkey() {
    if (!isTauri.value) return;
    try {
        // Unregister any existing first to be safe (though API might handle it, logic is cleaner)
        // We might not know the *previous* key if we just loaded, but we can unregister current if it is registered
        if (await isRegistered(currentHotkey.value)) {
             await unregister(currentHotkey.value);
        }

        await register(currentHotkey.value, async (event) => {
            if (event.state === 'Pressed') {
                const win = getCurrentWindow();
                if (await win.isVisible()) {
                    await win.hide();
                } else {
                    await win.show();
                    await win.setFocus();
                }
            }
        });
        isHotkeyRegistered.value = true;
        localStorage.setItem('global_hotkey', currentHotkey.value);
    } catch (e) {
        console.error('Failed to register hotkey', e);
        alert('注册快捷键失败: ' + e);
        isHotkeyRegistered.value = false;
    }
}

async function startRecording() {
    isRecording.value = true;
    // We could add a global listener here or rely on the input's keydown
}

function handleKeyDown(e: KeyboardEvent) {
    if (!isRecording.value) return;
    e.preventDefault();
    e.stopPropagation();

    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Super'); // Command/Windows key

    // Don't register if only modifiers are pressed
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
    }

    let key = e.key.toUpperCase();
    if (key === ' ') key = 'Space';
    
    keys.push(key);
    
    const hotkeyString = keys.join('+');
    currentHotkey.value = hotkeyString;
    isRecording.value = false;
    
    // Auto re-register
    registerHotkey();
}

onMounted(() => {
  checkStatus();
});
</script>
