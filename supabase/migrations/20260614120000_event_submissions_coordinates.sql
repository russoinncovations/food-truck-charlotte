-- Store one-time geocode from /promote-event for map pipeline and admin review
alter table public.event_submissions
  add column if not exists latitude numeric,
  add column if not exists longitude numeric;

comment on column public.event_submissions.latitude is
  'Geocoded WGS-84 lat (Charlotte area) at submission; optional';
comment on column public.event_submissions.longitude is
  'Geocoded WGS-84 lon (Charlotte area) at submission; optional';
