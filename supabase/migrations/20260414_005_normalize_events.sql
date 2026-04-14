alter table public.events
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists is_active boolean not null default true,
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_rank integer,
  add column if not exists slug text,
  add column if not exists event_type text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists featured_image_url text,
  add column if not exists source_submission_id uuid null;

drop trigger if exists trg_events_updated_at on public.events;

create trigger trg_events_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create unique index if not exists events_slug_unique_idx
  on public.events (slug)
  where slug is not null;
  