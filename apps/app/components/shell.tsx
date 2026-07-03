"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Profile } from "@/lib/domain";
import { initials } from "@/lib/domain";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "./icons";
import { Avatar } from "./ui";

/* ------------------------------ toast ------------------------------ */

interface ToastData {
  id: number;
  title: string;
  body: string;
  onTap?: () => void;
}

const ToastContext = createContext<(title: string, body: string, onTap?: () => void) => void>(
  () => {},
);

export function useToast() {
  return useContext(ToastContext);
}

/* ------------------------------ shell ------------------------------ */

export function AppShell({
  profile,
  navActive,
  children,
}: {
  profile: Profile;
  navActive: "explore" | "postings";
  children: ReactNode;
}) {
  const router = useRouter();
  const [drawer, setDrawer] = useState(false);
  const [banner, setBanner] = useState(true);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastSeq = useRef(0);

  const isEmployer = profile.active_role === "employer";

  const showToast = useCallback((title: string, body: string, onTap?: () => void) => {
    const id = ++toastSeq.current;
    setToast({ id, title, body, onTap });
    setTimeout(() => {
      setToast((t) => (t?.id === id ? null : t));
    }, 4400);
  }, []);

  const switchRole = async () => {
    const next = isEmployer ? "worker" : "employer";
    await supabaseBrowser().rpc("set_active_role", { p_role: next });
    setDrawer(false);
    router.push(next === "employer" ? "/business" : "/");
    router.refresh();
  };

  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <ToastContext.Provider value={showToast}>
      {/* app frame: mobile-first, centered column on desktop until the
          desktop split-view design lands */}
      <div className="relative mx-auto flex h-dvh max-w-md flex-col overflow-hidden bg-white shadow-[0_0_60px_rgba(15,27,46,0.08)]">
        {/* get-the-app smart banner */}
        {banner && (
          <div className="flex shrink-0 items-center gap-2.5 bg-royal-dark px-3 py-[9px]">
            <button
              aria-label="Dismiss"
              onClick={() => setBanner(false)}
              className="flex size-6 shrink-0 items-center justify-center text-[#7D96C9]"
            >
              <Icon name="x" size={13} strokeWidth={2.4} />
            </button>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-royal">
              <Icon name="logo" size={16} color="#F5A623" strokeWidth={2.4} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs font-semibold text-white">GigOn is faster on the app</span>
              <span className="text-[10px] text-navy-muted">Push alerts for matches · Android</span>
            </span>
            <button className="h-[30px] shrink-0 whitespace-nowrap rounded-full bg-amber px-[13px] text-[11.5px] font-bold text-ink">
              Get app
            </button>
          </div>
        )}

        {/* collapsed web header */}
        <header className="z-20 flex h-[52px] shrink-0 items-center gap-2 border-b border-line bg-white pl-1 pr-2">
          <button
            aria-label="Menu"
            onClick={() => setDrawer(true)}
            className="flex size-11 items-center justify-center text-ink"
          >
            <Icon name="menu" size={20} />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-royal">
              <Icon name="logo" size={14} color="#fff" strokeWidth={2.4} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">GigOn</span>
            {isEmployer && (
              <span className="rounded-full bg-tint px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.06em] text-royal-dark">
                Business
              </span>
            )}
          </div>
          <button aria-label="Notifications" className="relative flex size-10 items-center justify-center text-slate">
            <Icon name="bell" size={19} />
            <span className="absolute right-2 top-[7px] size-[7px] rounded-full border-[1.5px] border-white bg-amber" />
          </button>
          <Avatar name={initials(profile.full_name)} size={32} className="mr-1.5 rounded-full bg-tint text-[11px] text-royal-dark" />
        </header>

        {children}

        {/* nav drawer */}
        {drawer && (
          <div className="absolute inset-0 z-60 flex">
            <button
              aria-label="Close menu"
              onClick={() => setDrawer(false)}
              className="anim-fade absolute inset-0 bg-[rgba(15,27,46,0.45)]"
            />
            <div className="anim-drawer relative flex h-full w-[300px] flex-col bg-white shadow-[16px_0_48px_rgba(15,27,46,0.25)]">
              <div className="flex items-center gap-2.5 border-b border-line px-[18px] pb-3.5 pt-[18px]">
                <span className="flex size-[30px] items-center justify-center rounded-lg bg-royal">
                  <Icon name="logo" size={16} color="#fff" strokeWidth={2.4} />
                </span>
                <span className="flex-1 font-display text-[19px] font-bold tracking-tight">GigOn</span>
                <button
                  aria-label="Close"
                  onClick={() => setDrawer(false)}
                  className="flex size-9 items-center justify-center rounded-full bg-tint-soft text-slate"
                >
                  <Icon name="x" size={15} strokeWidth={2.2} />
                </button>
              </div>
              <div className="flex items-center gap-3 border-b border-line-soft px-[18px] py-3.5">
                <Avatar name={initials(profile.full_name)} size={44} />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold">
                    {isEmployer ? (profile.business_name ?? profile.full_name) : profile.full_name}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {isEmployer ? "Business" : "Worker"} · {profile.area ?? "Mactan"} · pilot zone 1
                  </span>
                </div>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
                <span className="flex items-center gap-3 rounded-[10px] bg-tint-soft px-3 py-3 text-[13.5px] font-semibold text-royal-dark">
                  <Icon name={navActive === "postings" ? "list" : "search"} size={17} />
                  {navActive === "postings" ? "Your postings" : "Explore gigs"}
                </span>
                <span className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-[13.5px] font-medium text-slate">
                  <Icon name="briefcase" size={17} />
                  My gigs
                </span>
                <span className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-[13.5px] font-medium text-slate">
                  <Icon name="message" size={17} />
                  Chat
                </span>
                <span className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-[13.5px] font-medium text-slate">
                  <Icon name="user" size={17} />
                  Profile
                </span>
                <div className="mx-1 my-2 h-px bg-line-soft" />
                <button
                  onClick={switchRole}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[13.5px] font-semibold text-royal hover:bg-tint-soft"
                >
                  <Icon name="switchArrows" size={17} />
                  {isEmployer ? "Switch to worker mode" : "Switch to business mode"}
                </button>
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[13.5px] font-medium text-slate hover:bg-tint-soft"
                >
                  <Icon name="x" size={15} />
                  Sign out
                </button>
              </nav>
              <div className="flex flex-col gap-1.5 border-t border-line-soft px-[18px] pb-[18px] pt-3.5">
                <span className="text-[10.5px] leading-relaxed text-ink-muted">
                  Free during the pilot — a small per-match fee for businesses is planned later.
                  Workers are never charged.
                </span>
                <span className="text-[10.5px] text-line-dashed">
                  Terms · Privacy · English (Cebuano soon)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* toast */}
        {toast && (
          <button
            key={toast.id}
            onClick={() => {
              toast.onTap?.();
              setToast(null);
            }}
            className="anim-toast absolute inset-x-3 top-14 z-55 flex items-start gap-[11px] rounded-[14px] bg-royal-dark px-3.5 py-3 text-left shadow-[0_10px_30px_rgba(15,27,46,0.35)]"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/12">
              <Icon name="logo" size={15} color="#F5A623" strokeWidth={2.4} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[12.5px] font-semibold leading-tight text-white">
                {toast.title}
              </span>
              <span className="text-[11px] leading-snug text-navy-muted">{toast.body}</span>
            </span>
          </button>
        )}
      </div>
    </ToastContext.Provider>
  );
}
