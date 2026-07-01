import { Slider } from "@repo/ui";

export function Default() {
  return <Slider defaultValue={[40]} max={100} step={1} className="max-w-sm" />;
}

export function Range() {
  return (
    <Slider defaultValue={[20, 80]} max={100} step={1} className="max-w-sm" />
  );
}
