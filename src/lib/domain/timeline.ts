// Timeline-driven state for the client space. Selecting a moment shows every
// document at the version current on that date, the changes made at that
// moment, and the correspondence attached to it. No selection = today.

import type {
  CorrespondenceEntry,
  DocumentVersion,
  MomentChange,
  SpaceDocument,
  TimelineMoment,
} from "./types";

export interface DocumentAsOf {
  document: SpaceDocument;
  pinned: boolean;
  /** null when the document didn't exist yet at the selected moment. */
  version: DocumentVersion | null;
  /** Notes attached to this document at the selected moment. */
  changes: MomentChange[];
}

const day = (iso: string) => iso.slice(0, 10);

export function sortMoments(moments: TimelineMoment[]): TimelineMoment[] {
  return [...moments].sort((a, b) => {
    // The pending node always sits last.
    if (a.kind === "pending" && b.kind !== "pending") return 1;
    if (b.kind === "pending" && a.kind !== "pending") return -1;
    return a.occurredAt.localeCompare(b.occurredAt);
  });
}

export function latestVersion(doc: SpaceDocument): DocumentVersion {
  return doc.versions[doc.versions.length - 1];
}

/** The version current on the moment's day (moments are day-granular). */
export function versionAsOf(
  doc: SpaceDocument,
  at: string | null,
): DocumentVersion | null {
  const eligible = at
    ? doc.versions.filter((v) => day(v.committedAt) <= day(at))
    : doc.versions;
  return eligible.length ? eligible[eligible.length - 1] : null;
}

/** A pending moment is in the future, so it shows the current state. */
export function asOfDate(moment: TimelineMoment | null): string | null {
  return moment && moment.kind !== "pending" ? moment.occurredAt : null;
}

/** Pinned first (most recently pinned leftmost), then seller-defined order. */
export function sortDocuments(
  docs: SpaceDocument[],
  pinnedIds: string[] = docs.filter((d) => d.pinned).map((d) => d.id),
): SpaceDocument[] {
  const rank = (d: SpaceDocument) => {
    const p = pinnedIds.indexOf(d.id);
    return p >= 0 ? p - pinnedIds.length : d.position;
  };
  return [...docs].sort((a, b) => rank(a) - rank(b));
}

export function documentsAsOf(
  docs: SpaceDocument[],
  moment: TimelineMoment | null,
  pinnedIds?: string[],
): DocumentAsOf[] {
  const at = asOfDate(moment);
  const sorted = sortDocuments(docs, pinnedIds);
  const pinned = new Set(pinnedIds ?? docs.filter((d) => d.pinned).map((d) => d.id));
  return sorted.map((document) => {
    const version = versionAsOf(document, at);
    return {
      document,
      pinned: pinned.has(document.id),
      version,
      changes:
        moment && version
          ? moment.changes.filter((c) => c.documentId === document.id)
          : [],
    };
  });
}

/** Notes on a moment that aren't tied to a document, for the banner. */
export function generalNotes(moment: TimelineMoment): MomentChange[] {
  return moment.changes.filter((c) => !c.documentId);
}

/** Count of distinct documents touched at a moment, for the rail. */
export function documentsTouched(moment: TimelineMoment): number {
  return new Set(moment.changes.flatMap((c) => (c.documentId ? [c.documentId] : []))).size;
}

/** Approved correspondence, newest first, optionally filtered to a moment. */
export function correspondenceFor(
  entries: CorrespondenceEntry[],
  moment: TimelineMoment | null,
): CorrespondenceEntry[] {
  return entries
    .filter((e) => e.reviewStatus === "approved")
    .filter((e) => !moment || e.momentId === moment.id)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
