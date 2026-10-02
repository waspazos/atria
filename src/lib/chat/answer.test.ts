import { describe, expect, it } from "vitest";
import { fixture } from "../seed/fixture";
import { answerQuestion } from "./answer";

describe("answerQuestion", () => {
  it("compares a version with the one before it", () => {
    const a = answerQuestion(fixture, "What changed in v3?");
    expect(a.text).toMatch(/v3 of the Summer Creator Proposal replaced v2/);
    expect(a.citations[0]).toMatchObject({ documentId: "proposal", versionNumber: 3, sectionNumber: 1 });
  });

  it("cites the sections it answers from", () => {
    const a = answerQuestion(fixture, "What's the measurement plan?");
    expect(a.citations[0].documentId).toBe("measure");
    expect(a.citations[0].label).toBe("Measurement Plan v1 · §1 Metrics");
  });

  it("finds the creator breakdown", () => {
    const a = answerQuestion(fixture, "Show the creator breakdown");
    expect(a.citations.map((c) => c.documentId)).toContain("proposal");
  });

  it("says so when nothing matches", () => {
    const a = answerQuestion(fixture, "zzz qqq");
    expect(a.citations).toEqual([]);
  });
});
