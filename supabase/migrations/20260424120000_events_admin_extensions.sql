-- Admin quick-add and listing metadata on public.events (extends existing table; no new table)

alter table public.events
  add column if not exists submitted_by_truck_id uuid references public.trucks (id) on delete set null;

alter table public.events
  add column if not exists image_url text;

alter table public.events
  add column if not exists participating_trucks text;

alter table public.events
  add column if not exists facebook_post_url text;

alter table public.events
  add column if not exists event_website_url text;

alter table public.events
  add column if not exists organizer_name text;

alter table public.events
  add column if not exists organizer_email text;

alter table public.events
  add column if not exists organizer_phone text;

alter table public.events
  add column if not exists is_public boolean not null default true;

alter table public.events
  add column if not exists admin_source_paste text;

alter table public.events
  add column if not exists listing_status text;

alter table public.events drop constraint if exists events_listing_status_check;
alter table public.events
  add constraint events_listing_status_check
  check (
    listing_status is null
    or listing_status in ('draft', 'approved', 'rejected', 'pending')
  );

-- Backfill listing_status for existing rows (public /events uses active = true)
update public.events
set listing_status = 'approved'
where active = true and listing_status is null;

update public.events
set listing_status = 'pending'
where coalesce(active, false) = false
  and submitted_by_truck_id is not null
  and listing_status is null;

update public.events
set listing_status = 'draft'
where coalesce(active, false) = false
  and submitted_by_truck_id is null
  and listing_status is null;

comment on column public.events.listing_status is
  'draft | approved | rejected | pending (vendor submission awaiting review)';
