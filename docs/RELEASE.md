# 发版流程

## 前置条件
- 所有功能已测试验证通过
- 代码已在本地正常运行

## 发版步骤

### 1. 更新版本号
修改以下文件中的版本号：
- `frontend/src-tauri/tauri.conf.json`
- `frontend/src-tauri/Cargo.toml`
- `frontend/package.json`
- `backend/package.json`
- `launcher/Cargo.toml`

### 2. 重新打包
```powershell
.\build_launcher.ps1
```

### 3. 提交并推送
```powershell
git add -A
git commit -m "release: v0.x.x 版本发布"
git push origin master
```

### 4. 创建 Release
```powershell
git tag v0.x.x
git push origin v0.x.x
gh release create v0.x.x MindModelLauncher.exe --title "v0.x.x" --notes "版本说明"
```

## 注意事项
- 发版前务必在本地完整测试
- 版本号遵循语义化版本规范 (SemVer)
