-- Allow status 'pending' and source 'website' for public form submissions.

alter table public.vendor_applications
  drop constraint if exists vendor_applications_status_check;

alter table public.vendor_applications
  add constraint vendor_applications_status_check
  check (
    status in ('new', 'reviewing', 'approved', 'rejected', 'needs_info', 'pending')
  );

alter table public.vendor_applications
  drop constraint if exists vendor_applications_source_check;

alter table public.vendor_applications
  add constraint vendor_applications_source_check
  check (source in ('site', 'admin', 'import', 'website'));
