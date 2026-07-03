import { redirect } from "next/navigation";

import { AppShell } from "@/components/shell";
import { WorkerApp } from "@/components/worker-app";
import { supabaseServer } from "@/lib/supabase/server";

export default async function WorkerHome() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");
  if (!profile.onboarded) redirect("/onboarding");
  if (profile.active_role === "employer") redirect("/business");

  return (
    <AppShell profile={profile} navActive="explore">
      <WorkerApp profile={profile} />
    </AppShell>
  );
}
