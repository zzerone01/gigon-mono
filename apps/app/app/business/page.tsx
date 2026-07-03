import { redirect } from "next/navigation";

import { BusinessApp } from "@/components/business-app";
import { AppShell } from "@/components/shell";
import { supabaseServer } from "@/lib/supabase/server";

export default async function BusinessHome() {
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
  if (profile.active_role !== "employer") redirect("/");
  if (!profile.employer_verified) redirect("/onboarding");

  return (
    <AppShell profile={profile} navActive="postings">
      <BusinessApp profile={profile} />
    </AppShell>
  );
}
