# MindModel Manager

MindModel Manager 是一个用于管理和可视化思维模型、知识图谱及相关文档的本地应用程序。它结合了现代化的前端界面和高效的本地后端服务，旨在帮助用户构建个人的知识体系。

## ✨ 功能特性

- **思维模型管理**: 创建、编辑和组织各种思维模型。
- **多维度筛选**: 通过标签、关键词和自定义维度快速定位模型。
- **本地优先**: 所有数据存储在本地，确保数据安全与隐私。
- **双端架构**:
  - **前端**: 基于 Vue 3 + TypeScript + TailwindCSS 构建的现代化 UI。
  - **后端**: 独立的 Node.js 服务，处理数据持久化和业务逻辑。
- **便携式设计**: 通过 Launcher 实现一键启动，无需繁琐的环境配置。

## 📸 应用截图

### 主界面
![主界面预览](image/main_ui_placeholder.png)
*主界面展示了模型列表和多维度筛选功能。*

### 列表视图
![列表视图预览](image/list_view_placeholder.png)
*高效的列表管理视图。*

### 编辑器
![编辑器预览](image/editor_placeholder.png)
*功能丰富的文档/模型编辑器。*

## 📦 打包与构建

本项目包含自动化构建脚本，可生成便携式的 Windows 可执行文件。

### 前置要求
- Node.js (建议 v18+)
- Rust (用于构建 Launcher 和 Tauri)
- PowerShell 7+

### 构建步骤
在项目根目录下运行以下 PowerShell 脚本：

```powershell
./process_build.ps1
```

该脚本将自动执行以下操作：
1. 构建前端 (Frontend)。
2. 构建后端 (Backend)。
3. 打包 Node.js 运行时。
4. 编译 Launcher 启动器。
5. 生成最终的 `MindModelLauncher.exe`。

## 🚀 使用说明

### 启动应用
构建完成后，直接运行根目录下的 **`MindModelLauncher.exe`** 即可。

- **首次运行**: Launcher 会自动解压必要的运行时文件到 `node/` 和 `backend/` 目录。
- **后续运行**: 直接启动应用，无需再次解压。
- **自动退出**: 关闭主窗口时，后台服务会自动安全关闭。

### 开发模式
如果您是开发者，可以分别启动前后端进行调试：

1. **安装依赖**:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
2. **启动开发服务器**:
   ```bash
   # 在 frontend 目录下
   npm run tauri dev
   ```
