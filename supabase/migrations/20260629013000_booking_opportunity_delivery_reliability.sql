-- Booking opportunity delivery reliability fields.
-- Additive only: preserves existing opportunity and truck data.

alter table public.truck_opportunities
  add column if not exists routed_at timestamptz,
  add column if not exists email_sent_at timestamptz,
  add column if not exists provider_message_id text,
  add column if not exists opened_at timestamptz,
  add column if not exists clicked_at timestamptz,
  add column if not exists bounce_reason text,
  add column if not exists expires_at timestamptz;

update public.truck_opportunities
set
  routed_at = coalesce(routed_at, sent_at, created_at),
  email_sent_at = coalesce(email_sent_at, notification_sent_at),
  provider_message_id = coalesce(provider_message_id, resend_email_id)
where
  routed_at is null
  or (email_sent_at is null and notification_sent_at is not null)
  or (provider_message_id is null and resend_email_id is not null);

create index if not exists truck_opportunities_provider_message_id_idx
  on public.truck_opportunities (provider_message_id)
  where provider_message_id is not null;

create index if not exists truck_opportunities_email_sent_at_idx
  on public.truck_opportunities (email_sent_at)
  where email_sent_at is not null;

create index if not exists truck_opportunities_expires_at_idx
  on public.truck_opportunities (expires_at)
  where expires_at is not null;

alter table public.trucks
  add column if not exists lead_email_confirmed_at timestamptz,
  add column if not exists lead_email_confirmation_sent_at timestamptz,
  add column if not exists lead_email_confirmation_token text;

create index if not exists trucks_lead_email_confirmation_token_idx
  on public.trucks (lead_email_confirmation_token)
  where lead_email_confirmation_token is not null;
