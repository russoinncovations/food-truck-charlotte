-- Prevent duplicate vendor applications for the same email (case-insensitive).
-- Note: multiple rows with NULL email may still be allowed (Postgres NULL semantics).
create unique index if not exists vendor_applications_email_unique
  on public.vendor_applications (lower(email));
