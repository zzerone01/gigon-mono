import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";

export function Default() {
  return (
    <Tabs defaultValue="find" className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="find">Find gigs</TabsTrigger>
        <TabsTrigger value="post">Post a gig</TabsTrigger>
      </TabsList>
      <TabsContent value="find" className="text-slate pt-3 text-sm">
        Discover short jobs near you on the map and apply in seconds.
      </TabsContent>
      <TabsContent value="post" className="text-slate pt-3 text-sm">
        Post a gig in minutes and hire trusted people nearby.
      </TabsContent>
    </Tabs>
  );
}
