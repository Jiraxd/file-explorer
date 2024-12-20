import { DiskUsageProps } from "@/app/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function DiskUsage({
  name,
  mount_point,
  total_space,
  available_space,
}: DiskUsageProps) {
  const usagePercentage = ((total_space - available_space) / total_space) * 100;

  function formatBytes(bytes: number): string {
    const units = ["b", "B", "MB", "GB", "TB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  return (
    <Card className="bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {mount_point} {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={usagePercentage} className="w-full bg-gray-600" />
        <p className="text-sm text-gray-300 mt-2">
          {formatBytes(available_space)} available of {formatBytes(total_space)}
        </p>
      </CardContent>
    </Card>
  );
}
