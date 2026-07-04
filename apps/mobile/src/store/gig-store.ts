/**
 * Supabase-backed app store. Keeps the same surface the screens were built
 * against (wStatus/eStatus, applied, apply/arrive/…): DB rows are mapped to
 * the design's view models and every state transition calls the GigOn write
 * API (app.gigon.io/api — PRD §4.1 state machine). Reads and Realtime stay
 * on supabase-js.
 */
import * as Haptics from "expo-haptics";
import { create } from "zustand";

import {
  EMPLOYER_CANCEL_REASONS,
  WORKER_CANCEL_REASONS,
  mapApplicant,
  mapGig,
  firstName,
  type Applicant,
  type Gig,
  type GigWithEmployer,
  type ProfileRow,
} from "../data/mock";
import { api } from "../lib/api";
import { MACTAN_CENTER } from "../lib/geo";
import { registerPushToken, unregisterPushToken } from "../lib/notifications";
import { supabase } from "../lib/supabase";

export type Role = "worker" | "employer";
export type WorkerStatus = "APPLIED" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "RATED";
export type EmployerStatus = "POSTED" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "RATED";
export type SheetKind = "match" | "noshow" | "dispute" | "cancel" | "cancelPost";

export interface ChatMsg {
  me: boolean;
  text: string;
  time: string;
}

export interface ToastData {
  id: number;
  title: string;
  body: string;
  route?: string;
}

export interface HistItem {
  id: string;
  t: string;
  meta: string;
  pay: number;
  stars: string;
  type: string;
}

export interface PostingVM {
  title: string;
  pay: number;
  meta: string;
  expiresIn: number;
  status: string;
}

interface GigState {
  // session
  booted: boolean;
  userId: string | null;
  profile: ProfileRow | null;
  role: Role;
  phone: string;

  // onboarding
  onbRole: Role;
  onbName: string;
  onbBusiness: string;
  onbInvite: string;

  // worker
  feed: Gig[];
  applied: Record<string, boolean>;
  wStatus: WorkerStatus | null;
  wGig: string | null;
  hist: HistItem[];
  unread: number;
  pin: string;
  pinErr: string;
  pinLock: number;
  stars: number;
  rtags: Record<string, boolean>;
  comment: string;
  dReason: number;
  dText: string;
  dFiled: boolean;
  disputeTicket: string | null;
  cReason: number;

  // employer
  posted: boolean;
  posting: PostingVM | null;
  eStatus: EmployerStatus | null;
  apps: string[];
  confirmId: string | null;
  matchedId: string | null;
  pinIssued: boolean;
  pinDigits: string | null;
  noShowDone: boolean;
  eStars: number;
  etags: Record<string, boolean>;
  eComment: string;
  pfType: string;
  pfTitle: string;
  pfWhen: string;
  pfTime: string;
  pfDur: string;
  pfPay: string;
  pfSlots: number;
  pfDesc: string;

  // shared
  chatMsgs: ChatMsg[];
  toast: ToastData | null;
  sheet: SheetKind | null;

  // actions
  boot: () => Promise<void>;
  sendOtp: (phone: string) => Promise<string | null>;
  verifyOtp: (code: string) => Promise<string | null>;
  setOnbRole: (r: Role) => void;
  setOnbFields: (patch: Partial<Pick<GigState, "onbName" | "onbBusiness" | "onbInvite">>) => void;
  completeOnboarding: (coords: { lat: number; lng: number } | null) => Promise<string | null>;
  switchRole: () => Promise<Role>;
  signOut: () => Promise<void>;
  /** Permanently delete the account server-side, then clear local state. */
  deleteAccount: () => Promise<string | null>;

  showToast: (title: string, body: string, route?: string) => void;
  dismissToast: () => void;
  openSheet: (s: SheetKind, confirmId?: string) => void;
  closeSheet: () => void;

  loadWorker: () => Promise<void>;
  loadEmployer: () => Promise<void>;
  apply: (gigId: string) => Promise<void>;
  arrive: () => Promise<void>;
  enterPinDigit: (d: string) => void;
  deletePinDigit: () => void;
  resetPin: () => void;
  setStars: (n: number) => void;
  toggleRtag: (tag: string) => void;
  setComment: (v: string) => void;
  submitRate: () => Promise<void>;
  skipRate: () => void;
  setDReason: (i: number) => void;
  setDText: (v: string) => void;
  fileDispute: () => Promise<void>;
  setCReason: (i: number) => void;
  cancelActiveMatch: () => Promise<void>;
  cancelPosting: () => Promise<void>;
  markChatRead: () => void;
  sendChat: (text: string) => Promise<void>;

  setPostField: (
    patch: Partial<
      Pick<GigState, "pfType" | "pfTitle" | "pfWhen" | "pfTime" | "pfDur" | "pfPay" | "pfDesc">
    >,
  ) => void;
  setPfSlots: (delta: number) => void;
  postGig: () => Promise<string | null>;
  confirmMatch: () => Promise<void>;
  issuePin: () => Promise<void>;
  reportNoShow: () => Promise<void>;
  setEStars: (n: number) => void;
  toggleEtag: (tag: string) => void;
  setEComment: (v: string) => void;
  submitERate: () => Promise<void>;
  skipERate: () => void;
}

/* ------------------------- module-level plumbing ------------------------- */

let toastSeq = 0;
let lockInterval: ReturnType<typeof setInterval> | null = null;
let pinBusy = false;

// non-reactive row caches for view-model lookups
let gigIndex: Record<string, Gig> = {};
let applicantIndex: Record<string, Applicant> = {};
let applicationIdByWorker: Record<string, string> = {};
let wMatchId: string | null = null;
let wMatchGig: Gig | null = null;
let eGigId: string | null = null;
let eMatchId: string | null = null;
let matchedApplicant: Applicant | null = null;

const GIG_SELECT = "*, employer:profiles!gigs_employer_id_fkey(*)";

function notify() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

function msgTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
}

/** Gig view model by id (feed or engaged gig). */
export function gigById(id: string | null | undefined): Gig {
  const fallback: Gig = {
    id: "", t: "", biz: "", area: "", type: "Cleaning", pay: 0, hrs: "", when: "",
    dist: "—", slots: "", lat: MACTAN_CENTER.lat, lng: MACTAN_CENTER.lng, desc: "",
    er: "", einit: "?", erate: "New", ejobs: 0, since: "",
  };
  if (!id) return wMatchGig ?? fallback;
  return gigIndex[id] ?? (wMatchGig?.id === id ? wMatchGig : fallback);
}

export function applicantById(id: string | null | undefined): Applicant {
  const fallback: Applicant = {
    id: "", name: "Worker", init: "?", rt: "New", jobs: 0, ns: "0 no-shows",
    nsBad: false, dist: "nearby", tags: "General", note: "Mactan",
  };
  if (!id) return matchedApplicant ?? fallback;
  return applicantIndex[id] ?? (matchedApplicant?.id === id ? matchedApplicant : fallback);
}

export function useMatchedApplicant(): Applicant {
  const matchedId = useGigStore((s) => s.matchedId);
  return applicantById(matchedId);
}

/* ------------------------------- realtime ------------------------------- */

let feedChannel: ReturnType<typeof supabase.channel> | null = null;
let chatChannel: ReturnType<typeof supabase.channel> | null = null;
let chatChannelMatch: string | null = null;

function setupFeedRealtime(get: () => GigState) {
  if (feedChannel) {
    supabase.removeChannel(feedChannel);
    feedChannel = null;
  }
  const uid = get().userId;
  if (!uid) return;
  feedChannel = supabase
    .channel("app-feed")
    .on("postgres_changes", { event: "*", schema: "public", table: "gigs" }, () => {
      if (get().role === "worker") get().loadWorker();
      else get().loadEmployer();
    })
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "matches", filter: `worker_id=eq.${uid}` },
      () => {
        notify();
        get().showToast(
          "You're matched — your gig is on!",
          "The business picked you · tap to open",
          "/active",
        );
        get().loadWorker();
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "matches", filter: `worker_id=eq.${uid}` },
      (payload) => {
        const next = payload.new as { status: string; cancelled_by?: string | null };
        if (get().role !== "worker") return;
        if (next.status === "NO_SHOW") {
          get().showToast("No-show recorded", "This gig was reopened by the business");
        }
        if (next.status === "CANCELLED" && next.cancelled_by !== uid) {
          get().showToast("Gig cancelled by the business", "You're free to apply to other gigs nearby");
        }
        get().loadWorker();
      },
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "applications" },
      (payload) => {
        const row = payload.new as { gig_id: string };
        if (get().role === "employer" && row.gig_id === eGigId) {
          notify();
          get().showToast("New applicant", "Compare distance, rating and history", "/e-applicants");
          get().loadEmployer();
        }
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "matches", filter: `employer_id=eq.${uid}` },
      (payload) => {
        const next = payload.new as { status: string; cancelled_by?: string | null };
        if (get().role !== "employer") return;
        if (next.status === "CANCELLED" && next.cancelled_by !== uid) {
          get().showToast("Worker cancelled", "Recorded on their profile · your gig is live again", "/e-applicants");
        }
        if (next.status === "IN_PROGRESS") {
          get().showToast("Worker arrived · IN_PROGRESS", "They tapped “I've arrived” on site", "/e-active");
        }
        if (next.status === "COMPLETED") {
          notify();
          get().showToast("PIN confirmed · COMPLETED", "Both sides confirmed — reviews unlocked", "/e-active");
        }
        get().loadEmployer();
      },
    )
    .subscribe();
}

function setupChatRealtime(get: () => GigState, matchId: string | null) {
  if (chatChannelMatch === matchId) return;
  if (chatChannel) {
    supabase.removeChannel(chatChannel);
    chatChannel = null;
  }
  chatChannelMatch = matchId;
  if (!matchId) return;
  chatChannel = supabase
    .channel(`chat-${matchId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
      (payload) => {
        const row = payload.new as { sender_id: string; body: string; created_at: string };
        const me = row.sender_id === get().userId;
        useGigStore.setState((s) => ({
          chatMsgs: [...s.chatMsgs, { me, text: row.body, time: msgTime(row.created_at) }],
          unread: me ? s.unread : s.unread + 1,
        }));
      },
    )
    .subscribe();
}

async function loadChat(get: () => GigState, matchId: string | null) {
  if (!matchId) {
    useGigStore.setState({ chatMsgs: [] });
    setupChatRealtime(get, null);
    return;
  }
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("id");
  const uid = get().userId;
  useGigStore.setState({
    chatMsgs: (data ?? []).map((m) => ({
      me: m.sender_id === uid,
      text: m.body,
      time: msgTime(m.created_at),
    })),
  });
  setupChatRealtime(get, matchId);
}

/* --------------------------------- store --------------------------------- */

const initialFlow = {
  feed: [] as Gig[],
  applied: {} as Record<string, boolean>,
  wStatus: null as WorkerStatus | null,
  wGig: null as string | null,
  hist: [] as HistItem[],
  unread: 0,
  pin: "",
  pinErr: "",
  pinLock: 0,
  stars: 0,
  rtags: {},
  comment: "",
  dReason: -1,
  dText: "",
  dFiled: false,
  disputeTicket: null as string | null,
  cReason: -1,
  posted: false,
  posting: null as PostingVM | null,
  eStatus: null as EmployerStatus | null,
  apps: [] as string[],
  confirmId: null as string | null,
  matchedId: null as string | null,
  pinIssued: false,
  pinDigits: null as string | null,
  noShowDone: false,
  eStars: 0,
  etags: {},
  eComment: "",
  pfType: "Cleaning",
  pfTitle: "Afternoon café deep clean",
  pfWhen: "Today",
  pfTime: "2:00 – 4:00 PM",
  pfDur: "2 hrs",
  pfPay: "350",
  pfSlots: 1,
  pfDesc: "Dining area + kitchen wipe-down after the lunch rush. Mop and supplies provided.",
  chatMsgs: [] as ChatMsg[],
  toast: null as ToastData | null,
  sheet: null as SheetKind | null,
};

export const useGigStore = create<GigState>((set, get) => ({
  booted: false,
  userId: null,
  profile: null,
  role: "worker",
  phone: "",
  onbRole: "worker",
  onbName: "",
  onbBusiness: "",
  onbInvite: "",
  ...initialFlow,

  /* ------------------------------- session ------------------------------- */

  boot: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      set({ booted: true, userId: null, profile: null });
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    const role = (profile?.active_role ?? "worker") as Role;
    set({ booted: true, userId: session.user.id, profile: profile ?? null, role });
    if (profile?.onboarded) {
      setupFeedRealtime(get);
      void registerPushToken(); // fire-and-forget; no-op in Expo Go
      if (role === "worker") await get().loadWorker();
      else await get().loadEmployer();
    }
  },

  sendOtp: async (phone) => {
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("63")
      ? digits
      : digits.startsWith("09")
        ? `63${digits.slice(1)}`
        : digits.startsWith("9")
          ? `63${digits}`
          : null;
    if (!normalized || normalized.length !== 12) {
      return "Enter a valid PH mobile number, e.g. 0917 123 4001";
    }
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    if (error) return error.message;
    set({ phone: normalized });
    return null;
  },

  verifyOtp: async (code) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: get().phone,
      token: code.trim(),
      type: "sms",
    });
    if (error) return "That code doesn't match — try again.";
    await get().boot();
    return null;
  },

  setOnbRole: (r) => set({ onbRole: r }),
  setOnbFields: (patch) => set(patch),

  completeOnboarding: async (coords) => {
    const st = get();
    if (!st.onbName.trim()) return "Tell us your name.";
    if (st.onbRole === "employer") {
      const redeemed = await api
        .post<{ ok: boolean }>("/api/invites/redeem", {
          code: st.onbInvite,
          businessName: st.onbBusiness || st.onbName,
        })
        .catch(() => ({ ok: false }));
      if (!redeemed.ok) return "That invite code isn't valid. Pilot businesses are invite-only.";
    }
    const c = coords ?? MACTAN_CENTER;
    try {
      await api.post("/api/onboarding", {
        name: st.onbName,
        role: st.onbRole,
        area: "Mactan",
        lat: c.lat,
        lng: c.lng,
      });
    } catch (error) {
      return (error as Error).message;
    }
    await get().boot();
    return null;
  },

  switchRole: async () => {
    const next: Role = get().role === "worker" ? "employer" : "worker";
    await api.post("/api/profile/role", { role: next }).catch(() => {});
    set({ role: next, ...initialFlow });
    await get().boot();
    return next;
  },

  signOut: async () => {
    await unregisterPushToken();
    await supabase.auth.signOut();
    if (feedChannel) supabase.removeChannel(feedChannel);
    if (chatChannel) supabase.removeChannel(chatChannel);
    feedChannel = chatChannel = null;
    chatChannelMatch = null;
    gigIndex = {};
    applicantIndex = {};
    wMatchId = wMatchGig = eGigId = eMatchId = matchedApplicant = null as never;
    set({ userId: null, profile: null, role: "worker", phone: "", ...initialFlow });
  },

  deleteAccount: async () => {
    try {
      await api.post("/api/account/delete");
    } catch (error) {
      return (error as Error).message;
    }
    // Server already removed the account and its push tokens — a global
    // sign-out would 401, so only clear the local session and state.
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    if (feedChannel) supabase.removeChannel(feedChannel);
    if (chatChannel) supabase.removeChannel(chatChannel);
    feedChannel = chatChannel = null;
    chatChannelMatch = null;
    gigIndex = {};
    applicantIndex = {};
    wMatchId = wMatchGig = eGigId = eMatchId = matchedApplicant = null as never;
    set({ userId: null, profile: null, role: "worker", phone: "", ...initialFlow });
    return null;
  },

  /* ------------------------------ toast/sheet ----------------------------- */

  showToast: (title, body, route) => {
    const id = ++toastSeq;
    set({ toast: { id, title, body, route } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 4400);
  },
  dismissToast: () => set({ toast: null }),
  openSheet: (s, confirmId) =>
    set({ sheet: s, ...(confirmId !== undefined ? { confirmId } : {}) }),
  closeSheet: () => set({ sheet: null }),

  /* ------------------------------ worker data ----------------------------- */

  loadWorker: async () => {
    const uid = get().userId;
    if (!uid) return;
    const p = get().profile;
    const you = { lat: p?.lat ?? MACTAN_CENTER.lat, lng: p?.lng ?? MACTAN_CENTER.lng };

    // Sweep POSTED gigs past their expiry before reading the feed
    await supabase.rpc("expire_stale_gigs");
    const [gigsRes, appsRes, matchRes, histRes] = await Promise.all([
      supabase
        .from("gigs")
        .select(GIG_SELECT)
        .eq("status", "POSTED")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false }),
      supabase.from("applications").select("*").eq("worker_id", uid),
      supabase
        .from("matches")
        .select(`*, gig:gigs(${GIG_SELECT})`)
        .eq("worker_id", uid)
        .in("status", ["MATCHED", "IN_PROGRESS", "COMPLETED"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("matches")
        .select(`*, gig:gigs(${GIG_SELECT})`)
        .eq("worker_id", uid)
        .eq("status", "COMPLETED")
        .order("completed_at", { ascending: false })
        .limit(10),
    ]);

    const rows = (gigsRes.data ?? []) as unknown as GigWithEmployer[];
    const feed = rows
      .filter((g) => g.employer_id !== uid)
      .map((g) => mapGig(g, you))
      .sort((a, b) => parseFloat(a.dist) * (a.dist.includes("km") ? 1000 : 1) -
        parseFloat(b.dist) * (b.dist.includes("km") ? 1000 : 1));
    gigIndex = Object.fromEntries(feed.map((g) => [g.id, g]));

    const appRows = appsRes.data ?? [];
    const applied = Object.fromEntries(
      appRows.filter((a) => a.status !== "WITHDRAWN").map((a) => [a.gig_id, true]),
    );

    const m = matchRes.data as
      | (NonNullable<typeof matchRes.data> & { gig: GigWithEmployer })
      | null;

    let wStatus: WorkerStatus | null = null;
    let wGig: string | null = null;
    let dFiled = false;
    let disputeTicket: string | null = null;

    if (m) {
      wMatchId = m.id;
      wMatchGig = mapGig(m.gig, you);
      gigIndex[wMatchGig.id] = wMatchGig;
      wGig = m.gig_id;
      const [{ data: rv }, { data: dp }] = await Promise.all([
        supabase.from("reviews").select("id").eq("match_id", m.id).eq("rater_id", uid).maybeSingle(),
        supabase
          .from("disputes")
          .select("id")
          .eq("match_id", m.id)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      wStatus = m.status === "COMPLETED" && rv ? "RATED" : (m.status as WorkerStatus);
      dFiled = !!dp;
      disputeTicket = dp ? `D-${1000 + dp.id}` : null;
      await loadChat(get, m.id);
    } else {
      wMatchId = null;
      wMatchGig = null;
      const pending = appRows.find((a) => a.status === "APPLIED" && gigIndex[a.gig_id]);
      if (pending) {
        wStatus = "APPLIED";
        wGig = pending.gig_id;
      }
      await loadChat(get, null);
    }

    const hist: HistItem[] = ((histRes.data ?? []) as unknown as Array<
      { id: string; completed_at: string | null; gig: GigWithEmployer }
    >).map((h) => ({
      id: h.id,
      t: h.gig.title,
      meta: `${h.gig.employer.business_name ?? h.gig.employer.full_name} · ${
        h.completed_at
          ? new Date(h.completed_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
          : ""
      }`,
      pay: h.gig.pay,
      stars: "✓",
      type: h.gig.type,
    }));

    set({ feed, applied, wStatus, wGig, dFiled, disputeTicket, hist });
  },

  apply: async (gigId) => {
    try {
      await api.post(`/api/gigs/${gigId}/apply`);
    } catch (error) {
      get().showToast("Couldn't apply", (error as Error).message);
      return;
    }
    const g = gigById(gigId);
    get().showToast("Application sent", `${g.biz} is reviewing applicants — 1-tap, no cover letter`);
    await get().loadWorker();
  },

  arrive: async () => {
    if (!wMatchId) return;
    try {
      await api.post(`/api/matches/${wMatchId}/arrive`);
    } catch (error) {
      get().showToast("Couldn't log arrival", (error as Error).message);
      return;
    }
    get().showToast("Arrival logged · IN_PROGRESS", "Recorded in the append-only audit log");
    await get().loadWorker();
  },

  enterPinDigit: (d) => {
    const st = get();
    if (st.pinLock > 0 || st.pin.length >= 4 || pinBusy) return;
    const p = st.pin + d;
    set({ pin: p, pinErr: "" });
    if (p.length === 4 && wMatchId) {
      pinBusy = true;
      api
        .post<{
          ok: boolean;
          error?: string;
          attempts_left?: number;
          locked_for?: number;
        }>(`/api/matches/${wMatchId}/pin/verify`, { pin: p })
        .then(async (res) => {
          pinBusy = false;
          if (res.ok) {
            notify();
            set({ pin: "", wStatus: "COMPLETED" });
            get().showToast("PIN verified · COMPLETED", "Append-only log written — reviews unlocked");
            await get().loadWorker();
            return;
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          if (res.error === "locked") {
            set({ pin: "", pinLock: Number(res.locked_for ?? 60), pinErr: "3 wrong attempts — locked for 60 s." });
            if (lockInterval) clearInterval(lockInterval);
            lockInterval = setInterval(() => {
              const l = get().pinLock - 1;
              if (l <= 0) {
                if (lockInterval) clearInterval(lockInterval);
                lockInterval = null;
                set({ pinLock: 0, pinErr: "" });
              } else {
                set({ pinLock: l });
              }
            }, 1000);
          } else if (res.error === "no_active_pin") {
            set({ pin: "", pinErr: "No active PIN — ask the business to issue it first." });
          } else {
            set({ pin: "", pinErr: `PIN doesn't match — ${res.attempts_left ?? 0} attempts left` });
          }
        })
        .catch((error: Error) => {
          pinBusy = false;
          set({ pin: "", pinErr: error.message });
        });
    }
  },
  deletePinDigit: () => {
    if (get().pinLock > 0) return;
    set({ pin: get().pin.slice(0, -1), pinErr: "" });
  },
  resetPin: () => set({ pin: "", pinErr: "" }),

  setStars: (n) => set({ stars: n }),
  toggleRtag: (tag) => set({ rtags: { ...get().rtags, [tag]: !get().rtags[tag] } }),
  setComment: (v) => set({ comment: v }),
  submitRate: async () => {
    const st = get();
    if (st.stars === 0 || !wMatchId) return;
    try {
      await api.post(`/api/matches/${wMatchId}/review`, {
        stars: st.stars,
        tags: Object.keys(st.rtags).filter((k) => st.rtags[k]),
        comment: st.comment,
      });
    } catch (error) {
      get().showToast("Couldn't post review", (error as Error).message);
      return;
    }
    set({ wStatus: "RATED" });
    get().showToast("Review posted", "Reviews only exist on PIN-completed gigs — that keeps them honest");
    await get().loadWorker();
  },
  skipRate: () => set({ wStatus: "RATED" }),

  setDReason: (i) => set({ dReason: i }),
  setDText: (v) => set({ dText: v }),
  fileDispute: async () => {
    const st = get();
    if (st.dReason < 0 || !wMatchId) return;
    let ticket: string;
    try {
      ({ ticket } = await api.post<{ ticket: string }>(`/api/matches/${wMatchId}/dispute`, {
        reason: ["PIN doesn't match what happened", "Pay was different than agreed", "Work quality / other"][st.dReason]!,
        detail: st.dText,
      }));
    } catch {
      return;
    }
    set({ dFiled: true, sheet: null, disputeTicket: ticket });
    get().showToast(`Dispute #${ticket} opened · DISPUTED`, "The GigOn team reviews within 24 h");
  },

  setCReason: (i) => set({ cReason: i }),
  cancelActiveMatch: async () => {
    const st = get();
    const isWorker = st.role === "worker";
    const matchId = isWorker ? wMatchId : eMatchId;
    const reasons = isWorker ? WORKER_CANCEL_REASONS : EMPLOYER_CANCEL_REASONS;
    set({ sheet: null });
    if (!matchId || st.cReason < 0) return;
    try {
      await api.post(`/api/matches/${matchId}/cancel`, {
        reason: reasons[st.cReason] ?? "Other",
      });
    } catch (error) {
      set({ cReason: -1 });
      get().showToast("Couldn't cancel", (error as Error).message);
      return;
    }
    set({ cReason: -1 });
    if (isWorker) {
      get().showToast("Gig cancelled", "Recorded on your profile — the posting reopened for others");
      await get().loadWorker();
    } else {
      get().showToast("Gig cancelled", "The worker was notified · posting closed");
      set({ pinDigits: null, pinIssued: false });
      await get().loadEmployer();
    }
  },
  cancelPosting: async () => {
    const st = get();
    set({ sheet: null });
    if (!eGigId) return;
    try {
      await api.post(`/api/gigs/${eGigId}/cancel`, {
        reason: EMPLOYER_CANCEL_REASONS[st.cReason] ?? "Other",
      });
    } catch (error) {
      set({ cReason: -1 });
      get().showToast("Couldn't cancel the posting", (error as Error).message);
      return;
    }
    set({ cReason: -1 });
    get().showToast("Posting cancelled", "Applicants were released — post again anytime");
    await get().loadEmployer();
  },

  markChatRead: () => set({ unread: 0 }),
  sendChat: async (text) => {
    const t = text.trim();
    const matchId = get().role === "worker" ? wMatchId : eMatchId;
    if (!t || !matchId) return;
    await api.post(`/api/matches/${matchId}/messages`, { body: t }).catch(() => {});
  },

  /* ----------------------------- employer data ---------------------------- */

  loadEmployer: async () => {
    const uid = get().userId;
    if (!uid) return;
    const p = get().profile;
    const bizLoc = { lat: p?.lat ?? MACTAN_CENTER.lat, lng: p?.lng ?? MACTAN_CENTER.lng };

    // Sweep POSTED gigs past their expiry so the console reflects EXPIRED
    await supabase.rpc("expire_stale_gigs");
    const { data: g } = await supabase
      .from("gigs")
      .select("*")
      .eq("employer_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!g || !["POSTED", "MATCHED", "COMPLETED"].includes(g.status)) {
      eGigId = null;
      eMatchId = null;
      matchedApplicant = null;
      applicantIndex = {};
      set({ posted: false, posting: null, eStatus: null, apps: [], matchedId: null, pinIssued: false, noShowDone: false });
      await loadChat(get, null);
      return;
    }
    eGigId = g.id;

    const [appsRes, matchRes, noShowRes] = await Promise.all([
      supabase
        .from("applications")
        .select("*, worker:profiles!applications_worker_id_fkey(*)")
        .eq("gig_id", g.id)
        .eq("status", "APPLIED")
        .order("created_at"),
      supabase
        .from("matches")
        .select("*, worker:profiles!matches_worker_id_fkey(*)")
        .eq("gig_id", g.id)
        .in("status", ["MATCHED", "IN_PROGRESS", "COMPLETED"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("matches").select("id").eq("gig_id", g.id).eq("status", "NO_SHOW").limit(1).maybeSingle(),
    ]);

    const appRows = (appsRes.data ?? []) as unknown as Array<
      { id: string; worker: ProfileRow }
    >;
    applicantIndex = {};
    const appVMs = appRows.map((a) => {
      const vm = mapApplicant(a.worker, bizLoc);
      applicantIndex[vm.id] = vm;
      return { appId: a.id, vm };
    });
    // applicant VM ids are worker profile ids; remember application ids for select
    applicationIdByWorker = Object.fromEntries(appVMs.map((a) => [a.vm.id, a.appId]));

    const m = matchRes.data as
      | (NonNullable<typeof matchRes.data> & { worker: ProfileRow })
      | null;

    let eStatus: EmployerStatus | null = g.status === "POSTED" ? "POSTED" : null;
    let matchedId: string | null = null;
    let pinIssued = false;

    if (m) {
      eMatchId = m.id;
      matchedApplicant = mapApplicant(m.worker, bizLoc);
      matchedId = m.worker_id;
      pinIssued = !!m.pin_issued_at;
      const { data: rv } = await supabase
        .from("reviews")
        .select("id")
        .eq("match_id", m.id)
        .eq("rater_id", uid)
        .maybeSingle();
      eStatus = m.status === "COMPLETED" && rv ? "RATED" : (m.status as EmployerStatus);
      await loadChat(get, m.id);
    } else {
      eMatchId = null;
      matchedApplicant = null;
      await loadChat(get, null);
    }

    set({
      posted: true,
      posting: {
        title: g.title,
        pay: g.pay,
        meta: `₱${g.pay} · ${g.when_label} · ${g.area}`,
        expiresIn: Math.max(0, Math.round((new Date(g.expires_at).getTime() - Date.now()) / 3600000)),
        status: g.status,
      },
      eStatus,
      apps: appVMs.map((a) => a.vm.id),
      matchedId,
      pinIssued,
      noShowDone: !!noShowRes.data,
    });
  },

  setPostField: (patch) => set(patch),
  setPfSlots: (delta) => set({ pfSlots: Math.min(5, Math.max(1, get().pfSlots + delta)) }),

  postGig: async () => {
    const st = get();
    const p = st.profile;
    const payNum = parseInt(st.pfPay, 10);
    if (!st.pfTitle.trim() || !payNum) return "Add a title and pay amount.";
    try {
      await api.post("/api/gigs", {
        title: st.pfTitle.trim(),
        type: st.pfType,
        description: st.pfDesc,
        pay: payNum,
        duration: st.pfDur,
        whenLabel: `${st.pfWhen} · ${st.pfTime}`,
        area: p?.area ?? "Mactan",
        lat: p?.lat ?? MACTAN_CENTER.lat,
        lng: p?.lng ?? MACTAN_CENTER.lng,
        slots: st.pfSlots,
      });
    } catch (error) {
      return (error as Error).message;
    }
    get().showToast("Gig posted — free", "Live now · visible to workers within 3 km");
    await get().loadEmployer();
    return null;
  },

  confirmMatch: async () => {
    const workerId = get().confirmId;
    const appId = workerId ? applicationIdByWorker[workerId] : null;
    set({ sheet: null });
    if (!appId) return;
    try {
      await api.post(`/api/applications/${appId}/select`);
    } catch (error) {
      get().showToast("Couldn't match", (error as Error).message);
      return;
    }
    notify();
    get().showToast("Matched — the gig is on", "billable_event logged · ₱0 during pilot");
    await get().loadEmployer();
  },

  issuePin: async () => {
    if (!eMatchId) return;
    let pin: string;
    try {
      ({ pin } = await api.post<{ pin: string }>(`/api/matches/${eMatchId}/pin`));
    } catch (error) {
      get().showToast("Couldn't issue PIN", (error as Error).message);
      return;
    }
    set({ pinIssued: true, pinDigits: pin });
    get().showToast(
      `PIN issued · ${pin.split("").join(" ")}`,
      "One-time · valid 24 h · tell it to your worker",
    );
  },

  reportNoShow: async () => {
    set({ sheet: null });
    if (!eMatchId) return;
    try {
      await api.post(`/api/matches/${eMatchId}/no-show`);
    } catch (error) {
      get().showToast("Couldn't record no-show", (error as Error).message);
      return;
    }
    set({ pinDigits: null, pinIssued: false });
    get().showToast("No-show recorded", "Logged on the worker's profile · slot reopened for other applicants");
    await get().loadEmployer();
  },

  setEStars: (n) => set({ eStars: n }),
  toggleEtag: (tag) => set({ etags: { ...get().etags, [tag]: !get().etags[tag] } }),
  setEComment: (v) => set({ eComment: v }),
  submitERate: async () => {
    const st = get();
    if (st.eStars === 0 || !eMatchId) return;
    try {
      await api.post(`/api/matches/${eMatchId}/review`, {
        stars: st.eStars,
        tags: Object.keys(st.etags).filter((k) => st.etags[k]),
        comment: st.eComment,
      });
    } catch (error) {
      get().showToast("Couldn't post review", (error as Error).message);
      return;
    }
    set({ eStatus: "RATED" });
    get().showToast("Review posted", "Visible on their profile for future businesses");
    await get().loadEmployer();
  },
  skipERate: () => set({ eStatus: "RATED" }),
}));

/* ------------------------------ status maps ------------------------------ */

export const workerStatusIndex: Record<WorkerStatus, number> = {
  APPLIED: 0,
  MATCHED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 4,
  RATED: 4,
};

export const employerStatusIndex: Record<EmployerStatus, number> = {
  POSTED: 0,
  MATCHED: 1,
  IN_PROGRESS: 2,
  COMPLETED: 4,
  RATED: 4,
};

export const WORKER_BADGES: Record<WorkerStatus, { t: string; bg: string; c: string }> = {
  APPLIED: { t: "APPLIED", bg: "#E7EDF8", c: "#0B2E6F" },
  MATCHED: { t: "MATCHED", bg: "#103F96", c: "#FFFFFF" },
  IN_PROGRESS: { t: "IN_PROGRESS", bg: "#F5A623", c: "#0F1B2E" },
  COMPLETED: { t: "COMPLETED", bg: "#1AA75A", c: "#FFFFFF" },
  RATED: { t: "COMPLETED", bg: "#1AA75A", c: "#FFFFFF" },
};

export const EMPLOYER_BADGES: Record<EmployerStatus, { t: string; bg: string; c: string }> = {
  POSTED: { t: "LIVE", bg: "#1AA75A", c: "#FFFFFF" },
  MATCHED: { t: "MATCHED", bg: "#103F96", c: "#FFFFFF" },
  IN_PROGRESS: { t: "IN_PROGRESS", bg: "#F5A623", c: "#0F1B2E" },
  COMPLETED: { t: "COMPLETED", bg: "#1AA75A", c: "#FFFFFF" },
  RATED: { t: "COMPLETED", bg: "#1AA75A", c: "#FFFFFF" },
};
