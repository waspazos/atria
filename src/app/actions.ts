"use server";

import { serviceClient } from "@/lib/data/supabase";

export type AccessRequestResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Request access" on the marketing site. */
export async function requestAccess(email: string): Promise<AccessRequestResult> {
  const clean = email.trim().toLowerCase();
  if (!EMAIL.test(clean) || clean.length > 254) {
    return { ok: false, error: "Enter a valid work email." };
  }
  const db = serviceClient();
  if (!db) {
    // Local/demo mode without Supabase: nothing to persist to.
    console.info(`[access request] ${clean}`);
    return { ok: true };
  }
  const { error } = await db.from("access_requests").insert({ email: clean });
  if (error) {
    console.error("access request failed", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  return { ok: true };
}
