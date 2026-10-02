// Core domain types. These mirror the Postgres schema in
// supabase/migrations and are what the UI renders from, whether the data
// comes from Supabase or the local fixture.

import type { Stage } from "./stages";

export type Side = "buyer" | "seller";
export type Initiator = "seller" | "buyer";
export type MembershipScope = "account" | "deal";

export interface Org {
  id: string;
  name: string;
  slug: string;
}

export interface Account {
  id: string;
  orgId: string;
  name: string; // "Microsoft · Xbox"
  parentName?: string; // "Microsoft"
  logoText: string; // fallback monogram until logos are uploaded
  logoColor: string;
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
}

export interface Person {
  id: string;
  name: string;
  email: string;
  title?: string;
  company: string;
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

export type DocumentKind = "deck" | "doc" | "sheet" | "pdf";
export type DocumentSource = "upload" | "google_drive" | "onedrive" | "live_link";

export interface DocumentSection {
  id: string;
  heading: string;
  page: number;
  text: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  number: number; // 1, 2, 3 …
  committedAt: string; // ISO timestamp
  sharedByPersonId: string;
  summary: string;
  pageCount: number;
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
  versions: DocumentVersion[]; // ascending by number
}

export type MomentKind = "email" | "call" | "document" | "pending";
export type ChangeKind = "changed" | "new" | "decided";

export interface MomentChange {
  documentId: string;
  kind: ChangeKind;
  text: string;
}

export interface TimelineMoment {
  id: string;
  spaceId: string;
  kind: MomentKind;
  occurredAt: string; // ISO timestamp; for pending this is the due date
  title: string;
  summary: string;
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
  authorPersonId: string;
  subject: string;
  summary: string;
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
