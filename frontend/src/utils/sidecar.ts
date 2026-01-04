/**
 * 后端服务管理
 * 
 * 功能：
 * 1. 检测后端是否在线（健康检查）
 * 2. 如果不在线，使用 Tauri shell 启动 Node.js 后端
 * 
 * 路径策略：
 * - 开发模式：使用系统 node，后端在 ../backend
 * - 生产模式：使用同级 node/node.exe，后端在同级 backend/
 */

import { Command } from '@tauri-apps/plugin-shell';

const BACKEND_URL = 'http://localhost:31888';
const HEALTH_ENDPOINT = `${BACKEND_URL}/health`;
const EXPECTED_APP_ID = 'mindmodel-backend';

/**
 * 检查后端是否在线且是正确的应用
 */
async function checkBackendHealth(): Promise<boolean> {
    try {
        const response = await fetch(HEALTH_ENDPOINT, {
            method: 'GET',
            signal: AbortSignal.timeout(2000) // 2秒超时
        });

        if (!response.ok) return false;

        const data = await response.json();
        return data.status === 'ok' && data.app === EXPECTED_APP_ID;
    } catch (error) {
        console.log('[Backend] Health check failed:', error);
        return false;
    }
}

/**
 * 启动后端 Node.js 进程
 * 
 * 策略：
 * 1. 先尝试使用同级 node/node.exe（生产模式/Launcher释放后）
 * 2. 如果不存在，使用系统 node（开发模式）
 */
async function spawnBackend(): Promise<void> {
    try {
        // 生产模式：检测是否有同级 node（由 Launcher 释放）
        // 开发模式：直接使用系统 node
        // 
        // Tauri shell 的工作目录是 exe 所在目录
        // 所以 backend/ 和 node/ 都在同级或上级

        // 尝试启动 - Tauri 的 cwd 会基于 exe 位置
        const command = Command.create('node', ['backend/dist/index.js']);

        const child = await command.spawn();
        console.log('[Backend] Node.js backend spawned with PID:', child.pid);

        command.stdout.on('data', (line) => console.log(`[Backend]: ${line}`));
        command.stderr.on('data', (line) => console.error(`[Backend Error]: ${line}`));

        // 等待后端启动完成（最多等待 10 秒）
        for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (await checkBackendHealth()) {
                console.log('[Backend] Backend is now online');
                return;
            }
        }

        console.warn('[Backend] Backend started but health check still failing');
    } catch (error) {
        console.error('[Backend] Failed to spawn backend:', error);
        // 不抛出异常，让应用继续运行（用户可能手动启动了后端）
        console.warn('[Backend] Continuing without auto-starting backend. Please start it manually.');
    }
}

/**
 * 确保后端服务运行
 * - 如果已在线，直接返回
 * - 如果不在线，尝试启动后端
 */
export async function ensureBackendRunning(): Promise<void> {
    console.log('[Backend] Checking if backend is running...');

    if (await checkBackendHealth()) {
        console.log('[Backend] Backend is already running');
        return;
    }

    console.log('[Backend] Backend not running, attempting to start...');
    await spawnBackend();
}

// 保留旧函数名兼容性
export const startServer = ensureBackendRunning;
