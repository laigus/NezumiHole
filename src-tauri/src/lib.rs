#[derive(serde::Serialize)]
struct ImportFile {
    path: String,
    data: String,
}

fn executable_dir() -> Option<std::path::PathBuf> {
    std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|parent| parent.to_path_buf()))
        .or_else(|| std::env::current_dir().ok())
}

#[tauri::command]
fn export_data_to_file(data: String, file_name: String) -> Result<Option<String>, String> {
    let mut dialog = rfd::FileDialog::new()
        .set_title("导出数据")
        .set_file_name(&file_name)
        .add_filter("JSON 文件", &["json"]);

    if let Some(default_dir) = executable_dir() {
        dialog = dialog.set_directory(default_dir);
    }

    let Some(mut path) = dialog.save_file() else {
        return Ok(None);
    };

    if path.extension().is_none() {
        path.set_extension("json");
    }

    std::fs::write(&path, data).map_err(|err| format!("写入文件失败：{err}"))?;
    Ok(Some(path.to_string_lossy().into_owned()))
}

#[tauri::command]
fn import_data_from_file() -> Result<Option<ImportFile>, String> {
    let mut dialog = rfd::FileDialog::new()
        .set_title("导入数据")
        .add_filter("JSON 文件", &["json"]);

    if let Some(default_dir) = executable_dir() {
        dialog = dialog.set_directory(default_dir);
    }

    let Some(path) = dialog.pick_file() else {
        return Ok(None);
    };

    let data = std::fs::read_to_string(&path).map_err(|err| format!("读取文件失败：{err}"))?;
    Ok(Some(ImportFile {
        path: path.to_string_lossy().into_owned(),
        data,
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            export_data_to_file,
            import_data_from_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
