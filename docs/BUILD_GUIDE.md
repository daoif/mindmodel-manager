# MindModel 构建指南 (Build Guide)

本文档旨在指导开发者（及 AI 助手）如何编译和构建 MindModel 项目。

## 1. 快速构建 (Quick Start)

本项目提供了一个自动化 PowerShell 脚本，用于一键完成构建、文件移动和目录准备。该脚本是**便携的**，可在任何克隆了本仓库的 Windows 机器上运行。

### 运行构建脚本
在项目根目录下，运行以下命令：

```powershell
.\process_build.ps1
```

**脚本功能：**
1.  自动定位项目根目录（基于脚本所在位置）。
2.  进入 `frontend` 目录执行 `npx tauri build`（包含前端构建和 Rust 后端构建）。
3.  检查构建产物。
4.  将最终生成的 `mindmodel.exe` 复制到项目根目录。
5.  确保根目录下存在 portable 模式所需的 `data` 文件夹。

---

## 2. 详细构建步骤 (Manual Steps)

如果你需要手动分步构建，或进行调试，请参考以下流程。

### 前置条件
*   Node.js (建议 v18+)
*   Rust (最新的 stable版本)
*   VS C++ Build Tools (Windows 开发必备)

### 第一步：构建后端 (Backend)
后端目前被配置为 Tauri 的 Sidecar。虽然 Tauri 构建流程会自动处理，但了解其手动步骤有助于调试。
(注意：当前通过 `pkg` 打包，脚本集成在 frontend 的 tauri build 流程中，由 `beforeBuildCommand` 触发或手动管理)

### 第二步：Tauri 构建 (Frontend & Core)
进入前端目录并启动构建：

```bash
cd frontend
# 安装依赖 (如果尚未安装)
npm install

# 仅构建前端 (Vite)
npm run build

# 构建 Tauri 应用 (Release)
# 这会自动触发前端 build，并编译 Rust 代码
npx tauri build
```

**关于增量编译 (Incremental Compilation):**
*   **Rust (Cargo)**: Cargo 默认支持增量编译。当你再次运行 `npx tauri build` 时，只有修改过的 Rust 文件（及其依赖链）会被重新编译。未修改的依赖库（crates）会直接使用缓存。
*   **Debug vs Release**: 
    *   `npx tauri dev`: 使用 Debug 模式，编译速度快，但运行性能较低，文件体积大。
    *   `npx tauri build`: 使用 Release 模式，开启了 LTO 和优化，编译速度较慢，但产物体积小，性能最佳。

### 第三步：产物位置
构建完成后，原始产物位于：
`frontend/src-tauri/target/release/mindmodel.exe`

为了实现 Portable 模式（便携版），需要将其和 `data` 目录放在一起。

---

## 3. 给 AI 代理的提示 (Prompt for AI Agents)

如果你是协助开发的 AI：
*   **优先使用** `.\process_build.ps1` 进行构建验证，因为它是项目标准化的构建入口。
*   **不要硬编码路径**。始终使用相对路径或动态获取的根目录。
*   如果遇到 Rust 编译错误，尝试先运行 `cargo check` (在 `src-tauri` 目录下) 来快速获取错误信息，比完整构建要快得多。
*   注意 `data` 目录是运行时必要的，如果缺失可能会导致应用启动后表现异常（尽管脚本会自动创建它）。
