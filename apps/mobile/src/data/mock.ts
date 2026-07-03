/**
 * Pilot-zone demo data, ported from GigOn App.dc.html.
 * Swapped for API responses when the backend lands (see store/gig-store.ts).
 */

export type GigType = "Cleaning" | "Laundry" | "Delivery" | "Errands";

export interface Gig {
  id: string;
  t: string;
  biz: string;
  area: string;
  type: GigType;
  pay: number;
  hrs: string;
  when: string;
  dist: string;
  slots: string;
  /** Map pin position, % of the explore map. */
  mx: number;
  my: number;
  /** Bob animation stagger (s). */
  bob: number;
  desc: string;
  er: string;
  einit: string;
  erate: string;
  ejobs: number;
  since: string;
}

export interface Applicant {
  id: string;
  name: string;
  init: string;
  rt: string;
  jobs: number;
  ns: string;
  nsBad: boolean;
  dist: string;
  tags: string;
  note: string;
}

export const GIGS: Gig[] = [
  {
    id: "g1", t: "Café deep clean", biz: "Kape Lokal", area: "Pusok", type: "Cleaning",
    pay: 350, hrs: "2 hrs", when: "Today · 2:00 – 4:00 PM", dist: "400 m", slots: "1 slot",
    mx: 46, my: 34, bob: 0,
    desc: "Full clean of the dining area and kitchen after the lunch rush — mop, wipe-down, dish backlog. Mop and supplies provided; no experience needed.",
    er: "Rico Villanueva", einit: "KL", erate: "4.8", ejobs: 26, since: "Mar 2026",
  },
  {
    id: "g2", t: "Fold & press laundry", biz: "Wash Day Laundromat", area: "Basak", type: "Laundry",
    pay: 250, hrs: "2 hrs", when: "Today · 3:00 – 5:00 PM", dist: "650 m", slots: "2 slots",
    mx: 27, my: 52, bob: 0.6,
    desc: "Fold, press and bag customer laundry for afternoon pickups. Steam press training on the spot.",
    er: "Len Dimataga", einit: "WD", erate: "4.7", ejobs: 18, since: "Apr 2026",
  },
  {
    id: "g3", t: "Package run to Newtown", biz: "Marigondon Pharmacy", area: "Marigondon", type: "Delivery",
    pay: 180, hrs: "1 hr", when: "Today · 1:30 PM", dist: "1.1 km", slots: "1 slot",
    mx: 63, my: 66, bob: 0.3,
    desc: "Deliver two sealed parcels to Mactan Newtown reception. Own motorbike preferred, walking OK.",
    er: "Cora Yap", einit: "MP", erate: "4.9", ejobs: 31, since: "Feb 2026",
  },
  {
    id: "g4", t: "Market errand + delivery", biz: "Nanay Cora's Eatery", area: "Pajo", type: "Errands",
    pay: 200, hrs: "1.5 hrs", when: "Tomorrow · 7:00 AM", dist: "900 m", slots: "1 slot",
    mx: 36, my: 20, bob: 0.9,
    desc: "Buy the morning market list (provided) and deliver to the eatery before opening.",
    er: "Cora Abella", einit: "NC", erate: "4.6", ejobs: 12, since: "May 2026",
  },
  {
    id: "g5", t: "Dish crew — dinner rush", biz: "Sugbo Grill Mactan", area: "Newtown", type: "Cleaning",
    pay: 400, hrs: "3 hrs", when: "Today · 6:00 – 9:00 PM", dist: "1.4 km", slots: "2 slots",
    mx: 72, my: 44, bob: 0.45,
    desc: "Dishwashing and bussing support for the Friday dinner rush. Meal included after shift.",
    er: "Jun Rama", einit: "SG", erate: "4.8", ejobs: 22, since: "Mar 2026",
  },
  {
    id: "g6", t: "Stockroom sorting", biz: "Island Mart", area: "Agus", type: "Errands",
    pay: 300, hrs: "2 hrs", when: "Tomorrow · 9:00 AM", dist: "1.8 km", slots: "1 slot",
    mx: 55, my: 13, bob: 0.75,
    desc: "Sort and shelve the weekly delivery in the stockroom. Lifting up to 15 kg.",
    er: "Mae Sy", einit: "IM", erate: "4.5", ejobs: 9, since: "Jun 2026",
  },
];

export const APPLICANTS: Applicant[] = [
  {
    id: "a1", name: "Analyn Dela Cruz", init: "AD", rt: "4.9", jobs: 41,
    ns: "0 no-shows", nsBad: false, dist: "350 m", tags: "Cleaning · Laundry", note: "Available now",
  },
  {
    id: "a2", name: "Jomar Bacus", init: "JB", rt: "4.6", jobs: 17,
    ns: "1 cancel · 30 d", nsBad: true, dist: "800 m", tags: "Cleaning", note: "Free after 1 PM",
  },
  {
    id: "a3", name: "Grace Tampus", init: "GT", rt: "New", jobs: 2,
    ns: "0 no-shows", nsBad: false, dist: "1.2 km", tags: "Errands · Cleaning", note: "First week on GigOn",
  },
];

export const DEMO_PIN = "4821";

export const FILTERS = ["All", "Cleaning", "Laundry", "Delivery", "Errands"] as const;

export const WORKER_RATE_TAGS = [
  "Paid exactly as agreed",
  "On time",
  "Clear instructions",
  "Would work again",
];

export const EMPLOYER_RATE_TAGS = [
  "On time",
  "Quality work",
  "Followed instructions",
  "Would hire again",
];

export const DISPUTE_REASONS = [
  "PIN doesn't match what happened",
  "Pay was different than agreed",
  "Work quality / other",
];

export function gigById(id: string | null | undefined): Gig {
  return GIGS.find((g) => g.id === id) ?? GIGS[0]!;
}

export function applicantById(id: string | null | undefined): Applicant {
  return APPLICANTS.find((a) => a.id === id) ?? APPLICANTS[0]!;
}

export function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}
