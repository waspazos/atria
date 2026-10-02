import "server-only";
import { createHash } from "node:crypto";
import type { ClientSpaceView } from "@/lib/domain/types";
import { DEMO_LINK_TOKEN, fixture } from "@/lib/seed/fixture";
import { loadClientSpaceFromSupabase } from "./supabase-client-space";
import { serviceClient } from "./supabase";

export type ClientSpaceResult =
  | { status: "ok"; view: ClientSpaceView }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "revoked" }
  | { status: "verify_email"; spaceId: string };

export function hashLinkToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Resolve a client link to the buyer-safe view of its space. Buyers have no
 * database session; this runs on the server with the service role and must
 * only ever return committed, shared, approved content.
 */
export async function getClientSpaceByToken(
  token: string,
): Promise<ClientSpaceResult> {
  const db = serviceClient();
  if (!db) {
    // No Supabase configured: serve the local fixture for the demo link.
    return token === DEMO_LINK_TOKEN
      ? { status: "ok", view: fixture }
      : { status: "not_found" };
  }

  const { data: link } = await db
    .from("space_links")
    .select("space_id, expires_at, revoked_at, require_email_verification")
    .eq("token_hash", hashLinkToken(token))
    .maybeSingle();

  if (!link) return { status: "not_found" };
  if (link.revoked_at) return { status: "revoked" };
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { status: "expired" };
  }
  // TODO(email verification): check a signed verification cookie here.
  if (link.require_email_verification) {
    return { status: "verify_email", spaceId: link.space_id };
  }

  const view = await loadClientSpaceFromSupabase(db, link.space_id);
  return view ? { status: "ok", view } : { status: "not_found" };
}
