-- Vendor reminder / Resend engagement (webhook + dispatch rows).
create table if not exists public.vendor_email_events (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text,
  vendor_email text,
  truck_id uuid references public.trucks (id) on delete set null,
  campaign text,
  event_type text not null,
  event_timestamp timestamptz not null default now(),
  link_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vendor_email_events_resend_email_id_idx
  on public.vendor_email_events (resend_email_id);

create index if not exists vendor_email_events_campaign_idx
  on public.vendor_email_events (campaign);

create index if not exists vendor_email_events_event_type_idx
  on public.vendor_email_events (event_type);

create index if not exists vendor_email_events_created_at_idx
  on public.vendor_email_events (created_at desc);

alter table public.vendor_email_events enable row level security;

-- No policies: anon/authenticated cannot read/write; service role bypasses RLS.
