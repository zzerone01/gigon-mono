/**
 * Demo state machine — a faithful port of the GigOn App.dc.html prototype
 * logic (PRD §4.1). All "server" behaviour is simulated with timers so the
 * full loop can be played end-to-end without a backend; swap the actions'
 * bodies for API calls when the backend lands.
 */
import * as Haptics from "expo-haptics";
import { create } from "zustand";

import { APPLICANTS, DEMO_PIN, applicantById, firstName, gigById } from "../data/mock";

export type Role = "worker" | "employer";
export type WorkerStatus = "APPLIED" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "RATED";
export type EmployerStatus = "POSTED" | "MATCHED" | "IN_PROGRESS" | "COMPLETED" | "RATED";
export type SheetKind = "match" | "noshow" | "dispute";

export interface ChatMsg {
  me: boolean;
  text: string;
  time: string;
}

export interface ToastData {
  id: number;
  title: string;
  body: string;
  /** Route pushed when the toast is tapped. */
  route?: string;
}

interface GigState {
  role: Role;
  onbRole: Role;

  // worker
  applied: Record<string, boolean>;
  wStatus: WorkerStatus | null;
  wGig: string | null;
  unread: number;
  pin: string;
  pinTries: number;
  pinErr: string;
  pinLock: number;
  stars: number;
  rtags: Record<string, boolean>;
  comment: string;
  dReason: number;
  dText: string;
  dFiled: boolean;

  // employer
  posted: boolean;
  eStatus: EmployerStatus | null;
  apps: string[];
  confirmId: string | null;
  matchedId: string | null;
  pinIssued: boolean;
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
  wChat: ChatMsg[];
  eChat: ChatMsg[];
  toast: ToastData | null;
  sheet: SheetKind | null;

  // actions
  setOnbRole: (r: Role) => void;
  finishOnboarding: () => void;
  setRole: (r: Role) => void;
  restart: () => void;
  showToast: (title: string, body: string, route?: string) => void;
  dismissToast: () => void;
  openSheet: (s: SheetKind, confirmId?: string) => void;
  closeSheet: () => void;

  apply: (gigId: string) => void;
  arrive: () => void;
  enterPinDigit: (d: string) => void;
  deletePinDigit: () => void;
  resetPin: () => void;
  setStars: (n: number) => void;
  toggleRtag: (tag: string) => void;
  setComment: (v: string) => void;
  submitRate: () => void;
  skipRate: () => void;
  setDReason: (i: number) => void;
  setDText: (v: string) => void;
  fileDispute: () => void;
  markChatRead: () => void;
  sendChat: (text: string) => void;

  setPostField: (patch: Partial<Pick<GigState, "pfType" | "pfTitle" | "pfWhen" | "pfTime" | "pfDur" | "pfPay" | "pfDesc">>) => void;
  setPfSlots: (delta: number) => void;
  postGig: () => void;
  confirmMatch: () => void;
  issuePin: () => void;
  reportNoShow: () => void;
  setEStars: (n: number) => void;
  toggleEtag: (tag: string) => void;
  setEComment: (v: string) => void;
  submitERate: () => void;
  skipERate: () => void;
}

const timers = new Set<ReturnType<typeof setTimeout>>();
let lockInterval: ReturnType<typeof setInterval> | null = null;
let toastSeq = 0;

function after(ms: number, fn: () => void) {
  const t = setTimeout(() => {
    timers.delete(t);
    fn();
  }, ms);
  timers.add(t);
}

function clearAllTimers() {
  timers.forEach(clearTimeout);
  timers.clear();
  if (lockInterval) {
    clearInterval(lockInterval);
    lockInterval = null;
  }
}

function notify() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

const initialFlow = {
  applied: {},
  wStatus: null,
  wGig: null,
  unread: 0,
  pin: "",
  pinTries: 0,
  pinErr: "",
  pinLock: 0,
  stars: 0,
  rtags: {},
  comment: "",
  dReason: -1,
  dText: "",
  dFiled: false,
  posted: false,
  eStatus: null,
  apps: [],
  confirmId: null,
  matchedId: null,
  pinIssued: false,
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
  wChat: [] as ChatMsg[],
  eChat: [] as ChatMsg[],
  toast: null,
  sheet: null,
} satisfies Partial<GigState>;

export const useGigStore = create<GigState>((set, get) => ({
  role: "worker",
  onbRole: "worker",
  ...initialFlow,

  setOnbRole: (r) => set({ onbRole: r }),
  finishOnboarding: () => set({ role: get().onbRole }),
  setRole: (r) => set({ role: r }),

  restart: () => {
    clearAllTimers();
    set({ ...initialFlow, role: get().role });
  },

  showToast: (title, body, route) => {
    const id = ++toastSeq;
    set({ toast: { id, title, body, route } });
    after(4400, () => {
      if (get().toast?.id === id) set({ toast: null });
    });
  },
  dismissToast: () => set({ toast: null }),

  openSheet: (s, confirmId) =>
    set({ sheet: s, ...(confirmId !== undefined ? { confirmId } : {}) }),
  closeSheet: () => set({ sheet: null }),

  // ---------- worker flow ----------
  apply: (gigId) => {
    if (get().applied[gigId]) return;
    const g = gigById(gigId);
    set({
      applied: { ...get().applied, [gigId]: true },
      wStatus: "APPLIED",
      wGig: gigId,
    });
    get().showToast("Application sent", `${g.biz} is reviewing applicants — 1-tap, no cover letter`);
    after(3400, () => {
      const gg = gigById(get().wGig);
      set({
        wStatus: "MATCHED",
        unread: 1,
        wChat: [
          {
            me: false,
            text: `Hi Marites! ${firstName(gg.er)} here from ${gg.biz} — see you at 2 PM. Entrance is beside Pusok Elementary.`,
            time: "1:12 PM",
          },
        ],
      });
      notify();
      get().showToast("You're matched — your gig is on!", `${gg.biz} picked you · tap to open`, "/active");
    });
  },

  arrive: () => {
    set({ wStatus: "IN_PROGRESS" });
    get().showToast("Arrival logged · IN_PROGRESS", "Recorded in the append-only audit log");
    after(1400, () => {
      set({
        wChat: [
          ...get().wChat,
          { me: false, text: "Perfect timing — supplies are in the back room. Salamat!", time: "2:01 PM" },
        ],
        unread: get().unread + 1,
      });
    });
  },

  enterPinDigit: (d) => {
    const st = get();
    if (st.pinLock > 0 || st.pin.length >= 4) return;
    const p = st.pin + d;
    set({ pin: p, pinErr: "" });
    if (p.length === 4) {
      after(320, () => {
        if (p === DEMO_PIN) {
          notify();
          set({ wStatus: "COMPLETED", pin: "", pinTries: 0 });
          get().showToast("PIN verified · COMPLETED", "Append-only log written — reviews unlocked");
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          const tr = get().pinTries + 1;
          if (tr >= 3) {
            set({ pin: "", pinTries: 0, pinLock: 60, pinErr: "3 wrong attempts — locked for 60 s." });
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
          } else {
            set({ pin: "", pinTries: tr, pinErr: `PIN doesn't match — ${3 - tr} attempts left` });
          }
        }
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
  submitRate: () => {
    if (get().stars === 0) return;
    set({ wStatus: "RATED" });
    get().showToast("Review posted", "Reviews only exist on PIN-completed gigs — that keeps them honest");
  },
  skipRate: () => set({ wStatus: "RATED" }),

  setDReason: (i) => set({ dReason: i }),
  setDText: (v) => set({ dText: v }),
  fileDispute: () => {
    if (get().dReason < 0) return;
    set({ dFiled: true, sheet: null });
    get().showToast("Dispute #D-1042 opened · DISPUTED", "The GigOn team reviews within 24 h");
  },

  markChatRead: () => set({ unread: 0 }),
  sendChat: (text) => {
    const t = text.trim();
    if (!t) return;
    const isW = get().role === "worker";
    const key = isW ? "wChat" : "eChat";
    const now = isW ? "2:03 PM" : "1:36 PM";
    set({ [key]: [...get()[key], { me: true, text: t, time: now }] } as Partial<GigState>);
    after(1700, () => {
      const reply = isW ? "Copy! See you." : "Noted po, thank you!";
      set({ [key]: [...get()[key], { me: false, text: reply, time: now }] } as Partial<GigState>);
    });
  },

  // ---------- employer flow ----------
  setPostField: (patch) => set(patch),
  setPfSlots: (delta) => set({ pfSlots: Math.min(5, Math.max(1, get().pfSlots + delta)) }),

  postGig: () => {
    set({ posted: true, eStatus: "POSTED", apps: [], noShowDone: false });
    get().showToast("Gig posted — free", "Live now · visible to workers within 3 km");
    after(2800, () => {
      if (get().eStatus !== "POSTED") return;
      set({ apps: ["a1"] });
      notify();
      get().showToast("New applicant", "Analyn D. applied — 350 m away · 4.9★", "/e-applicants");
    });
    after(6200, () => {
      if (get().eStatus !== "POSTED") return;
      set({ apps: get().noShowDone ? ["a2", "a3"] : ["a1", "a2", "a3"] });
      get().showToast("2 more applicants", "Compare distance, rating and history", "/e-applicants");
    });
  },

  confirmMatch: () => {
    const id = get().confirmId;
    const a = applicantById(id);
    set({ eStatus: "MATCHED", matchedId: a.id, sheet: null });
    notify();
    get().showToast("Matched — the gig is on", "billable_event #BE-1042 logged · ₱0 during pilot");
    after(1200, () => {
      set({
        eChat: [
          { me: false, text: `Hi po! This is ${firstName(a.name)} — accepted, on my way. 10 minutes out.`, time: "1:34 PM" },
        ],
      });
    });
    after(5200, () => {
      if (get().eStatus === "MATCHED") {
        get().showToast(`${firstName(a.name)} is on the way`, "ETA ~10 min · chat is open");
      }
    });
    after(9000, () => {
      if (get().eStatus === "MATCHED") {
        set({ eStatus: "IN_PROGRESS" });
        get().showToast(`${firstName(a.name)} arrived · IN_PROGRESS`, "She tapped “I've arrived” on site");
      }
    });
  },

  issuePin: () => {
    set({ pinIssued: true });
    get().showToast("PIN issued · 4 8 2 1", "One-time · valid 24 h · tell it to your worker");
    after(6000, () => {
      if (get().eStatus === "IN_PROGRESS") {
        set({ eStatus: "COMPLETED" });
        notify();
        get().showToast("PIN confirmed · COMPLETED", "Both sides confirmed — reviews unlocked", "/e-active");
      }
    });
  },

  reportNoShow: () => {
    set({
      noShowDone: true,
      matchedId: null,
      eStatus: "POSTED",
      apps: ["a2", "a3"],
      sheet: null,
      pinIssued: false,
    });
    get().showToast("No-show recorded", "Logged on Analyn's profile · slot reopened for other applicants");
  },

  setEStars: (n) => set({ eStars: n }),
  toggleEtag: (tag) => set({ etags: { ...get().etags, [tag]: !get().etags[tag] } }),
  setEComment: (v) => set({ eComment: v }),
  submitERate: () => {
    if (get().eStars === 0) return;
    set({ eStatus: "RATED" });
    get().showToast("Review posted", "Visible on her profile for future businesses");
  },
  skipERate: () => set({ eStatus: "RATED" }),
}));

/** Matched applicant (falls back to Analyn, as in the prototype). */
export function useMatchedApplicant() {
  const matchedId = useGigStore((s) => s.matchedId);
  return applicantById(matchedId);
}

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
