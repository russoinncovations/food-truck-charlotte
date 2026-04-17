alter table public.vendor_applications
  drop constraint if exists vendor_applications_status_check;

alter table public.vendor_applications
  drop constraint if exists vendor_applications_source_check;
