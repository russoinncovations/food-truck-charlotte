-- Optional structured address for current serving spot (pins use latitude/longitude only).
alter table public.trucks
  add column if not exists street_address text;
