import { Logo } from "@repo/ui";

export function Sizes() {
  return (
    <div className="flex items-center gap-6">
      <Logo size="sm" />
      <Logo size="md" />
      <Logo size="lg" />
    </div>
  );
}

export function Tones() {
  return (
    <div className="flex items-center gap-6">
      <Logo />
      <div className="rounded-xl bg-royal p-4">
        <Logo tone="inverted" />
      </div>
    </div>
  );
}

export function MarkOnly() {
  return <Logo showWordmark={false} size="lg" />;
}
