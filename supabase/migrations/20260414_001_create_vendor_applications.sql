create extension if not exists pgcrypto;

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  status text not null default 'new'
    check (status in ('new', 'reviewing', 'approved', 'rejected', 'needs_info')),

  business_name text,
  contact_name text,
  email text,
  phone text,
  website text,
  instagram text,

  vendor_description text,
  cuisine_types text[] not null default '{}',
  service_areas text[] not null default '{}',
  base_city text,

  photo_url text,
  additional_photos text[] not null default '{}',

  source text not null default 'site'
    check (source in ('site', 'admin', 'import')),

  admin_notes text,
  approved_truck_id uuid null
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vendor_applications_updated_at on public.vendor_applications;

create trigger trg_vendor_applications_updated_at
before update on public.vendor_applications
for each row
execute function public.set_updated_at();
create extension if not exists pgcrypto;

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  status text not null default 'new'
    check (status in ('new', 'reviewing', 'approved', 'rejected', 'needs_info')),

  business_name text,
  contact_name text,
  email text,
  phone text,
  website text,
  instagram text,

  vendor_description text,
  cuisine_types text[] not null default '{}',
  service_areas text[] not null default '{}',
  base_city text,

  photo_url text,
  additional_photos text[] not null default '{}',

  source text not null default 'site'
    check (source in ('site', 'admin', 'import')),

  admin_notes text,
  approved_truck_id uuid null
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_vendor_applications_updated_at on public.vendor_applications;

create trigger trg_vendor_applications_updated_at
before update on public.vendor_applications
for each row
execute function public.set_updated_at();

