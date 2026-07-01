import { Label, Switch } from "@repo/ui";

export function WithLabel() {
  return (
    <Label className="gap-3">
      <Switch defaultChecked /> Notify me about nearby gigs
    </Label>
  );
}

export function States() {
  return (
    <div className="flex items-center gap-6">
      <Switch />
      <Switch defaultChecked />
      <Switch disabled defaultChecked />
    </div>
  );
}
