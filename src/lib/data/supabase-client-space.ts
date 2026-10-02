import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClientSpaceView,
  Membership,
  Person,
  Presence,
} from "@/lib/domain/types";

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

/**
 * Load the buyer-safe view of a space. Only shared versions, approved
 * correspondence (with owner edits applied) and no source links or audits.
 */
export async function loadClientSpaceFromSupabase(
  db: SupabaseClient,
  spaceId: string,
): Promise<ClientSpaceView | null> {
  const { data: space } = await db
    .from("spaces")
    .select(
      `id, initiator, status_label, status_due_date,
       org:orgs(id, name, slug),
       deal:deals(id, name, stage, value_amount, value_currency,
         brief:deal_briefs(*),
         account:accounts(id, org_id, name, parent_name, logo_text, logo_color))`,
    )
    .eq("id", spaceId)
    .single();
  if (!space) return null;

  // Supabase types to-one embeds loosely without generated types.
  const deal = space.deal as unknown as {
    id: string; name: string; stage: ClientSpaceView["deal"]["stage"];
    value_amount: number | null; value_currency: string | null;
    brief: Record<string, unknown> | null;
    account: { id: string; org_id: string; name: string; parent_name: string | null; logo_text: string; logo_color: string };
  };
  const org = space.org as unknown as ClientSpaceView["org"];

  const [members, documents, moments, correspondence] = await Promise.all([
    db
      .from("memberships")
      .select("scope, account_id, deal_id, side, invited_at, last_seen_at, person:people(*)")
      .is("revoked_at", null)
      .or(`deal_id.eq.${deal.id},account_id.eq.${deal.account.id}`),
    db
      .from("documents")
      .select(
        `id, title, kind, source, pinned,
         versions:document_versions(id, number, committed_at, shared_by, summary, page_count, pdf_path, shared,
           sections:document_sections(id, heading, page, body, position))`,
      )
      .eq("space_id", spaceId)
      .neq("source", "live_link"),
    db
      .from("timeline_moments")
      .select("id, kind, occurred_at, title, summary, changes:moment_changes(document_id, kind, body, position)")
      .eq("space_id", spaceId),
    db
      .from("correspondence_entries")
      .select("id, moment_id, kind, occurred_at, author_id, subject, summary, edited_summary")
      .eq("space_id", spaceId)
      .eq("review_status", "approved"),
  ]);

  type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  const people = (members.data ?? []).map((m: Row) => {
    const p = m.person as Row;
    const membership: Membership = {
      personId: p.id,
      scope: m.scope,
      scopeId: m.scope === "account" ? m.account_id : m.deal_id,
      side: m.side,
      presence: presenceFrom(m.last_seen_at, m.invited_at),
    };
    const person: Person = {
      id: p.id, name: p.name, email: p.email, title: p.title ?? undefined,
      company: p.company, side: p.side, avatarColor: p.avatar_color,
    };
    return { ...person, membership };
  });

  const brief = deal.brief as Row | null;

  return {
    org,
    account: {
      id: deal.account.id,
      orgId: deal.account.org_id,
      name: deal.account.name,
      parentName: deal.account.parent_name ?? undefined,
      logoText: deal.account.logo_text,
      logoColor: deal.account.logo_color,
    },
    deal: {
      id: deal.id,
      accountId: deal.account.id,
      name: deal.name,
      stage: deal.stage,
      value: money(deal.value_amount, deal.value_currency),
      brief: brief
        ? {
            budget: money(brief.budget_amount, brief.budget_currency),
            audience: brief.audience ?? undefined,
            platforms: brief.platforms,
            flight: brief.flight_start
              ? { start: brief.flight_start, end: brief.flight_end }
              : undefined,
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
    },
    people,
    documents: (documents.data ?? [])
      .map((d: Row) => ({
        id: d.id,
        spaceId,
        title: d.title,
        kind: d.kind,
        source: d.source,
        pinned: d.pinned,
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
            pageCount: v.page_count,
            storagePath: v.pdf_path ?? undefined,
            sections: (v.sections as Row[])
              .sort((a, b) => a.position - b.position)
              .map((s) => ({ id: s.id, heading: s.heading, page: s.page, text: s.body })),
          })),
      }))
      .filter((d) => d.versions.length > 0),
    moments: (moments.data ?? []).map((m: Row) => ({
      id: m.id,
      spaceId,
      kind: m.kind,
      occurredAt: m.occurred_at,
      title: m.title,
      summary: m.summary,
      changes: (m.changes as Row[])
        .sort((a, b) => a.position - b.position)
        .map((c) => ({ documentId: c.document_id, kind: c.kind, text: c.body })),
    })),
    correspondence: (correspondence.data ?? []).map((c: Row) => ({
      id: c.id,
      spaceId,
      momentId: c.moment_id ?? undefined,
      kind: c.kind,
      occurredAt: c.occurred_at,
      authorPersonId: c.author_id,
      subject: c.subject,
      summary: c.edited_summary ?? c.summary,
      reviewStatus: "approved" as const,
    })),
  };
}
