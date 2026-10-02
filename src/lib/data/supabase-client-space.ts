import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientSpaceView, Presence } from "@/lib/domain/types";

const VIEWING_WINDOW_MS = 2 * 60 * 1000;

function presenceFrom(lastSeen: string | null, invitedAt: string): Presence {
  if (!lastSeen) return { kind: "invited", at: invitedAt };
  if (Date.now() - new Date(lastSeen).getTime() < VIEWING_WINDOW_MS) {
    return { kind: "viewing" };
  }
  return { kind: "seen", at: lastSeen };
}

const money = (amount: number | null, currency: string | null) =>
  amount == null ? undefined : { amount: Number(amount), currency: currency ?? "USD" };

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Load the buyer-safe view of a space: only shared versions, approved
 * correspondence (with owner edits applied), no source links, no audits.
 */
export async function loadClientSpaceFromSupabase(
  db: SupabaseClient,
  spaceId: string,
): Promise<ClientSpaceView | null> {
  const { data: space } = await db
    .from("spaces")
    .select(
      `id, initiator, status_label, status_due_date, buyer_lead_id, seller_lead_id, suggested_questions,
       org:orgs(id, name, short_name, slug),
       deal:deals(id, name, stage, value_amount, value_currency,
         brief:deal_briefs(*),
         account:accounts(id, org_id, name, short_name, logo_url))`,
    )
    .eq("id", spaceId)
    .single();
  if (!space) return null;

  const deal = space.deal as unknown as Row;
  const account = deal.account as Row;
  const org = space.org as unknown as Row;

  const [members, documents, moments, correspondence] = await Promise.all([
    db
      .from("memberships")
      .select("scope, account_id, deal_id, side, invited_at, last_seen_at, person:people(*)")
      .is("revoked_at", null)
      .or(`deal_id.eq.${deal.id},account_id.eq.${account.id}`),
    db
      .from("documents")
      .select(
        `id, title, kind, source, pinned, position,
         versions:document_versions(id, number, committed_at, shared_by, summary, pdf_path, shared,
           sections:document_sections(id, number, heading, body))`,
      )
      .eq("space_id", spaceId)
      .neq("source", "live_link"),
    db
      .from("timeline_moments")
      .select("id, kind, occurred_at, title, meta, changes:moment_changes(document_id, kind, body, position)")
      .eq("space_id", spaceId),
    db
      .from("correspondence_entries")
      .select("id, moment_id, kind, occurred_at, participant_ids, subject, summary, edited_summary, meta")
      .eq("space_id", spaceId)
      .eq("review_status", "approved"),
  ]);

  const brief = (Array.isArray(deal.brief) ? deal.brief[0] : deal.brief) as Row | null;
  const sharedDocs = (documents.data ?? [])
    .map((d: Row) => ({
      id: d.id,
      spaceId,
      title: d.title,
      kind: d.kind,
      source: d.source,
      pinned: d.pinned,
      position: d.position,
      versions: (d.versions as Row[])
        .filter((v) => v.shared)
        .sort((a, b) => a.number - b.number)
        .map((v) => ({
          id: v.id,
          documentId: d.id,
          number: v.number,
          committedAt: v.committed_at,
          sharedByPersonId: v.shared_by,
          summary: v.summary,
          storagePath: v.pdf_path ?? undefined,
          sections: (v.sections as Row[])
            .sort((a, b) => a.number - b.number)
            .map((s) => ({
              id: s.id,
              number: s.number,
              heading: s.heading,
              paragraphs: String(s.body).split(/\n{2,}/),
            })),
        })),
    }))
    .filter((d) => d.versions.length > 0);
  const visibleDocIds = new Set(sharedDocs.map((d) => d.id));

  return {
    org: { id: org.id, name: org.name, shortName: org.short_name, slug: org.slug },
    account: {
      id: account.id,
      orgId: account.org_id,
      name: account.name,
      shortName: account.short_name,
      logoUrl: account.logo_url ?? undefined,
    },
    deal: {
      id: deal.id,
      accountId: account.id,
      name: deal.name,
      stage: deal.stage,
      value: money(deal.value_amount, deal.value_currency),
      brief: brief
        ? {
            budget: money(brief.budget_amount, brief.budget_currency),
            audience: brief.audience ?? undefined,
            platforms: brief.platforms,
            flight: brief.flight_start ? { start: brief.flight_start, end: brief.flight_end } : undefined,
            deliverables: brief.deliverables,
            measurement: brief.measurement,
          }
        : undefined,
    },
    space: {
      id: space.id,
      dealId: deal.id,
      initiator: space.initiator,
      statusLabel: space.status_label,
      statusDueDate: space.status_due_date ?? undefined,
      readOnly: deal.stage === "archived",
      buyerLeadId: space.buyer_lead_id ?? undefined,
      sellerLeadId: space.seller_lead_id ?? undefined,
      suggestedQuestions: space.suggested_questions ?? [],
    },
    people: (members.data ?? []).map((m: Row) => {
      const p = m.person as Row;
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        title: p.title ?? undefined,
        side: p.side,
        avatarColor: p.avatar_color,
        membership: {
          personId: p.id,
          scope: m.scope,
          scopeId: m.scope === "account" ? m.account_id : m.deal_id,
          side: m.side,
          presence: presenceFrom(m.last_seen_at, m.invited_at),
        },
      };
    }),
    documents: sharedDocs,
    moments: (moments.data ?? []).map((m: Row) => ({
      id: m.id,
      spaceId,
      kind: m.kind,
      occurredAt: m.occurred_at,
      title: m.title,
      meta: m.meta,
      changes: (m.changes as Row[])
        // Never leak notes about documents the buyer can't see.
        .filter((c) => !c.document_id || visibleDocIds.has(c.document_id))
        .sort((a, b) => a.position - b.position)
        .map((c) => ({ documentId: c.document_id ?? undefined, kind: c.kind, text: c.body })),
    })),
    correspondence: (correspondence.data ?? []).map((c: Row) => ({
      id: c.id,
      spaceId,
      momentId: c.moment_id ?? undefined,
      kind: c.kind,
      occurredAt: c.occurred_at,
      participantIds: c.participant_ids ?? [],
      subject: c.subject,
      summary: c.edited_summary ?? c.summary,
      meta: c.meta,
      reviewStatus: "approved" as const,
    })),
  };
}
