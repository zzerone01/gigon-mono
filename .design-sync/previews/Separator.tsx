import { Separator } from "@repo/ui";

export function Horizontal() {
  return (
    <div className="max-w-sm">
      <div className="text-sm font-semibold text-ink">GigOn</div>
      <div className="text-slate text-sm">Find gig work near you</div>
      <Separator className="my-4" />
      <div className="text-slate flex h-5 items-center gap-3 text-sm">
        <span>Browse</span>
        <Separator orientation="vertical" />
        <span>Post</span>
        <Separator orientation="vertical" />
        <span>About</span>
      </div>
    </div>
  );
}
