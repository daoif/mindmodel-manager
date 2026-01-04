//! MindModel Launcher
//! 
//! 功能：
//! 1. 首次运行时，释放嵌入的资源（前端exe、后端代码、Node.js）到当前目录
//! 2. 如果资源已存在，跳过释放
//! 3. 启动后端 Node.js 服务
//! 4. 启动前端 MindModel.exe

use std::env;
use std::fs::{self, File};
use std::io::{self, Read, Write, Cursor};
use std::path::Path;
use std::process::{Command, Stdio};
use std::thread;
use std::time::Duration;

// 嵌入资源 ZIP 文件（构建时生成）
// 这个文件需要在构建前通过脚本生成
const RESOURCES_ZIP: &[u8] = include_bytes!("../resources.zip");

fn main() -> io::Result<()> {
    let exe_dir = env::current_exe()?
        .parent()
        .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "Cannot get exe directory"))?
        .to_path_buf();
    
    println!("=== MindModel Launcher ===");
    println!("Working directory: {}", exe_dir.display());
    
    // 检查是否需要释放资源
    let mindmodel_exe = exe_dir.join("MindModel.exe");
    let backend_dir = exe_dir.join("backend");
    let node_exe = exe_dir.join("node").join("node.exe");
    
    // 总是尝试释放资源 (以便更新)，除非是很大的静态依赖 (node) 会在 extract_resources 内部处理跳过逻辑
    println!("\n[1/3] Verifying and updating resources...");
    extract_resources(&exe_dir)?;
    
    // 启动后端
    println!("\n[2/3] Starting backend...");
    let backend_handle = start_backend(&exe_dir)?;
    
    // 等待后端启动
    println!("Waiting for backend to start...");
    thread::sleep(Duration::from_secs(2));
    
    // 启动前端
    println!("\n[3/3] Starting MindModel...");
    let frontend_status = Command::new(&mindmodel_exe)
        .current_dir(&exe_dir)
        .spawn()?
        .wait()?;
    
    println!("MindModel exited with status: {}", frontend_status);
    
    // 前端退出后，后端也应该退出（如果还在运行的话）
    // 这里不主动 kill，让后端自然结束
    
    Ok(())
}

fn extract_resources(target_dir: &Path) -> io::Result<()> {
    let cursor = Cursor::new(RESOURCES_ZIP);
    let mut archive = zip::ZipArchive::new(cursor)
        .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("Failed to open ZIP: {}", e)))?;
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| io::Error::new(io::ErrorKind::Other, format!("Failed to read ZIP entry: {}", e)))?;
        
        let outpath = target_dir.join(file.name());
        
        // 策略:
        // 1. 如果是 node 目录下的文件，且已存在，跳过 (节省启动时间)
        // 2. 其他文件 (MindModel.exe, backend代码)，总是覆盖
        
        if file.name().starts_with("node/") || file.name().contains("/node/") || (file.name() == "node.exe") {
             if outpath.exists() {
                 continue;
             }
        }
        
        // 对于非目录文件，如果已存在，则覆盖 (File::create 会截断)
        
        if file.is_dir() {
            fs::create_dir_all(&outpath)?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent)?;
            }
            let mut outfile = File::create(&outpath)?;
            io::copy(&mut file, &mut outfile)?;
        }
        
        // 设置可执行权限 (Unix only, Windows 忽略)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if file.name().ends_with(".exe") || file.name().contains("node") {
                fs::set_permissions(&outpath, fs::Permissions::from_mode(0o755))?;
            }
        }
    }
    
    Ok(())
}

fn start_backend(base_dir: &Path) -> io::Result<std::process::Child> {
    let node_exe = base_dir.join("node").join("node.exe");
    let backend_script = base_dir.join("backend").join("dist").join("index.js");
    
    if !node_exe.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Node.js not found at: {}", node_exe.display())
        ));
    }
    
    if !backend_script.exists() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("Backend script not found at: {}", backend_script.display())
        ));
    }
    
    Command::new(&node_exe)
        .arg(&backend_script)
        .current_dir(base_dir.join("backend"))
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
}
