use serde::{Deserialize, Serialize};
use sysinfo::Disks;

#[tauri::command]
pub async fn search_for_file(search_query: String, extension: String, disk: String) {
    println!(
        "searching for file: {}.{} on disk {}",
        search_query, extension, disk
    );
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
