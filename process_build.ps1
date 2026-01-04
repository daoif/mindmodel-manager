# 获取脚本所在目录（即项目根目录）
$ProjectRoot = $PSScriptRoot
Write-Host "Project Root: $ProjectRoot"

# 定义相对路径
$FrontendDir = Join-Path $ProjectRoot "frontend"
$TauriOutDir = Join-Path $FrontendDir "src-tauri\target\release"
$SourceExe = Join-Path $TauriOutDir "mindmodel.exe"
$DestExe = Join-Path $ProjectRoot "MindModel.exe"
$DataDir = Join-Path $ProjectRoot "data"

# 1. 检查环境
Write-Host "`n[1/4] Checking Environment..."
if (!(Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "Error: 'npm' not found. Please install Node.js."
    exit 1
}
if (!(Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Error "Error: 'cargo' not found. Please install Rust."
    exit 1
}

# 2. 编译后端 TypeScript
Write-Host "`n[2/5] Building Backend TypeScript..."
$BackendDir = Join-Path $ProjectRoot "backend"
Push-Location $BackendDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Error $_
    Pop-Location
    exit 1
}
Pop-Location

# 3. 构建 Tauri 应用
# 注意：Tauri 的构建是增量的。如果 Rust 代码没有改变，Cargo 不会重新编译未修改的 crate。
# 前端 Vite 构建也是如此，但通常 npm run build 会重新构建 dist。
Write-Host "`n[2/4] Building Tauri Application (Release Mode)..."
Push-Location $FrontendDir
try {
    # 使用 cmd /c 运行 npx 以避免 PowerShell 执行策略问题或路径问题
    cmd /c "npx tauri build"
    if ($LASTEXITCODE -ne 0) {
        throw "Tauri build command failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Error $_
    Pop-Location
    exit 1
}
Pop-Location

# 4. 检查构建产物
Write-Host "`n[4/5] Verifying Build Artifact..."
if (!(Test-Path $SourceExe)) {
    Write-Error "Error: Build artifact not found at: $SourceExe"
    exit 1
}

# 5. 移动产物与准备环境
Write-Host "`n[5/5] Finalizing..."

# 在复制之前关闭可能正在运行的进程
$processNames = @("MindModel")
foreach ($name in $processNames) {
    $proc = Get-Process -Name $name -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping process: $name..."
        Stop-Process -Name $name -Force
        Start-Sleep -Seconds 1  # 等待文件句柄释放
    }
}

Write-Host "Moving executable to root..."
Copy-Item -Force $SourceExe $DestExe

# 确保 data 目录存在
if (!(Test-Path $DataDir)) {
    New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
    Write-Host "Created data directory: $DataDir"
} else {
    Write-Host "Data directory exists: $DataDir"
}

Write-Host "`n==========================================="
Write-Host "Build Success!"
Write-Host "Main App : $DestExe"
Write-Host "Backend  : $BackendDir\dist (Node.js)"
Write-Host "Data Dir : $DataDir"
Write-Host "==========================================="
Write-Host "`nNote: Backend runs via Node.js, not as separate exe."
Write-Host "Run 'npm start' in backend/ first, or let Tauri auto-start it."
