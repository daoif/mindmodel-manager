# MindModel 完整打包脚本
# 生成一个一键式 Launcher EXE
#
# 输出：MindModelLauncher.exe
# 包含：MindModel.exe、backend/、node/
#
# 用法：.\build_launcher.ps1

param(
    [switch]$SkipDownloadNode,
    [switch]$SkipBuildFrontend,
    [switch]$SkipBuildBackend
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$LauncherDir = Join-Path $ProjectRoot "launcher"
$TempDir = Join-Path $ProjectRoot "_launcher_temp"
$ResourcesZip = Join-Path $LauncherDir "resources.zip"

# Node.js 版本和下载地址
$NodeVersion = "20.10.0"
$NodeZipUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
# Node.js 缓存在项目根目录，避免重复下载
$NodeCacheDir = Join-Path $ProjectRoot "node"
$NodeZipFile = Join-Path $NodeCacheDir "node-v$NodeVersion-win-x64.zip"
$NodeExe = Join-Path $NodeCacheDir "node.exe"

Write-Host "=== MindModel Launcher Builder ===" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot"

# 创建临时目录
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

# 1. 构建后端
if (-not $SkipBuildBackend) {
    Write-Host "`n[1/6] Building Backend..." -ForegroundColor Yellow
    Push-Location (Join-Path $ProjectRoot "backend")
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
    Pop-Location
}

# 2. 构建前端 (Tauri)
if (-not $SkipBuildFrontend) {
    Write-Host "`n[2/6] Building Frontend (Tauri)..." -ForegroundColor Yellow
    
    # 关闭可能正在运行的 MindModel 进程
    $proc = Get-Process -Name "MindModel" -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping MindModel process..."
        Stop-Process -Name "MindModel" -Force
        Start-Sleep -Seconds 1
    }
    
    # 删除根目录的旧 MindModel.exe（避免 Launcher 释放时跳过）
    $OldExe = Join-Path $ProjectRoot "MindModel.exe"
    if (Test-Path $OldExe) {
        Write-Host "Removing old MindModel.exe..."
        Remove-Item -Force $OldExe
    }
    
    Push-Location (Join-Path $ProjectRoot "frontend")
    cmd /c "npx tauri build"
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
    Pop-Location
}

# 3. 下载/使用缓存的 Node.js
Write-Host "`n[3/6] Preparing Node.js v$NodeVersion..." -ForegroundColor Yellow
if (-not (Test-Path $NodeCacheDir)) {
    New-Item -ItemType Directory -Path $NodeCacheDir | Out-Null
}

if (-not $SkipDownloadNode -and -not (Test-Path $NodeExe)) {
    # 需要下载
    if (-not (Test-Path $NodeZipFile)) {
        Write-Host "Downloading Node.js..."
        Invoke-WebRequest -Uri $NodeZipUrl -OutFile $NodeZipFile
    }
    
    # 解压
    Write-Host "Extracting Node.js..."
    $NodeExtractDir = Join-Path $TempDir "node_extract"
    Expand-Archive -Path $NodeZipFile -DestinationPath $NodeExtractDir
    $NodeSourceDir = Get-ChildItem $NodeExtractDir | Select-Object -First 1
    
    # 复制 node.exe 到缓存目录
    Copy-Item (Join-Path $NodeSourceDir.FullName "node.exe") $NodeExe
    Write-Host "Node.js cached at: $NodeCacheDir"
} else {
    Write-Host "Using cached Node.js at: $NodeCacheDir"
}

# 4. 准备资源目录
Write-Host "`n[4/6] Preparing resources..." -ForegroundColor Yellow
$ResDir = Join-Path $TempDir "resources"
New-Item -ItemType Directory -Path $ResDir | Out-Null

# 复制前端 exe
$FrontendExe = Join-Path $ProjectRoot "frontend\src-tauri\target\release\mindmodel.exe"
Copy-Item $FrontendExe (Join-Path $ResDir "MindModel.exe")

# 复制后端 (只需要 dist 和 node_modules)
$BackendDest = Join-Path $ResDir "backend"
New-Item -ItemType Directory -Path $BackendDest | Out-Null
Copy-Item -Recurse (Join-Path $ProjectRoot "backend\dist") (Join-Path $BackendDest "dist")
Copy-Item -Recurse (Join-Path $ProjectRoot "backend\node_modules") (Join-Path $BackendDest "node_modules")
Copy-Item (Join-Path $ProjectRoot "backend\package.json") (Join-Path $BackendDest "package.json")



# 复制缓存的 Node.js
$NodeDest = Join-Path $ResDir "node"
New-Item -ItemType Directory -Path $NodeDest | Out-Null
Copy-Item $NodeExe (Join-Path $NodeDest "node.exe")

# 5. 创建 resources.zip
Write-Host "`n[5/6] Creating resources.zip..." -ForegroundColor Yellow
Push-Location $ResDir
Compress-Archive -Path "*" -DestinationPath $ResourcesZip -Force
Pop-Location

# 6. 构建 Launcher
Write-Host "`n[6/6] Building Launcher..." -ForegroundColor Yellow
Push-Location $LauncherDir
cargo build --release
if ($LASTEXITCODE -ne 0) { throw "Launcher build failed" }
Pop-Location

# 复制最终产物
$FinalExe = Join-Path $LauncherDir "target\release\mindmodel_launcher.exe"
$OutputExe = Join-Path $ProjectRoot "MindModelLauncher.exe"
Copy-Item $FinalExe $OutputExe

# 清理临时目录（保留 node 缓存）
Write-Host "`nCleaning up..."
if (Test-Path $ResourcesZip) {
    Remove-Item -Force $ResourcesZip
}
Remove-Item -Recurse -Force $TempDir

Write-Host "`n===========================================" -ForegroundColor Green
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "Output: $OutputExe" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host "`nThis single exe contains everything needed to run MindModel."
Write-Host "First run will extract resources to the same directory."
