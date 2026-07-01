import { Alert, AlertDescription, AlertTitle } from "@repo/ui";
import { CircleCheck, TriangleAlert } from "lucide-react";

export function Default() {
  return (
    <Alert className="max-w-md">
      <CircleCheck />
      <AlertTitle>You&apos;re on the waitlist!</AlertTitle>
      <AlertDescription>
        We&apos;ll email you the moment GigOn goes live in your area.
      </AlertDescription>
    </Alert>
  );
}

export function Destructive() {
  return (
    <Alert variant="destructive" className="max-w-md">
      <TriangleAlert />
      <AlertTitle>Couldn&apos;t submit</AlertTitle>
      <AlertDescription>
        Something went wrong. Please check your details and try again.
      </AlertDescription>
    </Alert>
  );
}
