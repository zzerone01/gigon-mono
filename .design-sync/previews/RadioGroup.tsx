import { Label, RadioGroup, RadioGroupItem } from "@repo/ui";

export function Roles() {
  return (
    <RadioGroup defaultValue="worker" className="grid gap-3">
      <Label className="gap-2.5">
        <RadioGroupItem value="worker" /> I want to find gigs
      </Label>
      <Label className="gap-2.5">
        <RadioGroupItem value="poster" /> I want to hire
      </Label>
    </RadioGroup>
  );
}
