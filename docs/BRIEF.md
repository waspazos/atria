# Atria — project brief for Claude Code

Working name: **Atria**. This file is the source of truth for what we're building. Read it fully before writing code, and keep it updated as decisions change.

## What it is

A client-facing deal space for media and sponsorship sales. A seller (first customer: Dexerto, a gaming and esports media company) spins up a space for each deal and invites the buyer (agency or brand). The space always shows the current state of the deal: the documents, a summary of the correspondence, and how the deal got here.

The magic is that nobody curates it by hand. The seller connects Gmail, Google Drive, and call notes, and the system pulls the key elements of email threads, calls, and documents into one clean space.

Every document passes an AI audit on the seller side before the buyer can see it. If it's in the space, it's safe to share.

## Users

- **Seller (owner side).** Sales reps, customer success, and the head of marketing at the media company. They create spaces, commit documents, approve correspondence summaries, and manage who has access.
- **Buyer (client side).** Agency planners, brand managers, media leads. They open a link, see where the deal stands, review documents, ask questions, and respond. No account required.

## Hierarchy

```
Account (e.g. Microsoft · Xbox, or an agency)
 └── Deal (e.g. Summer Creator Package)
      └── Space contents: documents, versions, correspondence, timeline, people
```

- An **account** can hold many deals. An agency that works with us often gets an account-level view of every deal they have with us. A one-off client may only ever have one deal.
- A **space is always tied to a deal.** There is no free-floating "create a space." A space is spawned when a deal moves into a stage that involves the client.
- **Permissions follow the hierarchy.** An account-level member sees every deal in the account. A deal-level member sees only that deal's space.
- Every space has an `initiator` field (`seller` or `buyer`). Only seller-initiated spaces exist in v1, but this keeps the door open for v2 (see below).

## Stage taxonomy

Request → Strategy → Audit → Sent → Revisions → IO/Contract → Set Up → Live → Complete

Plus end states: Won, Lost, Archived (read-only space).

## Client space (designed — build to match)

Designs live in Claude Design. Match them closely. Key elements:

- **Header band.** Soft warm gradient. Client logo, account breadcrumb, deal name, and a status pill (e.g. "Awaiting your feedback · Oct 6") in the top right. Deal value is **not** prominent on the client side; at most a small detail under the deal name. People avatars grouped by side (Buyer / Seller) open a "People in this space" panel with presence ("Viewing now", "Seen Sep 30", "Invited") and an Invite button.
- **Left rail.** Tabs for Timeline and Correspondence. The timeline lists moments (email, call, document) with icons, dates, and a count of documents touched. The final node is dashed and represents what's pending from the client.
- **The timeline drives the page.** Selecting a moment highlights it, shows a banner summarising that moment (with "Next" if there is one), filters correspondence to that moment, and shows every document card at the version current on that date with an "as of [date]" label. Cards also show a short summary of what changed at that moment (CHANGED / NEW / DECIDED rows). Documents that didn't exist yet show "Not shared yet." Clicking the selected moment again, or "Today", clears the filter.
- **Documents.** A row of cards with a thumbnail of the first page, type icon, title, one-line summary, sharer avatar, date, and a version chip that expands to earlier versions. **Pinned** documents sort to the far left with a small pin icon; otherwise identical to other cards.
- **Chat.** Anchored to the bottom of the main column, full width, "Ask about this deal", with three suggested question chips. Answers cite and link to specific document sections.

## Owner side (design in progress)

Will provide designs. Expect: creating spaces from deals, committing documents, space settings, user and access management, an ingestion review queue, the audit flow, and "preview as client."

## Documents: link live, share frozen

- Sources: Google Drive, OneDrive/SharePoint, and direct upload.
- On the owner side, a linked document stays live; the seller keeps editing it in their normal tool.
- **Committing** a document to the space takes a snapshot: export to PDF via the provider API (Drive export / Microsoft Graph), extract the text, run the audit, and store it as a new version.
- Uploads go through the same pipeline. Convert Office files to PDF (headless LibreOffice or a conversion API) and keep the original for download. New versions are uploaded via an explicit "upload new version" action on the existing document, not filename matching.
- **The client only ever sees committed snapshots**, rendered in our own viewer (PDF.js). No iframes of live Google/Microsoft docs on the client side: they break audits, version history, citations, and permissions.
- An optional "live link" document type can exist for things like dashboards. It's clearly marked as live and excluded from audits.

## Audits (owner side only)

The client never sees an audit, score, or warning. Audits are a gate on committing a document.

v1 audits:
1. **Sensitive info.** Flags anything that shouldn't go to this client.
2. **Numbers match the source.** Figures in the document match the underlying data.
3. **Brief fidelity.** Language quality, and whether the document stays true to the original brief and every change agreed in email, calls, and Slack.

Behaviour:
- Audits **warn, they don't block.** Overriding a flag requires a reason, and the override is logged against that version.
- A short, fixed list of **hard blocks** that can't be overridden: exposing another client's name or another deal's numbers.
- States: auditing → passed / ready to share → flagged (override with reason).

## Ingestion

- Connectors: Gmail and Google Drive first. Then Granola (call notes), Microsoft (Outlook/OneDrive), Slack, HubSpot (contacts, companies, deal IDs).
- AI writes correspondence summaries: short readable entries, each linking to the exact source thread or message.
- **Summaries go through an owner review queue** (approve, edit, hide) before the client can see them.
- Connector sync status and errors show as a small pill in the owner header.

## Stack

- **Next.js on Vercel**, **Supabase** (Postgres, auth, storage, row-level security). Adjust if there's a strong reason, but say why first.
- Files in a **private Supabase Storage bucket**, served only through short-lived signed URLs. Per-account folder structure. Access rules mirror the account → deal → space hierarchy.
- Client access is **link-based**, with optional email verification. Handle expired, revoked, and no-access states.
- LLM calls through the Anthropic API.

## Suggested build order

1. Data model: accounts, deals (with stage state machine), spaces (with `initiator`), people and memberships, documents, versions, timeline events, correspondence entries.
2. Seed data matching the design (Summer Creator Package, $120K, Northlight-style seller team) so the client space renders realistically. **Demo data is fictional and shareable:** the client is "Lumen Interactive · Arcadia" (a made-up publisher with an "Arcadia Pass" subscription), not a real brand, and no real names, numbers or documents are used. Real client data never goes in the seed.
3. Client space UI against seed data, including the timeline-driven state.
4. Document pipeline: upload → convert → extract → store version → viewer.
5. Google Drive link + commit snapshot.
6. Sensitive-info audit on commit.
7. Gmail ingestion → summaries → owner review queue → client correspondence.
8. Chat with citations.
9. Remaining audits and connectors.

## Not in v1 (but don't block them)

- **Learning loop** (routing suggestions, similar-deal matching). Deferred.
- **Buyer-initiated RFP distribution (v2).** A buyer sends one structured RFP to many trusted sellers, a space spawns per seller, and responses come back in a comparable structure. To keep this possible: store the brief as a **structured object** (budget, audience, platforms, flight dates, deliverables, measurement) as well as a document, and keep the `initiator` field on spaces. Competing sellers must never see each other's spaces.

## Design language

Light, warm neutral background. Single green accent. Serif display type for headings, clean sans for body. Generous whitespace, soft shadows, subtle hover lift. Iconography for document types, email vs call, versions, and pins. It should feel like a crafted product, not an enterprise portal or a dashboard.

## Working setup

This repo is worked on from a cloud instance accessed from multiple machines. Git is the source of truth: commit small and often with clear messages. Keep secrets in environment variables, never in the repo, and maintain an up-to-date `.env.example`.
