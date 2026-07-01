import { Label, Textarea } from "@repo/ui";

export function Default() {
  return (
    <Textarea
      className="max-w-sm"
      placeholder="Describe the gig — what, where, and when…"
    />
  );
}

export function WithLabel() {
  return (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="desc">Gig description</Label>
      <Textarea
        id="desc"
        rows={4}
        defaultValue="Need a reliable rider for same-day deliveries around Makati this weekend."
      />
    </div>
  );
}
