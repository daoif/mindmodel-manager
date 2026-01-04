#[cfg_attr(mobile, tauri::mobile_entry_point)]
use tauri::Manager;

pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
      // 当第二个实例启动时，聚焦已有窗口
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
      }
    }))
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.handle().plugin(tauri_plugin_shell::init())?;
      app.handle().plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"])))?;
      app.handle().plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
      app.handle().plugin(tauri_plugin_opener::init())?;
      
      let quit_i = tauri::menu::MenuItem::with_id(app.handle(), "quit", "Quit", true, None::<&str>)?;
      let show_i = tauri::menu::MenuItem::with_id(app.handle(), "show", "Show", true, None::<&str>)?;
      let menu = tauri::menu::Menu::with_items(app.handle(), &[&show_i, &quit_i])?;

      let _tray = tauri::tray::TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(|app, event| {
          match event.id.as_ref() {
            "quit" => {
              app.exit(0);
            }
            "show" => {
              if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
              }
            }
            _ => {}
          }
        })
        .on_tray_icon_event(|tray, event| {
           if let tauri::tray::TrayIconEvent::Click { button: tauri::tray::MouseButton::Left, .. } = event {
             let app = tray.app_handle();
             if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
             }
           }
        })
        .icon({
          // 使用编译时嵌入的图标
          let icon_bytes = include_bytes!("../icons/icon.png");
          tauri::image::Image::from_bytes(icon_bytes)
            .unwrap_or_else(|_| app.default_window_icon().unwrap().clone())
        })
        .build(app)?;

      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        window.hide().unwrap();
        api.prevent_close();
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
