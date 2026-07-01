import { Progress } from "@repo/ui";

export function Steps() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Progress value={25} />
      <Progress value={60} />
      <Progress value={100} />
    </div>
  );
}
