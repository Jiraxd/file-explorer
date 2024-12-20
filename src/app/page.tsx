"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Search, Clock, FileIcon } from "lucide-react";
import { DiskUsage } from "@/components/homepage/DiskUsage";
import { invoke } from "@tauri-apps/api/core";
import { Label } from "@/components/ui/label";

export type DiskUsageProps = {
  name: string;
  mount_point: string;
  available_space: number;
  total_space: number;
};

export default function FileExplorer() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedExtension, setSelectedExtension] = useState<string>("");
  const [selectedDisk, setSelectedDisk] = useState<string>("");
  const [diskUsage, setDiskUsage] = useState<DiskUsageProps[]>([]);
  const [disks, setDisks] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    invoke("get_disks").then((response) => {
      setDiskUsage(response as DiskUsageProps[]);
      console.log(response as DiskUsageProps[]);
      setDisks(
        (response as DiskUsageProps[]).map((disk) =>
          disk.mount_point.replace("//", "")
        )
      );
    });
  }, []);

  async function search() {
    console.log(searchQuery, selectedExtension, selectedDisk);
    await invoke("search_for_file", {
      searchQuery: searchQuery,
      extension: selectedExtension,
      disk: selectedDisk,
    });
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <Card className="max-w-4xl mx-auto bg-gray-800 bg-opacity-40 text-white">
        <CardHeader>
          <CardTitle className="text-5xl text-center font-bebas">
            File Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex space-x-4">
              <Input
                type="text"
                placeholder="Search for files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-gray-700 text-white placeholder-gray-400"
              />
              <Button
                className="bg-purple-900 hover:bg-purple-950 text-white"
                onClick={search}
              >
                <Search className="mr-2 h-4 w-4" /> Search
              </Button>
            </div>

            <div className="flex space-x-4">
              <div>
                <Label>File extension</Label>
                <Input
                  type="text"
                  placeholder="File extension"
                  value={selectedExtension}
                  onChange={(e) => setSelectedExtension(e.target.value)}
                  className="w-[180px] bg-gray-700 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <Label>Disk</Label>
                <Select value={selectedDisk} onValueChange={setSelectedDisk}>
                  <SelectTrigger className="w-[180px] bg-gray-700 text-white">
                    <SelectValue placeholder="Select disk" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 text-white">
                    {disks.map((disk) => (
                      <SelectItem key={disk} value={disk}>
                        {disk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    <Clock className="inline-block mr-2 h-5 w-5" /> Search
                    History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {searchHistory.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white cursor-pointer"
                      >
                        <FileIcon className="h-4 w-4" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 text-white">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    <HardDrive className="inline-block mr-2 h-5 w-5" /> Disk
                    Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {diskUsage.map((disk) => (
                      <DiskUsage key={disk.mount_point} {...disk} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
