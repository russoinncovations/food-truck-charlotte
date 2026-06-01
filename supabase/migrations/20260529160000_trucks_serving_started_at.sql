-- Manual Go Live staleness: track when a vendor last started/refreshed their live pin.
-- Public map hides manual live pins older than MANUAL_LIVE_PIN_MAX_AGE_MS (app layer, default 6h).
--
-- ROLLBACK:
--   alter table public.trucks drop column if exists serving_started_at;

alter table public.trucks
  add column if not exists serving_started_at timestamptz;

comment on column public.trucks.serving_started_at is
  'Set when vendor starts or refreshes manual Go Live; cleared on stop serving. Used for stale pin expiry on the public map.';

-- Best-effort backfill for trucks currently marked live (may immediately expire if updated_at is old).
update public.trucks
set serving_started_at = updated_at
where serving_today = true
  and serving_started_at is null;
