# MindModel 构建指南 (Build Guide)

本文档旨在指导开发者如何编译和构建 MindModel 项目。本项目提供了两个 PowerShell 脚本，分别用于不同的构建场景。

## 1. 完整发布构建 (Full Release Build)

**脚本**: `.\build_launcher.ps1`

该脚本用于生成最终分发的 **`MindModelLauncher.exe`**。它包含所有必要的运行时依赖（Node.js, 后端代码, 主程序），适合分发给最终用户。

### 运行方式
```powershell
./build_launcher.ps1
```

### 执行流程
1.  **Backend Build**: 编译后端 TypeScript代码。
2.  **Frontend Build**: 编译前端和 Tauri 主进程 (`mindmodel.exe`)。
3.  **Resource Prep**: 下载/使用缓存的 Node.js，收集所有资源到 `resources/` 目录。
4.  **Compression**: 将资源压缩为 `resources.zip`。
5.  **Launcher Build**: 编译 Launcher (Rust)，生成的 exe 会在运行时解压这些资源。
6.  **Output**: 生成 `MindModelLauncher.exe`。

---

## 2. 快速开发构建 (Fast Dev Build)

**脚本**: `.\process_build.ps1`

该脚本仅更新根目录下的 **`MindModel.exe`** 和后端代码，**不**重新打包 Node.js 和 Launcher。适合开发者在日常开发中快速验证 Release 版本的行为。

### 运行方式
```powershell
./process_build.ps1
```

### 执行流程
1.  **Backend Build**: 编译后端 TypeScript。
2.  **Frontend Build**: 编译 Tauri 主程序。
3.  **Update**: 将最新的 `mindmodel.exe` 复制到项目根目录。
4.  **Setup**: 确保 `data/` 目录存在。
5.  **注意**: 此脚本假设你已经有环境（例如通过 Launcher 首次运行过，或手动配置了 node/ 目录），因为它不包含 Node.js 运行时。

---

## 3. 验证构建

构建完成后，你会看到根目录多出了 `MindModelLauncher.exe`。

1.  **清理环境**: 模拟新用户环境，你可以创建一个新的空文件夹，只把 `MindModelLauncher.exe` 复制过去。
2.  **首次运行**: 双击运行 Launcher。它应该会“吐出” `MindModel.exe`, `backend/`, `node/` 等文件。
3.  **结果确认**: 应用应该自动启动，且能正常读写数据（此时会在同级生成 `data/` 目录）。

## 3. 注意事项
*   **网络问题**: 构建过程中需要下载 Rust Crates 和 NPM 包，请保持网络通畅。
*   **Node.js 版本**: 脚本会尝试打包你当前系统的 Node.js 可执行文件，确保你使用的是稳定版本 (LTS)。

