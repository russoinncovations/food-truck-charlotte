-- Optional fields from For Vendors form (directory inquiries).

alter table public.inquiries
  add column if not exists website text;

alter table public.inquiries
  add column if not exists photo_url text;
