// Core domain types. These mirror the Postgres schema in
// supabase/migrations and are what the UI renders from, whether the data
// comes from Supabase or the local fixture.

import type { Stage } from "./stages";

export type Side = "buyer" | "seller";
export type Initiator = "seller" | "buyer";
export type MembershipScope = "account" | "deal";

export interface Org {
  id: string;
  name: string; // "Northlight Media"
  shortName: string; // "Northlight"
  slug: string;
}

export interface Account {
  id: string;
  orgId: string;
  name: string; // "Lumen Interactive · Arcadia"
  shortName: string; // "Arcadia"
  logoUrl?: string;
}

/** Structured brief, kept alongside the brief document (v2 RFP readiness). */
export interface StructuredBrief {
  budget?: { amount: number; currency: string };
  audience?: string;
  platforms?: string[];
  flight?: { start: string; end: string };
  deliverables?: string[];
  measurement?: string[];
}

export interface Deal {
  id: string;
  accountId: string;
  name: string;
  stage: Stage;
  value?: { amount: number; currency: string };
  brief?: StructuredBrief;
}

export interface Space {
  id: string;
  dealId: string;
  initiator: Initiator;
  /** Client-facing status line, e.g. "Awaiting your feedback". */
  statusLabel: string;
  statusDueDate?: string; // ISO date
  readOnly: boolean;
  /** Leads shown in the header ("Arcadia lead", "Northlight lead"). */
  buyerLeadId?: string;
  sellerLeadId?: string;
  /** Suggested question chips under the chat bar. */
  suggestedQuestions: string[];
}

export interface Person {
  id: string;
  name: string;
  email: string;
  title?: string;
  side: Side;
  avatarColor: string;
}

export type Presence =
  | { kind: "viewing" }
  | { kind: "seen"; at: string }
  | { kind: "invited"; at: string };

export interface Membership {
  personId: string;
  scope: MembershipScope;
  /** account id or deal id depending on scope */
  scopeId: string;
  side: Side;
  presence: Presence;
}

export type DocumentKind = "doc" | "slides" | "sheet";
export type DocumentSource = "upload" | "google_drive" | "onedrive" | "live_link";

export interface DocumentSection {
  id: string;
  number: number; // §1, §2 …
  heading: string;
  paragraphs: string[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  number: number; // 1, 2, 3 …
  committedAt: string; // ISO timestamp
  sharedByPersonId: string;
  summary: string;
  /** Text extracted from the committed snapshot, split into citable sections. */
  sections: DocumentSection[];
  /** Path in the private storage bucket; absent for fixture data. */
  storagePath?: string;
}

export interface SpaceDocument {
  id: string;
  spaceId: string;
  title: string;
  kind: DocumentKind;
  source: DocumentSource;
  pinned: boolean;
  position: number; // seller-defined order after pinned documents
  versions: DocumentVersion[]; // ascending by number
}

export type MomentKind = "email" | "call" | "document" | "pending";
export type ChangeKind = "new" | "decided" | "changed" | "next" | "asked";

/** A note on a moment. With a documentId it shows on that document's card;
 *  without one it shows in the moment banner. */
export interface MomentChange {
  documentId?: string;
  kind: ChangeKind;
  text: string;
}

export interface TimelineMoment {
  id: string;
  spaceId: string;
  kind: MomentKind;
  occurredAt: string; // ISO timestamp; for pending this is the due date
  title: string;
  /** "Call · 45 min", "Email · 4 messages", "Document", "Due" */
  meta: string;
  changes: MomentChange[];
}

export type CorrespondenceKind = "email" | "call" | "slack" | "note";
export type ReviewStatus = "pending" | "approved" | "hidden";

export interface CorrespondenceEntry {
  id: string;
  spaceId: string;
  momentId?: string;
  kind: CorrespondenceKind;
  occurredAt: string;
  participantIds: string[];
  subject: string;
  summary: string;
  /** "2 messages", "45 min" */
  meta: string;
  /** Link back to the exact source thread/message. Owner-side only. */
  sourceUrl?: string;
  reviewStatus: ReviewStatus;
}

/** Everything the client space page needs, already filtered for the buyer. */
export interface ClientSpaceView {
  org: Org;
  account: Account;
  deal: Deal;
  space: Space;
  people: (Person & { membership: Membership })[];
  documents: SpaceDocument[];
  moments: TimelineMoment[];
  correspondence: CorrespondenceEntry[];
}
