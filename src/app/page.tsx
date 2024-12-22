"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HardDrive,
  Search,
  Clock,
  FileIcon,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { DiskUsage } from "@/components/homepage/DiskUsage";
import { invoke } from "@tauri-apps/api/core";
import { Label } from "@/components/ui/label";

export type DiskUsageProps = {
  name: string;
  mount_point: string;
  available_space: number;
  total_space: number;
};

export type FileSearchResult = {
  path: string;
  name: string;
  size: number;
};

type SearchHistory = {
  name: string;
  date: string;
};

export default function FileExplorer() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedExtension, setSelectedExtension] = useState<string>("");
  const [searchFolders, setSearchFolders] = useState<boolean>(false);
  const [selectedDisk, setSelectedDisk] = useState<string>("");
  const [diskUsage, setDiskUsage] = useState<DiskUsageProps[]>([]);
  const [disks, setDisks] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<FileSearchResult[]>([]);
  const [searchingTime, setSearchingTime] = useState<string>("");

  const handleFileOpen = async (path: string) => {
    await invoke("show_in_explorer", { path });
  };

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
    const searchStart = Date.now();
    setSearching(true);
    await invoke("search_for_file", {
      searchQuery: searchQuery,
      extension: selectedExtension,
      disk: selectedDisk,
      searchFolders: searchFolders,
    }).then((response) => {
      const result = response as FileSearchResult[];
      setSearching(false);
      const searchDuration = Date.now() - searchStart;
      const formattedTime =
        searchDuration > 1000
          ? `${(searchDuration / 1000).toFixed(2)} seconds`
          : `${searchDuration} milliseconds`;
      setSearchingTime(formattedTime);
      setSearchResults(result);
      setSearchHistory((prev) => [
        { name: searchQuery, date: Date.now().toString() },
        ...prev,
      ]);
      setShowResults(true);
    });
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <Card className="max-w-4xl mx-auto bg-gray-800 bg-opacity-40 text-white font-source">
        {showResults ? (
          <>
            <CardHeader className="relative">
              <Button
                variant="ghost"
                className="absolute left-4 top-4 text-white hover:text-gray-300"
                onClick={() => setShowResults(false)}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <CardTitle className="text-5xl text-center">
                Search Results | {searchingTime}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleFileOpen(result.path)}
                    className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    <h3 className="font-semibold">{result.name}</h3>
                    <p className="text-sm text-gray-300">{result.path}</p>
                  </div>
                ))}
                {searchResults.length === 0 && (
                  <p className="text-center text-gray-400">No results found</p>
                )}
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-5xl text-center font-roboto">
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
                    disabled={searching}
                    className="bg-purple-900 hover:bg-purple-950 text-white"
                    onClick={search}
                  >
                    {searching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>

                <div className="flex space-x-4 flex-row items-center justify-center align-middle">
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
                  <div className="flex h-full space-x-2 align-middle justify-center items-center">
                    <Checkbox
                      id="searchFolders"
                      checked={searchFolders}
                      onCheckedChange={(checked: boolean) =>
                        setSearchFolders(checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="searchFolders"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Include Folders
                    </Label>
                  </div>
                  <div>
                    <Label>Disk</Label>
                    <Select
                      value={selectedDisk}
                      onValueChange={setSelectedDisk}
                    >
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
                      <CardTitle className="text-xl">
                        <Clock className="inline-block mr-2 h-5 w-5" /> Search
                        History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {searchHistory.map((item, index) => (
                          <li
                            key={index}
                            onClick={() => {
                              setSearchQuery(item.name);
                              search();
                            }}
                            className="flex flex-row items-center justify-between space-x-2 text-sm text-gray-300 hover:text-white cursor-pointer"
                          >
                            <div className="flex flex-row items-center space-x-2">
                              <FileIcon className="h-4 w-4" />
                              <span>{item.name}</span>
                            </div>
                            <span>
                              {new Date(parseInt(item.date)).toLocaleString()}
                            </span>
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
          </>
        )}
      </Card>
    </div>
  );
}
