import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

export function City() {
  return (
    <div className="grid max-w-xs gap-2">
      <Label>Where are you looking?</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a city" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="manila">Metro Manila</SelectItem>
          <SelectItem value="cebu">Cebu</SelectItem>
          <SelectItem value="davao">Davao</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
