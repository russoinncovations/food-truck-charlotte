-- Per-vendor booking notification tracking (email send + Resend delivery lifecycle).
-- sent_at on insert was misleading (opportunity created ≠ email sent); stop auto-filling it.

alter table public.truck_opportunities
  add column if not exists notification_status text,
  add column if not exists notification_email text,
  add column if not exists notification_sent_at timestamptz,
  add column if not exists resend_email_id text,
  add column if not exists delivered_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists complained_at timestamptz,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists notification_error text;

create index if not exists truck_opportunities_resend_email_id_idx
  on public.truck_opportunities (resend_email_id)
  where resend_email_id is not null;

create index if not exists truck_opportunities_notification_status_idx
  on public.truck_opportunities (notification_status);

-- Historical rows: opportunity existed on dashboard; email send was not tracked.
update public.truck_opportunities
set notification_status = coalesce(notification_status, 'dashboard_only')
where notification_status is null;

-- Stop treating opportunity insert as "sent".
drop trigger if exists truck_opportunities_set_sent_at_bi on public.truck_opportunities;

alter table public.truck_opportunities
  alter column sent_at drop default;
