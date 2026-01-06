# MindModel API 参考

> 后端服务运行在 `http://127.0.0.1:31888`

---

## 注意事项

### 绕过代理（PowerShell）

由于系统可能配置了代理，直接使用 `Invoke-WebRequest` 可能会失败。使用以下方式绕过代理：

```powershell
# 使用 WebClient 绕过代理
$webClient = New-Object System.Net.WebClient
$webClient.Proxy = [System.Net.GlobalProxySelection]::GetEmptyWebProxy()

# GET 请求
$webClient.DownloadString("http://127.0.0.1:31888/api/models")

# POST 请求
$webClient.Headers.Add("Content-Type", "application/json")
$body = '{"name":"模型名称","description":"描述","tags":{"分类":["类别"],"场景":["场景"],"阶段":["阶段"],"类型":["类型"]}}'
$webClient.UploadString("http://127.0.0.1:31888/api/models", "POST", $body)
```

---

## 模型 API

### 获取所有模型
```
GET /api/models
```

### 获取单个模型
```
GET /api/models/:id
```

### 创建模型
```
POST /api/models
Content-Type: application/json

{
  "name": "模型名称",
  "description": "一句话描述",
  "tags": {
    "分类": ["分类名称"],
    "场景": ["Dev", "Biz", "Live", "Self"],
    "阶段": ["洞察", "决策", "执行"],
    "类型": ["陪练", "内化", "产出"]
  }
}
```

### 更新模型
```
PUT /api/models/:id
```

### 部分更新标签
```
PUT /api/models/:id/tags
```

### 删除模型
```
DELETE /api/models/:id
```

---

## 子文档 API

### 获取模型的子文档列表
```
GET /api/models/:id/docs
```

### 获取特定子文档
```
GET /api/models/:id/docs/:type
```

### 保存子文档
```
PUT /api/models/:id/docs/:type
Content-Type: application/json

{
  "content": "Markdown 内容"
}
```

### 删除子文档
```
DELETE /api/models/:id/docs/:type
```

---

## 标签值管理 API

### 获取所有标签值统计
```
GET /api/config/tag-values

响应格式：
[
  {
    "dimension": "场景",
    "value": "创业",
    "model_count": 5,       // 实际关联的模型数
    "orphan_count": 0       // 孤立记录数（模型已删除）
  }
]
```

### 获取使用特定标签的模型列表
```
GET /api/config/tag-values/:dimension/:value/models
```

### 删除标签值
```
DELETE /api/config/tag-values/:dimension/:value

注意：只有 model_count=0 时才能删除，会同时清理孤立记录
```
