-- Public bucket for event flyer / graphic uploads (promote + admin flows).
-- Uploads are performed with the service role from /api/upload-event-image.
-- If this migration has not been applied, create the bucket manually:
--   Dashboard → Storage → New bucket → id: event-images → Public bucket: on

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read event-images" on storage.objects;
create policy "Public read event-images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'event-images');
