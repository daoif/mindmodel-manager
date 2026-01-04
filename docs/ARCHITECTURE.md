# MindModel 架构文档 (Architecture)

## 1. 核心架构概述

MindModel 采用 **本地优先 (Local-First)** 的桌面应用架构，结合了现代 Web 前端的交互体验与 Rust/Node.js 的本地能力。

### 1.1 顶层设计
项目主要由三部分组成：
*   **Frontend (UI 层)**: 基于 Tauri + Vue 3，提供用户界面。
*   **Backend (数据层)**: 这是一个 Node.js 服务，作为 Sidecar 运行，负责 SQLite 数据库操作和业务逻辑。
*   **Launcher (启动器)**: 一个 Rust 编写的引导程序，解决环境依赖分发问题。

```mermaid
graph TD
    Launcher[MindModelLauncher.exe] -->|提取运行时| Runtime[Runtime (node/ & backend/)]
    Launcher -->|启动| App[MindModel.exe (Frontend)]
    App -->|Spawn| Sidecar[Node.js Backend]
    Sidecar -->|读写| DB[(SQLite Database)]
```

## 2. 模块详解

### 2.1 Launcher (启动器)
*   **职责**: 负责“开箱即用”体验。它包含压缩后的 Node.js 运行时和 compiled backend。
*   **流程**: 用户运行 Launcher -> 检查是否已解压 -> 解压必要文件 -> 启动主程序 `MindModel.exe`。

### 2.2 Frontend (MindModel.exe)
*   **技术栈**: Tauri (Rust), Vue 3, TypeScript, TailwindCSS.
*   **进程管理**: 主程序启动时，通过 `sidecar.ts` 工具类，使用 Tauri Command API 启动 Node.js 后端子进程。
*   **生命周期**: 主窗口关闭 -> Tauri 自动 Kill 子进程 -> 应用退出。

### 2.3 Backend (Node.js Sidecar)
*   **技术栈**: Express, Better-SQLite3.
*   **端口**: 默认监听 `31888`。
*   **通信**: 前端通过 HTTP 请求与后端交互。

## 3. 数据存储 (Data Persistence)

项目严格遵循 **Portable (便携)** 原则。

*   **数据库**: `data/mindmodel.db` (SQLite)
*   **配置**: `data/config.json`
*   **位置**: 所有数据均存储在应用根目录下的 `data/` 文件夹中。这使得整个应用文件夹可以被拷贝到任何电脑上直接运行，且保留所有用户数据。
