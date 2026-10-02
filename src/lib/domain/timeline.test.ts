import { describe, expect, it } from "vitest";
import { fixture } from "../seed/fixture";
import {
  correspondenceFor,
  documentsAsOf,
  documentsTouched,
  nextMoment,
  sortMoments,
} from "./timeline";

const moment = (id: string) => fixture.moments.find((m) => m.id === id)!;

describe("timeline-driven document state", () => {
  it("shows the latest version of every document with no selection", () => {
    const docs = documentsAsOf(fixture, null);
    const proposal = docs.find((d) => d.document.id === "doc_proposal")!;
    expect(proposal.version?.number).toBe(2);
    expect(docs.every((d) => d.version !== null)).toBe(true);
  });

  it("sorts pinned documents to the far left", () => {
    const docs = documentsAsOf(fixture, null);
    expect(docs[0].document.pinned).toBe(true);
  });

  it("shows the version current at the selected moment", () => {
    const docs = documentsAsOf(fixture, moment("m_feedback"));
    const proposal = docs.find((d) => d.document.id === "doc_proposal")!;
    expect(proposal.version?.number).toBe(1);
  });

  it("marks documents that did not exist yet as not shared", () => {
    const docs = documentsAsOf(fixture, moment("m_kickoff"));
    const shortlist = docs.find((d) => d.document.id === "doc_shortlist")!;
    expect(shortlist.version).toBeNull();
  });

  it("attaches the changes made at that moment", () => {
    const docs = documentsAsOf(fixture, moment("m_proposal_v2"));
    const plan = docs.find((d) => d.document.id === "doc_media_plan")!;
    expect(plan.changes.map((c) => c.kind)).toEqual(["changed"]);
    expect(documentsTouched(moment("m_proposal_v2"))).toBe(4);
  });

  it("treats the pending moment as today", () => {
    const docs = documentsAsOf(fixture, moment("m_pending"));
    expect(docs.find((d) => d.document.id === "doc_proposal")!.version?.number).toBe(2);
  });

  it("filters correspondence to the moment", () => {
    const entries = correspondenceFor(fixture.correspondence, moment("m_feedback"));
    expect(entries.map((e) => e.id)).toEqual(["c_feedback"]);
  });

  it("keeps the pending node last and links to the next moment", () => {
    const sorted = sortMoments(fixture.moments);
    expect(sorted[sorted.length - 1].kind).toBe("pending");
    expect(nextMoment(fixture.moments, moment("m_proposal_v2"))?.id).toBe("m_pending");
    expect(nextMoment(fixture.moments, moment("m_pending"))).toBeNull();
  });
});
