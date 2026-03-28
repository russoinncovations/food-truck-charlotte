-- Upsert directory trucks by email from admin flow (anon key + RLS).
-- PostgreSQL treats NULL as distinct for UNIQUE; multiple NULL emails remain possible.
create unique index if not exists trucks_email_unique_idx on public.trucks (email);

create policy "Allow anon update on trucks"
  on public.trucks for update
  to anon, authenticated
  using (true)
  with check (true);
