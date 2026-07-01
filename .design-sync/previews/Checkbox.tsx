import { Checkbox, Label } from "@repo/ui";

export function WithLabel() {
  return (
    <Label className="gap-2.5">
      <Checkbox defaultChecked /> I agree to the GigOn terms
    </Label>
  );
}

export function States() {
  return (
    <div className="flex flex-col gap-3">
      <Label className="gap-2.5">
        <Checkbox /> Unchecked
      </Label>
      <Label className="gap-2.5">
        <Checkbox defaultChecked /> Checked
      </Label>
      <Label className="gap-2.5 opacity-70">
        <Checkbox disabled defaultChecked /> Disabled
      </Label>
    </div>
  );
}
