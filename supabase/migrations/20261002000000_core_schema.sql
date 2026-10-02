-- Atria core schema.
--
-- Hierarchy: org (seller tenant) → account (client) → deal → space.
-- Seller users authenticate with Supabase Auth and are members of an org.
-- Buyers never touch these tables directly: client links are resolved on the
-- server (service role) and the server returns only buyer-safe data.

create extension if not exists pgcrypto;

-- ─── Enums ──────────────────────────────────────────────────────────────────

create type deal_stage as enum (
  'request', 'strategy', 'audit', 'sent', 'revisions', 'io_contract',
  'set_up', 'live', 'complete', 'won', 'lost', 'archived'
);
create type party_side as enum ('buyer', 'seller');
create type space_initiator as enum ('seller', 'buyer');
create type membership_scope as enum ('account', 'deal');
create type document_kind as enum ('deck', 'doc', 'sheet', 'pdf');
create type document_source as enum ('upload', 'google_drive', 'onedrive', 'live_link');
create type audit_kind as enum ('sensitive_info', 'numbers_match', 'brief_fidelity');
create type audit_status as enum ('auditing', 'passed', 'flagged', 'overridden', 'blocked');
create type moment_kind as enum ('email', 'call', 'document', 'pending');
create type change_kind as enum ('changed', 'new', 'decided');
create type correspondence_kind as enum ('email', 'call', 'slack', 'note');
create type review_status as enum ('pending', 'approved', 'hidden');

-- ─── Tenancy ────────────────────────────────────────────────────────────────

create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table org_members (
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- ─── Accounts, deals, spaces ────────────────────────────────────────────────

create table accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  parent_name text,
  logo_path text,
  logo_text text not null,
  logo_color text not null default '#1f6f4a',
  hubspot_company_id text,
  created_at timestamptz not null default now()
);
create index on accounts (org_id);

create table deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null,
  stage deal_stage not null default 'request',
  value_amount numeric(14, 2),
  value_currency char(3) default 'USD',
  hubspot_deal_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on deals (account_id);
create index on deals (org_id);

create table deal_stage_transitions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  from_stage deal_stage,
  to_stage deal_stage not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);
create index on deal_stage_transitions (deal_id, changed_at);

-- Structured brief (budget, audience, platforms, flight, deliverables,
-- measurement). Kept alongside the brief document so buyer-initiated RFPs
-- (v2) can be compared across sellers.
create table deal_briefs (
  deal_id uuid primary key references deals(id) on delete cascade,
  budget_amount numeric(14, 2),
  budget_currency char(3) default 'USD',
  audience text,
  platforms text[] not null default '{}',
  flight_start date,
  flight_end date,
  deliverables text[] not null default '{}',
  measurement text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- A space is always tied to exactly one deal.
create table spaces (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  deal_id uuid not null unique references deals(id) on delete cascade,
  initiator space_initiator not null default 'seller',
  status_label text not null default 'In progress',
  status_due_date date,
  created_at timestamptz not null default now()
);

-- ─── People & access ────────────────────────────────────────────────────────

create table people (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  title text,
  company text not null,
  side party_side not null,
  avatar_color text not null default '#7a8b7f',
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

-- Permissions follow the hierarchy: an account-scoped membership sees every
-- deal in the account; a deal-scoped membership sees only that deal's space.
create table memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  scope membership_scope not null,
  account_id uuid references accounts(id) on delete cascade,
  deal_id uuid references deals(id) on delete cascade,
  side party_side not null,
  invited_at timestamptz not null default now(),
  last_seen_at timestamptz,
  revoked_at timestamptz,
  check (
    (scope = 'account' and account_id is not null and deal_id is null) or
    (scope = 'deal' and deal_id is not null and account_id is null)
  )
);
create index on memberships (person_id);
create index on memberships (account_id);
create index on memberships (deal_id);

-- Link-based client access. Only the SHA-256 of the token is stored.
create table space_links (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  token_hash text not null unique,
  require_email_verification boolean not null default false,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index on space_links (space_id);

-- ─── Documents & versions ───────────────────────────────────────────────────

create table documents (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  title text not null,
  kind document_kind not null,
  source document_source not null default 'upload',
  -- Provider file id / URL for linked documents (owner side only).
  source_ref text,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index on documents (space_id);

-- A committed, frozen snapshot. The client only ever sees these.
create table document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  number int not null,
  committed_at timestamptz not null default now(),
  shared_by uuid references people(id),
  summary text not null default '',
  page_count int not null default 1,
  pdf_path text,            -- rendered PDF in the private bucket
  original_path text,       -- original upload (e.g. .pptx) for download
  thumbnail_path text,
  extracted_text text,
  -- Shared with the client only once audits pass or are overridden.
  shared boolean not null default false,
  unique (document_id, number)
);
create index on document_versions (document_id, number);

create table document_sections (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references document_versions(id) on delete cascade,
  position int not null,
  heading text not null,
  page int not null,
  body text not null
);
create index on document_sections (version_id, position);

-- Owner-side only. The client never sees audits.
create table audits (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references document_versions(id) on delete cascade,
  kind audit_kind not null,
  status audit_status not null default 'auditing',
  findings jsonb not null default '[]',
  hard_block boolean not null default false,
  override_reason text,
  overridden_by uuid references auth.users(id),
  overridden_at timestamptz,
  created_at timestamptz not null default now(),
  check (status <> 'overridden' or (override_reason is not null and not hard_block))
);
create index on audits (version_id);

-- ─── Timeline & correspondence ──────────────────────────────────────────────

create table timeline_moments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  kind moment_kind not null,
  occurred_at timestamptz not null,
  title text not null,
  summary text not null default '',
  created_at timestamptz not null default now()
);
create index on timeline_moments (space_id, occurred_at);

create table moment_changes (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references timeline_moments(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  position int not null default 0,
  kind change_kind not null,
  body text not null
);
create index on moment_changes (moment_id);

create table correspondence_entries (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  moment_id uuid references timeline_moments(id) on delete set null,
  kind correspondence_kind not null,
  occurred_at timestamptz not null,
  author_id uuid references people(id),
  subject text not null,
  summary text not null,          -- AI draft
  edited_summary text,            -- owner edit, shown in preference
  source_url text,                -- exact source thread/message (owner side)
  source_ref text,
  review_status review_status not null default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on correspondence_entries (space_id, occurred_at);

-- ─── Row-level security ─────────────────────────────────────────────────────
-- Seller users see everything in orgs they belong to. There are no anon
-- policies: buyer access goes through the server, which validates the link.

create or replace function is_org_member(target_org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from org_members where org_id = target_org and user_id = auth.uid()
  );
$$;

create or replace function space_org(target_space uuid)
returns uuid
language sql stable security definer set search_path = public
as $$ select org_id from spaces where id = target_space; $$;

create or replace function document_org(target_document uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select s.org_id from documents d join spaces s on s.id = d.space_id
  where d.id = target_document;
$$;

create or replace function version_org(target_version uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select s.org_id from document_versions v
  join documents d on d.id = v.document_id
  join spaces s on s.id = d.space_id
  where v.id = target_version;
$$;

create or replace function moment_org(target_moment uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select s.org_id from timeline_moments m join spaces s on s.id = m.space_id
  where m.id = target_moment;
$$;

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table accounts enable row level security;
alter table deals enable row level security;
alter table deal_stage_transitions enable row level security;
alter table deal_briefs enable row level security;
alter table spaces enable row level security;
alter table people enable row level security;
alter table memberships enable row level security;
alter table space_links enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table document_sections enable row level security;
alter table audits enable row level security;
alter table timeline_moments enable row level security;
alter table moment_changes enable row level security;
alter table correspondence_entries enable row level security;

create policy org_read on orgs for select using (is_org_member(id));
create policy org_members_read on org_members for select using (is_org_member(org_id));

create policy accounts_all on accounts for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy deals_all on deals for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy spaces_all on spaces for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy people_all on people for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy memberships_all on memberships for all
  using (is_org_member(org_id)) with check (is_org_member(org_id));

create policy transitions_all on deal_stage_transitions for all
  using (is_org_member((select org_id from deals where id = deal_id)))
  with check (is_org_member((select org_id from deals where id = deal_id)));
create policy briefs_all on deal_briefs for all
  using (is_org_member((select org_id from deals where id = deal_id)))
  with check (is_org_member((select org_id from deals where id = deal_id)));

create policy links_all on space_links for all
  using (is_org_member(space_org(space_id))) with check (is_org_member(space_org(space_id)));
create policy documents_all on documents for all
  using (is_org_member(space_org(space_id))) with check (is_org_member(space_org(space_id)));
create policy moments_all on timeline_moments for all
  using (is_org_member(space_org(space_id))) with check (is_org_member(space_org(space_id)));
create policy correspondence_all on correspondence_entries for all
  using (is_org_member(space_org(space_id))) with check (is_org_member(space_org(space_id)));

create policy versions_all on document_versions for all
  using (is_org_member(document_org(document_id))) with check (is_org_member(document_org(document_id)));
create policy sections_all on document_sections for all
  using (is_org_member(version_org(version_id))) with check (is_org_member(version_org(version_id)));
create policy audits_all on audits for all
  using (is_org_member(version_org(version_id))) with check (is_org_member(version_org(version_id)));
create policy moment_changes_all on moment_changes for all
  using (is_org_member(moment_org(moment_id))) with check (is_org_member(moment_org(moment_id)));

-- ─── Stage transitions are enforced in the database too ─────────────────────

create or replace function valid_stage_transition(from_stage deal_stage, to_stage deal_stage)
returns boolean
language sql immutable
as $$
  select case from_stage
    when 'request'     then to_stage in ('strategy', 'lost', 'archived')
    when 'strategy'    then to_stage in ('audit', 'request', 'lost', 'archived')
    when 'audit'       then to_stage in ('sent', 'strategy', 'lost', 'archived')
    when 'sent'        then to_stage in ('revisions', 'io_contract', 'lost', 'archived')
    when 'revisions'   then to_stage in ('sent', 'io_contract', 'lost', 'archived')
    when 'io_contract' then to_stage in ('set_up', 'won', 'revisions', 'lost', 'archived')
    when 'set_up'      then to_stage in ('live', 'archived')
    when 'live'        then to_stage in ('complete', 'archived')
    when 'complete'    then to_stage in ('won', 'archived')
    when 'won'         then to_stage in ('archived')
    when 'lost'        then to_stage in ('archived', 'request')
    else false
  end;
$$;

create or replace function enforce_deal_stage()
returns trigger
language plpgsql
as $$
begin
  if new.stage is distinct from old.stage then
    if not valid_stage_transition(old.stage, new.stage) then
      raise exception 'Invalid deal stage transition: % → %', old.stage, new.stage;
    end if;
    insert into deal_stage_transitions (deal_id, from_stage, to_stage, changed_by)
    values (new.id, old.stage, new.stage, auth.uid());
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger deals_stage_guard
  before update of stage on deals
  for each row execute function enforce_deal_stage();

-- ─── Storage ────────────────────────────────────────────────────────────────
-- Private bucket; objects live under {org_id}/{account_id}/{deal_id}/…
-- and are served only through short-lived signed URLs.

insert into storage.buckets (id, name, public)
values ('space-files', 'space-files', false)
on conflict (id) do nothing;

create policy space_files_org_members on storage.objects for all
  using (bucket_id = 'space-files' and is_org_member(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'space-files' and is_org_member(((storage.foldername(name))[1])::uuid));
