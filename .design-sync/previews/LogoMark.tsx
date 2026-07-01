import { LogoMark } from "@repo/ui";

export function Sizes() {
  return (
    <div className="flex items-center gap-6">
      <LogoMark size="sm" />
      <LogoMark size="md" />
      <LogoMark size="lg" />
    </div>
  );
}
