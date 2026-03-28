-- Mark directory inquiries as processed after adding to trucks table.
-- Enables anon read/update for type = 'for_trucks' only (internal admin UI; tighten later).

alter table public.inquiries
  add column if not exists processed boolean not null default false;

create index if not exists inquiries_for_trucks_processed_idx
  on public.inquiries (type, processed, created_at desc);

create policy "Allow anon select for_trucks inquiries"
  on public.inquiries
  for select
  to anon, authenticated
  using (type = 'for_trucks');

create policy "Allow anon update for_trucks inquiries"
  on public.inquiries
  for update
  to anon, authenticated
  using (type = 'for_trucks')
  with check (type = 'for_trucks');
