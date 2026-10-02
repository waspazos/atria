// Deal stage state machine.
//
// Request → Strategy → Audit → Sent → Revisions → IO/Contract → Set Up → Live → Complete
// plus end states Won, Lost, Archived (Archived makes the space read-only).

export const PIPELINE_STAGES = [
  "request",
  "strategy",
  "audit",
  "sent",
  "revisions",
  "io_contract",
  "set_up",
  "live",
  "complete",
] as const;

export const END_STAGES = ["won", "lost", "archived"] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];
export type EndStage = (typeof END_STAGES)[number];
export type Stage = PipelineStage | EndStage;

export const STAGE_LABELS: Record<Stage, string> = {
  request: "Request",
  strategy: "Strategy",
  audit: "Audit",
  sent: "Sent",
  revisions: "Revisions",
  io_contract: "IO/Contract",
  set_up: "Set Up",
  live: "Live",
  complete: "Complete",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};

/**
 * Stages in which the client is involved, so a deal entering one of them
 * spawns its space. Request/Strategy/Audit are internal to the seller.
 */
export const CLIENT_FACING_STAGES: readonly Stage[] = [
  "sent",
  "revisions",
  "io_contract",
  "set_up",
  "live",
  "complete",
  "won",
];

const TRANSITIONS: Record<Stage, readonly Stage[]> = {
  request: ["strategy", "lost", "archived"],
  strategy: ["audit", "request", "lost", "archived"],
  audit: ["sent", "strategy", "lost", "archived"],
  sent: ["revisions", "io_contract", "lost", "archived"],
  // Revisions loop back to Sent when a new version goes out.
  revisions: ["sent", "io_contract", "lost", "archived"],
  io_contract: ["set_up", "won", "revisions", "lost", "archived"],
  set_up: ["live", "archived"],
  live: ["complete", "archived"],
  complete: ["won", "archived"],
  won: ["archived"],
  lost: ["archived", "request"],
  archived: [],
};

export function canTransition(from: Stage, to: Stage): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStages(from: Stage): readonly Stage[] {
  return TRANSITIONS[from];
}

export function assertTransition(from: Stage, to: Stage): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid deal stage transition: ${STAGE_LABELS[from]} → ${STAGE_LABELS[to]}`,
    );
  }
}

export function isClientFacing(stage: Stage): boolean {
  return CLIENT_FACING_STAGES.includes(stage);
}

export function isReadOnly(stage: Stage): boolean {
  return stage === "archived";
}
