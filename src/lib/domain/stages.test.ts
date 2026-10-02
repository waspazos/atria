import { describe, expect, it } from "vitest";
import {
  END_STAGES,
  PIPELINE_STAGES,
  assertTransition,
  canTransition,
  isClientFacing,
  isReadOnly,
  nextStages,
} from "./stages";

describe("deal stage machine", () => {
  it("allows each pipeline stage to advance to the next, except where a gate applies", () => {
    expect(canTransition("request", "strategy")).toBe(true);
    expect(canTransition("strategy", "audit")).toBe(true);
    expect(canTransition("audit", "sent")).toBe(true);
    expect(canTransition("sent", "revisions")).toBe(true);
    expect(canTransition("revisions", "io_contract")).toBe(true);
    expect(canTransition("io_contract", "set_up")).toBe(true);
    expect(canTransition("set_up", "live")).toBe(true);
    expect(canTransition("live", "complete")).toBe(true);
  });

  it("loops revisions back to sent", () => {
    expect(canTransition("revisions", "sent")).toBe(true);
  });

  it("does not skip the audit before sending", () => {
    expect(canTransition("strategy", "sent")).toBe(false);
    expect(() => assertTransition("request", "sent")).toThrow(/Request → Sent/);
  });

  it("treats archived as terminal and read-only", () => {
    expect(nextStages("archived")).toEqual([]);
    expect(isReadOnly("archived")).toBe(true);
    expect(isReadOnly("won")).toBe(false);
  });

  it("can archive from every stage except archived", () => {
    for (const s of [...PIPELINE_STAGES, ...END_STAGES]) {
      if (s === "archived") continue;
      expect(canTransition(s, "archived")).toBe(true);
    }
  });

  it("only exposes a space once the client is involved", () => {
    expect(isClientFacing("strategy")).toBe(false);
    expect(isClientFacing("sent")).toBe(true);
  });
});
