import { Checkbox, Input, Label } from "@repo/ui";

export function WithInput() {
  return (
    <div className="grid max-w-xs gap-2">
      <Label htmlFor="name">Full name</Label>
      <Input id="name" placeholder="Juan dela Cruz" />
    </div>
  );
}

export function WithCheckbox() {
  return (
    <Label className="gap-2">
      <Checkbox defaultChecked /> Remember me
    </Label>
  );
}
