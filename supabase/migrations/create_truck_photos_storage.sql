-- Bucket for vendor photos. Create in Dashboard if this migration is not used.

insert into storage.buckets (id, name, public)
values ('truck-photos', 'truck-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read truck-photos" on storage.objects;
create policy "Public read truck-photos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'truck-photos');

drop policy if exists "Anon insert truck-photos" on storage.objects;
create policy "Anon insert truck-photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'truck-photos');
