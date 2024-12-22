use crossbeam_channel::bounded;
use crossbeam_channel::Sender;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use std::sync::Mutex;
use std::time::Duration;
use sysinfo::Disks;
use walkdir::{DirEntry, WalkDir};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileSearchResult {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub disk: String,
}

fn is_hidden(entry: &DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|s| s.starts_with("."))
        .unwrap_or(false)
}

fn get_all_disks() -> Vec<String> {
    let disks = Disks::new_with_refreshed_list();

    disks
        .iter()
        .map(|disk| disk.mount_point().to_string_lossy().to_string())
        .collect()
}

fn search_disk(
    disk: &str,
    search_query: &str,
    extension: &str,
    search_folders: bool,
) -> Vec<FileSearchResult> {
    if !Path::new(disk).exists() {
        return Vec::new();
    }

    let search_query = search_query.to_lowercase();
    let extension = extension.to_lowercase();
    let (tx, rx) = bounded(1000);
    let tx = Arc::new(tx);
    let results = Arc::new(Mutex::new(Vec::new()));

    let root_entries: Vec<_> = WalkDir::new(disk)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
        .collect();

    let tx_clone = tx.clone();
    root_entries.par_iter().for_each_with(tx, |tx, root_entry| {
        if root_entry.file_type().is_dir() {
            process_directory(
                root_entry.path(),
                &search_query,
                &extension,
                search_folders,
                tx.as_ref().clone(),
            );
        }
    });

    drop(Arc::try_unwrap(tx_clone).unwrap());
    while let Ok(result) = rx.recv_timeout(Duration::from_millis(100)) {
        if let Ok(mut results_guard) = results.lock() {
            results_guard.push(result);
        }
    }

    Arc::try_unwrap(results).unwrap().into_inner().unwrap()
}

fn process_directory(
    dir: &Path,
    search_query: &str,
    extension: &str,
    search_folders: bool,
    tx: Sender<FileSearchResult>,
) {
    WalkDir::new(dir)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| !is_hidden(e))
        .filter_map(|e| e.ok())
        .for_each(|entry| {
            if let Ok(metadata) = entry.metadata() {
                let is_dir = metadata.is_dir();

                if is_dir && !search_folders {
                    return;
                }

                if let Some(file_name) = entry.file_name().to_str() {
                    let name_lower = file_name.to_lowercase();

                    if !is_dir && !extension.is_empty() && !name_lower.ends_with(&extension) {
                        return;
                    }

                    if name_lower.contains(search_query) {
                        let _ = tx.send(FileSearchResult {
                            path: entry.path().to_string_lossy().to_string(),
                            name: file_name.to_string(),
                            size: if is_dir { 0 } else { metadata.len() },
                            disk: dir.to_string_lossy().into_owned(),
                        });
                    }
                }
            }
        });
}

#[tauri::command]
pub async fn search_for_file(
    search_query: String,
    extension: String,
    disk: String,
    search_folders: bool,
) -> Vec<FileSearchResult> {
    let search_query = search_query.to_lowercase();
    let extension = extension.to_lowercase();

    if disk.is_empty() {
        let mut all_results = Vec::new();
        for disk in get_all_disks() {
            all_results.extend(search_disk(
                &disk,
                &search_query,
                &extension,
                search_folders,
            ));
        }
        all_results
    } else {
        search_disk(&disk, &search_query, &extension, search_folders)
    }
}

#[derive(Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub available_space: u64,
    pub total_space: u64,
}

#[tauri::command]
pub fn get_disks() -> Vec<DiskInfo> {
    let mut disk_info_list: Vec<DiskInfo> = Vec::new();
    let disks = Disks::new_with_refreshed_list();

    for disk in disks.list() {
        disk_info_list.push(DiskInfo {
            name: disk.name().to_string_lossy().into_owned(),
            mount_point: disk.mount_point().to_string_lossy().to_owned().to_string(),
            available_space: disk.available_space(),
            total_space: disk.total_space(),
        });
    }

    return disk_info_list;
}

#[tauri::command]
pub async fn show_in_explorer(path: String) -> Result<(), String> {
    use std::process::Command;
    Command::new("explorer")
        .args(["/select,", &path])
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}
