alter table public.trucks
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists is_active boolean not null default true,
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_rank integer,
  add column if not exists slug text,
  add column if not exists short_description text,
  add column if not exists full_description text,
  add column if not exists cuisine_types text[] not null default '{}',
  add column if not exists base_city text,
  add column if not exists booking_email text,
  add column if not exists booking_phone text,
  add column if not exists hero_photo_url text,
  add column if not exists logo_url text,
  add column if not exists price_range text,
  add column if not exists dietary_tags text[] not null default '{}',
  add column if not exists event_types text[] not null default '{}',
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists source_application_id uuid null;

drop trigger if exists trg_trucks_updated_at on public.trucks;

create trigger trg_trucks_updated_at
before update on public.trucks
for each row
execute function public.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trucks_source_application_id_fkey'
  ) then
    alter table public.trucks
      add constraint trucks_source_application_id_fkey
      foreign key (source_application_id)
      references public.vendor_applications(id)
      on delete set null;
  end if;
end $$;

create unique index if not exists trucks_slug_unique_idx
  on public.trucks (slug)
  where slug is not null;
  