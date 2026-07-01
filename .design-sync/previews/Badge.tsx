import { Badge } from "@repo/ui";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Badge>New</Badge>
      <Badge variant="amber">Featured</Badge>
      <Badge variant="solid">Urgent</Badge>
      <Badge variant="success">Live</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  );
}

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Badge size="default">Manila</Badge>
      <Badge size="lg" variant="amber">
        ₱500 / day
      </Badge>
    </div>
  );
}
