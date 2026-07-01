import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/ui";

export function FAQ() {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="how"
      className="w-full max-w-md"
    >
      <AccordionItem value="how">
        <AccordionTrigger>How does GigOn work?</AccordionTrigger>
        <AccordionContent className="text-slate">
          Browse gigs on a map near you, apply in a tap, and get paid when the
          job&apos;s done.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="fee">
        <AccordionTrigger>Is it free to join?</AccordionTrigger>
        <AccordionContent className="text-slate">
          Yes — joining the waitlist and browsing gigs is completely free.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="where">
        <AccordionTrigger>Where is GigOn available?</AccordionTrigger>
        <AccordionContent className="text-slate">
          We&apos;re rolling out nationwide across the Philippines.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
