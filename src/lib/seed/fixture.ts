// Seed fixture: Lumen Interactive · Arcadia — Summer Creator Package ($120K),
// sold by Northlight Media. Content mirrors the Client Space v7 design.
//
// Everything here is fictional and safe to share: brands, people, documents
// and numbers are invented. Don't put real client data in this file. This is the
// single source of truth for demo data: the UI renders from it when Supabase
// isn't configured, and scripts/gen-seed-sql.ts turns it into
// supabase/seed.sql.
//
// Must stay free of runtime imports so Node can run the generator directly.

import type {
  ChangeKind,
  ClientSpaceView,
  CorrespondenceEntry,
  DocumentKind,
  DocumentSection,
  MomentKind,
  Presence,
  Side,
  SpaceDocument,
  TimelineMoment,
} from "../domain/types";

const SPACE = "spc_arcadia_summer";
const DEAL = "deal_arcadia_summer";
const ACCOUNT = "acct_arcadia";

export const DEMO_LINK_TOKEN = "demo-arcadia-summer";

/** "Sep 22" → ISO timestamp at midday UTC, 2026. */
const at = (day: string) => {
  const [mon, d] = day.split(" ");
  const m = { Aug: "08", Sep: "09", Oct: "10" }[mon];
  return `2026-${m}-${d.padStart(2, "0")}T12:00:00Z`;
};

// ─── People ─────────────────────────────────────────────────────────────────

type PersonRow = [id: string, name: string, title: string, side: Side, color: string, presence: Presence];
const PEOPLE: PersonRow[] = [
  ["AR", "Alex Romero", "Brand manager", "buyer", "#7c8b6f", { kind: "viewing" }],
  ["KL", "Kim Lee", "Media lead", "buyer", "#a08a9a", { kind: "seen", at: at("Sep 30") }],
  ["SP", "Sam Patel", "Agency planner", "buyer", "#8f8a7c", { kind: "invited", at: at("Sep 30") }],
  ["MC", "Maya Chen", "Sales lead", "seller", "#8a7f73", { kind: "viewing" }],
  ["JA", "Jordan Ali", "Strategy", "seller", "#c07a4f", { kind: "seen", at: at("Sep 29") }],
  ["PR", "Priya Rao", "Measurement", "seller", "#6f8a9a", { kind: "seen", at: at("Sep 26") }],
];
const pid = (initials: string) => `p_${initials.toLowerCase()}`;

// ─── Documents ──────────────────────────────────────────────────────────────

let sectionSeq = 0;
const S = (number: number, heading: string, ...paragraphs: string[]): DocumentSection => ({
  id: `sec_${++sectionSeq}`,
  number,
  heading,
  paragraphs,
});

type VersionRow = { by: string; when: string; summary: string; sections: DocumentSection[] };
const doc = (
  id: string,
  kind: DocumentKind,
  title: string,
  position: number,
  pinned: boolean,
  versions: VersionRow[],
): SpaceDocument => ({
  id,
  spaceId: SPACE,
  title,
  kind,
  source: "google_drive",
  pinned,
  position,
  versions: versions.map((v, i) => ({
    id: `${id}_v${i + 1}`,
    documentId: id,
    number: i + 1,
    committedAt: at(v.when),
    sharedByPersonId: pid(v.by),
    summary: v.summary,
    sections: v.sections,
  })),
});

const DOCUMENTS: SpaceDocument[] = [
  doc("proposal", "doc", "Summer Creator Proposal", 0, false, [
    { by: "MC", when: "Sep 9", summary: "Fourteen creators across three tiers over a two-month flight, $128K.", sections: [
      S(1, "Overview", "Fourteen creators across three tiers over a two-month flight."),
      S(2, "Pricing", "Total investment $128,000."),
    ] },
    { by: "MC", when: "Sep 15", summary: "Thirteen creators across three tiers over June and July, $124K.", sections: [
      S(1, "Overview", "Thirteen creators across three tiers, June and July."),
      S(2, "Creator roster", "Tier 1: four creators. Tier 2: five creators. Tier 3: four creators."),
      S(3, "Pricing", "Total investment $124,000."),
    ] },
    { by: "MC", when: "Sep 22", summary: "Twelve creators across three tiers, June to August, anchored by two tentpole streams.", sections: [
      S(1, "Overview", "Twelve creators across three tiers deliver a three-month presence on Twitch and YouTube, anchored by two tentpole livestreams aligned to Arcadia Pass summer drops."),
      S(2, "Creator roster", "Tier 1: three creators with dedicated streams and integrated segments. Tier 2: five creators running sponsored sessions plus short-form cutdowns. Tier 3: four creators providing community posts and codes."),
      S(3, "Pricing", "Tier 1 $54,000. Tier 2 $42,000. Tier 3 $14,000. Production and reporting $10,000. Total $120,000.", "Payment terms: 50% on signature, 50% on completion of the August flight."),
      S(4, "Flight plan", "June launches the roster with a Tier 1 tentpole stream. July sustains weekly sponsored sessions. August closes with the second tentpole and a community recap.", "Creative approvals run on a 48-hour turnaround with Arcadia brand marketing."),
    ] },
  ]),
  doc("deck", "slides", "Walkthrough Deck", 1, false, [
    { by: "JA", when: "Sep 25", summary: "Slides from the September 25 call: tiers, roster, and measurement.", sections: [
      S(1, "Agenda", "Package tiers, creator roster, measurement approach, next steps."),
      S(2, "Next steps", "Arcadia to share feedback on tiers by October 6."),
    ] },
  ]),
  doc("shortlist", "sheet", "Creator Shortlist", 2, false, [
    { by: "MC", when: "Sep 12", summary: "Eighteen candidates under review across Twitch and YouTube.", sections: [
      S(1, "Shortlist", "Eighteen candidates under review across Twitch and YouTube."),
    ] },
    { by: "MC", when: "Sep 22", summary: "The twelve selected creators with audience fit, reach, and alternates.", sections: [
      S(1, "Selection", "Twelve creators selected from eighteen reviewed, grouped by reach and format."),
      S(2, "Alternates", "Two alternates are held per tier in case of availability conflicts in June."),
    ] },
  ]),
  doc("measure", "doc", "Measurement Plan", 3, false, [
    { by: "PR", when: "Sep 26", summary: "How reach, sentiment, and Arcadia Pass trials are tracked and reported.", sections: [
      S(1, "Metrics", "View-through, qualified sentiment, and Arcadia Pass trial sign-ups via creator codes."),
      S(2, "Reporting", "Monthly reports during the flight and a wrap report two weeks after close."),
    ] },
  ]),
  doc("brief", "doc", "Summer Brief", 4, true, [
    { by: "AR", when: "Sep 2", summary: "Your original brief: 18–34 gamers on Twitch and YouTube, $100–130K.", sections: [
      S(1, "Objective", "Cultural reach among 18–34 gamers for the Arcadia Pass summer lineup."),
      S(2, "Budget", "$100,000–130,000 inclusive of fees, production, and reporting."),
    ] },
  ]),
];

// ─── Timeline ───────────────────────────────────────────────────────────────

type Note = [kind: ChangeKind, text: string, documentId?: string];
const moment = (
  id: string,
  kind: MomentKind,
  day: string,
  title: string,
  meta: string,
  notes: Note[],
): TimelineMoment => ({
  id,
  spaceId: SPACE,
  kind,
  occurredAt: at(day),
  title,
  meta,
  changes: notes.map(([k, text, documentId]) => ({ kind: k, text, documentId })),
});

const MOMENTS: TimelineMoment[] = [
  moment("m_outreach", "email", "Aug 26", "Initial outreach", "Email", [
    ["asked", "Creator program pitched for the Arcadia Pass summer"],
  ]),
  moment("m_brief", "document", "Sep 2", "RFP and brief received", "Document", [
    ["new", "Brief shared by Alex Romero", "brief"],
    ["decided", "18–34 gamers on Twitch and YouTube", "brief"],
    ["decided", "Budget set at $100–130K", "brief"],
  ]),
  moment("m_first_call", "call", "Sep 5", "First call", "Call · 45 min", [
    ["decided", "Two tentpole streams anchor the flight", "brief"],
    ["changed", "TikTok moved to a secondary channel", "brief"],
    ["next", "First proposal by Sep 9"],
  ]),
  moment("m_v1", "document", "Sep 9", "Proposal v1 shared", "Document", [
    ["new", "v1: 14 creators, three tiers, $128K", "proposal"],
  ]),
  moment("m_v2_feedback", "email", "Sep 16", "Feedback on v2", "Email · 4 messages", [
    ["changed", "Tier 1 cut from four creators to three", "proposal"],
    ["changed", "Flight extended through August", "proposal"],
    ["changed", "One Tier 1 creator to be dropped", "shortlist"],
    ["next", "Revised proposal by Sep 22"],
  ]),
  moment("m_v3", "document", "Sep 22", "Proposal v3 shared", "Document", [
    ["new", "v3: 12 creators, total down to $120K", "proposal"],
    ["new", "v2: twelve selected, two alternates per tier", "shortlist"],
  ]),
  moment("m_walkthrough", "call", "Sep 25", "Proposal walkthrough", "Call · 35 min", [
    ["new", "Walkthrough slides shared after the call", "deck"],
    ["asked", "Swap one Tier 2 creator", "shortlist"],
    ["asked", "How Arcadia Pass trials are measured"],
    ["next", "Measurement plan Sep 26"],
  ]),
  moment("m_feedback_due", "pending", "Oct 6", "Your feedback on tiers", "Due", [
    ["next", "Your consolidated feedback on the tiers", "proposal"],
  ]),
];

// ─── Correspondence ─────────────────────────────────────────────────────────

type MailRow = [momentId: string, day: string, call: boolean, subject: string, summary: string, people: string[], meta: string];
const MAIL: MailRow[] = [
  ["m_outreach", "Aug 26", false, "Creator program idea", "Northlight pitched a summer creator program for Arcadia Pass.", ["MC", "AR"], "2 messages"],
  ["m_brief", "Sep 2", false, "Brief received", "Summer brief shared with a $100–130K budget.", ["AR", "MC"], "1 message"],
  ["m_first_call", "Sep 5", true, "First call", "Agreed two tentpole streams; TikTok moved to secondary.", ["MC", "JA", "AR", "KL"], "45 min"],
  ["m_v1", "Sep 9", false, "Proposal v1 sent", "Fourteen creators across three tiers at $128K.", ["MC", "AR"], "1 message"],
  ["m_v2_feedback", "Sep 15", false, "Proposal v2 sent", "Thirteen creators over June and July at $124K.", ["MC", "AR"], "1 message"],
  ["m_v2_feedback", "Sep 16", false, "Feedback on v2", "Fewer Tier 1 creators and a longer flight requested.", ["AR", "KL", "MC"], "4 messages"],
  ["m_v3", "Sep 22", false, "Proposal v3 sent", "Tier 1 reduced to three; flight extended through August.", ["MC", "AR"], "1 message"],
  ["m_walkthrough", "Sep 25", true, "Proposal walkthrough", "Asked about swapping one Tier 2 creator and trial measurement.", ["MC", "JA", "AR", "KL"], "35 min"],
  ["m_feedback_due", "Sep 30", false, "Follow-up on tier feedback", "Alex confirmed consolidated comments by Oct 6.", ["MC", "AR"], "3 messages"],
];

const CORRESPONDENCE: CorrespondenceEntry[] = MAIL.map(
  ([momentId, day, call, subject, summary, people, meta], i) => ({
    id: `c_${i + 1}`,
    spaceId: SPACE,
    momentId,
    kind: call ? "call" : "email",
    occurredAt: at(day),
    participantIds: people.map(pid),
    subject,
    summary,
    meta,
    reviewStatus: "approved",
  }),
);

// ─── View ───────────────────────────────────────────────────────────────────

export const fixture: ClientSpaceView = {
  org: { id: "org_northlight", name: "Northlight Media", shortName: "Northlight", slug: "northlight" },
  account: {
    id: ACCOUNT,
    orgId: "org_northlight",
    name: "Lumen Interactive · Arcadia",
    shortName: "Arcadia",
    logoUrl: "/logos/arcadia.svg",
  },
  deal: {
    id: DEAL,
    accountId: ACCOUNT,
    name: "Summer Creator Package",
    stage: "revisions",
    value: { amount: 120000, currency: "USD" },
    brief: {
      budget: { amount: 130000, currency: "USD" },
      audience: "18–34 gamers",
      platforms: ["Twitch", "YouTube"],
      flight: { start: "2027-06-01", end: "2027-08-31" },
      deliverables: ["Two tentpole livestreams", "Sponsored sessions", "Short-form cutdowns", "Community posts and codes"],
      measurement: ["View-through", "Qualified sentiment", "Arcadia Pass trial sign-ups"],
    },
  },
  space: {
    id: SPACE,
    dealId: DEAL,
    initiator: "seller",
    statusLabel: "Awaiting your feedback",
    statusDueDate: "2026-10-06",
    readOnly: false,
    buyerLeadId: pid("AR"),
    sellerLeadId: pid("MC"),
    suggestedQuestions: ["What changed in v3?", "Show the creator breakdown", "What's the measurement plan?"],
  },
  people: PEOPLE.map(([initials, name, title, side, color, presence]) => ({
    id: pid(initials),
    name,
    email: `${name.split(" ")[0].toLowerCase()}@${side === "buyer" ? "lumen" : "northlight"}.example`,
    title,
    side,
    avatarColor: color,
    membership: {
      personId: pid(initials),
      scope: "deal",
      scopeId: DEAL,
      side,
      presence,
    },
  })),
  documents: DOCUMENTS,
  moments: MOMENTS,
  correspondence: CORRESPONDENCE,
};
