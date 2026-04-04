-- Public directory visibility: only rows with show_in_directory = true appear in listings.
-- Marketplace trucks can be active (dashboard) without listing until profile is enriched.

alter table public.trucks
  add column if not exists show_in_directory boolean not null default false;

-- Preserve existing public directory rows (were visible under active = true only).
update public.trucks
set show_in_directory = true
where active = true;

drop policy if exists "Allow public read on trucks" on public.trucks;

create policy "Allow public read on trucks"
  on public.trucks for select
  to anon, authenticated
  using (active = true and show_in_directory = true);
