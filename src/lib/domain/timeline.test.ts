import { describe, expect, it } from "vitest";
import { fixture } from "../seed/fixture";
import {
  correspondenceFor,
  documentsAsOf,
  documentsTouched,
  generalNotes,
  sortMoments,
} from "./timeline";

const moment = (id: string) => fixture.moments.find((m) => m.id === id)!;
const find = (docs: ReturnType<typeof documentsAsOf>, id: string) =>
  docs.find((d) => d.document.id === id)!;

describe("timeline-driven document state", () => {
  it("shows the latest version of every document with no selection", () => {
    const docs = documentsAsOf(fixture.documents, null);
    expect(find(docs, "proposal").version?.number).toBe(3);
    expect(docs.every((d) => d.version !== null)).toBe(true);
  });

  it("sorts pinned documents to the far left, then seller order", () => {
    const ids = documentsAsOf(fixture.documents, null).map((d) => d.document.id);
    expect(ids).toEqual(["brief", "proposal", "deck", "shortlist", "measure"]);
  });

  it("puts the most recently pinned document leftmost", () => {
    const ids = documentsAsOf(fixture.documents, null, ["measure", "brief"]).map((d) => d.document.id);
    expect(ids.slice(0, 2)).toEqual(["measure", "brief"]);
  });

  it("shows the version current on the moment's day", () => {
    const docs = documentsAsOf(fixture.documents, moment("m_v2_feedback"));
    expect(find(docs, "proposal").version?.number).toBe(2);
    // A version committed the same day as the moment counts.
    expect(find(documentsAsOf(fixture.documents, moment("m_v3")), "proposal").version?.number).toBe(3);
  });

  it("marks documents that did not exist yet as not shared", () => {
    const docs = documentsAsOf(fixture.documents, moment("m_first_call"));
    expect(find(docs, "measure").version).toBeNull();
    expect(find(docs, "measure").changes).toEqual([]);
  });

  it("splits card notes from banner notes", () => {
    const m = moment("m_v2_feedback");
    const docs = documentsAsOf(fixture.documents, m);
    expect(find(docs, "proposal").changes.map((c) => c.kind)).toEqual(["changed", "changed"]);
    expect(generalNotes(m).map((c) => c.text)).toEqual(["Revised proposal by Sep 22"]);
    expect(documentsTouched(m)).toBe(2);
  });

  it("treats the pending moment as today", () => {
    const docs = documentsAsOf(fixture.documents, moment("m_feedback_due"));
    expect(find(docs, "proposal").version?.number).toBe(3);
  });

  it("filters correspondence to the moment, newest first", () => {
    const entries = correspondenceFor(fixture.correspondence, moment("m_v2_feedback"));
    expect(entries.map((e) => e.subject)).toEqual(["Feedback on v2", "Proposal v2 sent"]);
  });

  it("keeps the pending node last", () => {
    const sorted = sortMoments(fixture.moments);
    expect(sorted[sorted.length - 1].kind).toBe("pending");
  });
});
