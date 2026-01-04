# 开发者指南 (Developer Guide)

## 1. 环境准备

要开发 MindModel，你需要安装：
*   **Node.js**: v18 或更高版本。
*   **Rust**: 推荐使用 rustup 安装最新稳定版。
*   **C++ Build Tools**: Windows 上的 Visual Studio Build Tools (勾选 "Desktop development with C++")。

## 2. 项目结构

```
E:\code\mindmodel\
├── frontend/          # Tauri + Vue 3 前端代码
│   ├── src-tauri/     # Rust 主进程代码
│   └── src/           # Vue 页面与逻辑
├── backend/           # Node.js 后端服务代码
├── launcher/          # Rust 启动器代码 (用于分发)
├── node/              # (构建后) 存放 Node.js 可执行文件
├── data/              # (运行时) 存放数据库和用户数据
└── process_build.ps1  #构建脚本
```

## 3. 开发流程

### 3.1 启动开发环境

你需要同时运行前端和后端的开发服务。

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
# 后端将监听 31888 端口
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run tauri dev
# 这将启动 Vite 开发服务器和 Tauri 窗口
```

### 3.2 调试技巧

*   **前端调试**: 在 Tauri 窗口中按 `F12` 打开开发者工具 (WebView DevTools)。
*   **后端调试**: 后端日志会直接输出到 Terminal 1 的控制台。
*   **数据库查看**: 推荐使用 SQLiteStudio 或 DBeaver 打开 `backend/db/mindmodel.db` (开发模式下通常位于 backend 目录下)。

## 4. 常见问题

*   **后端未启动**: 检查 `31888` 端口是否被占用。开发模式下，前端会尝试连接该端口，如果失败会提示。
*   **构建报错**: 确保 PowerShell 版本 > 7，且已安装 Rust targets (`x86_64-pc-windows-msvc`)。
