create table if not exists public.truck_photos (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references public.trucks(id) on delete cascade,
  created_at timestamptz not null default now(),
  photo_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_hero boolean not null default false
);

create index if not exists truck_photos_truck_id_idx
  on public.truck_photos (truck_id);

create index if not exists truck_photos_sort_order_idx
  on public.truck_photos (truck_id, sort_order);
  