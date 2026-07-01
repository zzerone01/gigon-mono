import { Input, Label } from "@repo/ui";

export function Default() {
  return <Input placeholder="you@example.com" className="max-w-xs" />;
}

export function WithLabel() {
  return (
    <div className="grid max-w-xs gap-2">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  );
}

export function Invalid() {
  return (
    <div className="grid max-w-xs gap-2">
      <Label htmlFor="phone">Mobile number</Label>
      <Input id="phone" aria-invalid defaultValue="0917" />
      <p className="text-destructive text-sm">Enter a valid PH mobile number.</p>
    </div>
  );
}

export function Disabled() {
  return <Input disabled placeholder="Disabled" className="max-w-xs" />;
}
