import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui";

export function GigCard() {
  return (
    <Card className="max-w-sm shadow-card">
      <CardHeader>
        <CardTitle>Weekend delivery rider</CardTitle>
        <CardDescription>Makati City · Same-day</CardDescription>
        <CardAction>
          <Badge variant="amber">₱650/day</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="text-slate text-sm">
        Reliable rider needed for same-day parcel deliveries around Makati this
        weekend. Own motorcycle preferred.
      </CardContent>
      <CardFooter className="gap-3">
        <Button variant="amber" className="flex-1">
          Apply now
        </Button>
        <Button variant="outline">Save</Button>
      </CardFooter>
    </Card>
  );
}
