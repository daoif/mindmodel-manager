# MindModel Manager - 软件设计文档 (SDD)

> 思维模型提示词管理工具 MVP 版本

---

## 1. 项目概述

### 1.1 核心价值
在遇到问题时，快速定位并提取正确的思维模型提示词。

### 1.2 目标用户
个人使用，无需多用户/权限功能。

### 1.3 技术栈
- **前端**：Vue 3 + TypeScript + Tailwind CSS
- **后端**：Node.js (Express)
- **数据库**：SQLite3（存储结构化元数据）
- **文件存储**：Markdown文件（存储子文档内容）

---

## 2. 功能需求

### 2.1 MVP必须实现

| 功能 | 描述 |
|-----|------|
| 树形导航 | 左侧导航树，支持多维度自动分组（场景、类型等） |
| 模型列表 | 展示当前节点下的思维模型卡片 |
| 模型详情 | 查看模型的元数据和子文档 |
| 子文档管理 | 每个模型可有多个子文档（介绍、提示词等） |
| 一键复制 | 快速复制提示词内容 |
| CRUD | 创建、编辑、删除模型和子文档 |

### 2.2 MVP不做
- AI对话/工作流
- 用户登录/权限
- UI美化（基础可用即可）

---

## 3. 数据模型

### 3.1 思维模型 (MindModel)
```typescript
interface MindModel {
  id: string
  name: string
  description: string
  tags: Record<string, string[]>  // 每个维度可有多个值（如分类:["战略认知类","决策校准类"]）
  createdAt: string
  updatedAt: string
}
```

// 标签维度说明：
// - 场景：可多选（程序开发, 商业运营, 线上直播, 自我成长）
// - 阶段：可多选（洞察, 决策, 执行）
// - 类型：可多选（陪练, 内化, 产出）
// - 分类：可多选（问题拆解类, 复盘类, 项目迭代类, 目标管理类, 优先级类, 决策校准类, 战略认知类, 用户行为类, 沟通类）
```

### 3.2 子文档 (Document)
```typescript
interface Document {
  id: string
  modelId: string
  type: string
  content: string
  createdAt: string
  updatedAt: string
}
```

### 3.3 导航节点 (NavigationNode)
```typescript
interface NavigationNode {
  id: string
  name: string
  type: "auto" | "manual"
  rule: FilterRule | null
  children: NavigationNode[]
}
```

---

## 4. 存储架构

### 4.1 混合存储策略

| 数据类型 | 存储方式 | 说明 |
|---------|---------|------|
| 模型元数据 | SQLite3 | 结构化查询、标签筛选 |
| 标签维度配置 | SQLite3 | 可扩展的标签维度 |
| 文档类型配置 | SQLite3 | 可扩展的子文档类型 |
| 子文档内容 | Markdown文件 | 便于外部编辑和版本管理 |

### 4.2 SQLite3 表结构

```sql
CREATE TABLE models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE model_tags (
  model_id TEXT,
  dimension TEXT,
  value TEXT,
  PRIMARY KEY (model_id, dimension, value)
);

CREATE TABLE tag_dimensions (
  name TEXT PRIMARY KEY,
  display_order INTEGER
);

CREATE TABLE doc_types (
  name TEXT PRIMARY KEY,
  display_order INTEGER
);
```

### 4.3 文件存储结构

```
data/
├── mindmodel.db
└── docs/
    └── {model-id}/
        ├── 介绍.md
        ├── 使用场景.md
        ├── 陪练提示词.md
        ├── 内化提示词.md
        └── 产出提示词.md
```

---

## 5. API设计

### 5.1 模型相关

| 方法 | 路径 | 描述 |
|-----|------|------|
| GET | /api/models | 获取模型列表（支持筛选） |
| GET | /api/models/:id | 获取单个模型详情 |
| POST | /api/models | 创建模型 |
| PUT | /api/models/:id | 更新模型 |
| DELETE | /api/models/:id | 删除模型 |

### 5.2 子文档相关

| 方法 | 路径 | 描述 |
|-----|------|------|
| GET | /api/models/:id/docs | 获取模型的子文档列表 |
| GET | /api/models/:id/docs/:type | 获取特定类型子文档内容 |
| PUT | /api/models/:id/docs/:type | 保存子文档内容 |
| DELETE | /api/models/:id/docs/:type | 删除子文档 |

### 5.3 配置相关

| 方法 | 路径 | 描述 |
|-----|------|------|
| GET | /api/config/tag-dimensions | 获取标签维度列表 |
| GET | /api/config/doc-types | 获取文档类型列表 |
| POST | /api/config/tag-dimensions | 添加标签维度 |
| POST | /api/config/doc-types | 添加文档类型 |

### 5.4 导航树

| 方法 | 路径 | 描述 |
|-----|------|------|
| GET | /api/navigation | 获取导航树（自动生成） |

---

## 6. UI布局

### 6.1 整体结构

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                 │
├───────────────┬─────────────────────────────────────────┤
│  导航树       │  内容区                                  │
│  - 全部       │  ┌─────────────────────────────────────┐│
│  - 场景       │  │  模型卡片列表 / 模型详情             ││
│    - Dev      │  │                                     ││
│    - Biz      │  │                                     ││
│    - Live     │  │                                     ││
│    - Self     │  │                                     ││
│  - 类型       │  │                                     ││
│    - 陪练     │  └─────────────────────────────────────┘│
│    - 内化     │                                         │
│    - 产出     │                                         │
└───────────────┴─────────────────────────────────────────┘
```

### 6.2 核心视图

| 视图 | 触发条件 | 内容 |
|-----|---------|------|
| 列表视图 | 点击导航节点 | 模型卡片网格 |
| 详情视图 | 点击模型卡片 | 模型元数据 + 子文档Tab |
| 编辑视图 | 点击编辑按钮 | 表单编辑模型/子文档 |

---

## 7. 项目结构

```
mindmodel-manager/
├── frontend/                 # Vue 3 前端
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── api/
│   │   └── types/
│   └── package.json
├── backend/                  # Node.js 后端
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── db/
│   │   └── utils/
│   └── package.json
└── data/                     # 数据存储
    ├── mindmodel.db
    └── docs/
```

---

## 8. MVP初始数据

系统启动时自动初始化以下配置：

### 8.1 标签维度
- 场景：程序开发, 商业运营, 线上直播, 自我成长
- 阶段：洞察, 决策, 执行
- 类型：陪练, 内化, 产出
- 分类：问题拆解类, 复盘类, 项目迭代类, 目标管理类, 优先级类, 决策校准类, 战略认知类, 用户行为类, 沟通类

### 8.2 文档类型
- 介绍
- 使用场景
- 陪练提示词
- 内化提示词
- 产出提示词

---

## 9. 验收标准

MVP完成的标准：
1. 可以浏览导航树，切换不同分组
2. 可以查看模型列表和详情
3. 可以创建/编辑/删除模型
4. 可以管理子文档内容
5. 可以一键复制提示词
