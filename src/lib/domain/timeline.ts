// Timeline-driven state for the client space. Selecting a moment shows every
// document at the version current on that date, the changes made at that
// moment, and the correspondence attached to it. No selection = today.

import type {
  ClientSpaceView,
  CorrespondenceEntry,
  DocumentVersion,
  MomentChange,
  SpaceDocument,
  TimelineMoment,
} from "./types";

export interface DocumentAsOf {
  document: SpaceDocument;
  /** null when the document didn't exist yet at the selected moment. */
  version: DocumentVersion | null;
  changes: MomentChange[];
}

export function sortMoments(moments: TimelineMoment[]): TimelineMoment[] {
  return [...moments].sort((a, b) => {
    // The pending node always sits last.
    if (a.kind === "pending" && b.kind !== "pending") return 1;
    if (b.kind === "pending" && a.kind !== "pending") return -1;
    return a.occurredAt.localeCompare(b.occurredAt);
  });
}

export function versionAsOf(
  doc: SpaceDocument,
  at: string | null,
): DocumentVersion | null {
  const eligible = at
    ? doc.versions.filter((v) => v.committedAt <= at)
    : doc.versions;
  return eligible.length ? eligible[eligible.length - 1] : null;
}

/** Pinned first, then most recently updated. */
export function sortDocuments(docs: SpaceDocument[]): SpaceDocument[] {
  const latest = (d: SpaceDocument) =>
    d.versions[d.versions.length - 1]?.committedAt ?? "";
  return [...docs].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return latest(b).localeCompare(latest(a));
  });
}

export function documentsAsOf(
  view: Pick<ClientSpaceView, "documents">,
  moment: TimelineMoment | null,
): DocumentAsOf[] {
  // A pending moment is in the future, so it shows the current state.
  const at = moment && moment.kind !== "pending" ? moment.occurredAt : null;
  return sortDocuments(view.documents).map((document) => ({
    document,
    version: versionAsOf(document, at),
    changes: moment
      ? moment.changes.filter((c) => c.documentId === document.id)
      : [],
  }));
}

export function correspondenceFor(
  entries: CorrespondenceEntry[],
  moment: TimelineMoment | null,
): CorrespondenceEntry[] {
  const visible = entries.filter((e) => e.reviewStatus === "approved");
  const filtered = moment
    ? visible.filter((e) => e.momentId === moment.id)
    : visible;
  return filtered.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

/** Count of distinct documents touched at a moment, for the rail. */
export function documentsTouched(moment: TimelineMoment): number {
  return new Set(moment.changes.map((c) => c.documentId)).size;
}

export function nextMoment(
  moments: TimelineMoment[],
  current: TimelineMoment,
): TimelineMoment | null {
  const sorted = sortMoments(moments);
  const i = sorted.findIndex((m) => m.id === current.id);
  return i >= 0 && i < sorted.length - 1 ? sorted[i + 1] : null;
}
