-- Manual, idempotent backfill for historical truck_opportunities with null expires_at.
-- DO NOT run automatically in production — review in staging, then execute via Supabase SQL editor or psql.
--
-- Safe to re-run: only updates rows where expires_at is still null, and only sets status = expired
-- when status is still pending and the computed expiry is in the past.

begin;

-- Step 1: populate expires_at from parent booking event date/time (America/New_York end-of-event convention).
update public.truck_opportunities o
set expires_at = (
  (
    br.event_date::date
    + coalesce(
        br.end_time::time,
        br.start_time::time,
        time '23:59:00'
      )
  ) at time zone 'America/New_York'
)
from public.booking_requests br
where o.booking_request_id = br.id
  and o.expires_at is null
  and br.event_date is not null;

-- Step 2: mark clearly past pending opportunities as expired (never overwrite other statuses).
update public.truck_opportunities
set status = 'expired'
where lower(trim(status)) = 'pending'
  and expires_at is not null
  and expires_at <= now();

commit;
