-- Align public booking table with app: table booking_requests, column cuisines (text[]).
-- Handles both fresh installs (booking_inquiries) and renamed DBs (booking_requests + cuisine_preferences).

do $$
begin
  if to_regclass('public.booking_inquiries') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'booking_inquiries' and column_name = 'cuisine_requested'
    ) then
      alter table public.booking_inquiries rename column cuisine_requested to cuisines;
    end if;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'booking_inquiries' and column_name = 'cuisine_preferences'
    ) then
      alter table public.booking_inquiries rename column cuisine_preferences to cuisines;
    end if;
    alter table public.booking_inquiries alter column cuisines drop not null;
    alter table public.booking_inquiries rename to booking_requests;
  elsif to_regclass('public.booking_requests') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'booking_requests' and column_name = 'cuisine_preferences'
    ) then
      alter table public.booking_requests rename column cuisine_preferences to cuisines;
    end if;
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'booking_requests' and column_name = 'cuisine_requested'
    ) then
      alter table public.booking_requests rename column cuisine_requested to cuisines;
    end if;
    alter table public.booking_requests alter column cuisines drop not null;
  end if;
end $$;
