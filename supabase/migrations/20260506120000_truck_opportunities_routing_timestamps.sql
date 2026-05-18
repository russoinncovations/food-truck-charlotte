-- Admin / dashboard visibility: when an opportunity was routed and when a vendor responded.
alter table public.truck_opportunities
  add column if not exists sent_at timestamptz;

alter table public.truck_opportunities
  add column if not exists responded_at timestamptz;

-- New inserts: if application omits sent_at, DB supplies a timestamp (PG trigger also coalesces created_at).
alter table public.truck_opportunities
  alter column sent_at set default now();

update public.truck_opportunities
set sent_at = coalesce(sent_at, created_at)
where sent_at is null;

-- New rows: sent_at follows created_at (or now) when not explicitly set.
create or replace function public.truck_opportunities_set_sent_at()
returns trigger
language plpgsql
as $$
begin
  if new.sent_at is null then
    new.sent_at := coalesce(new.created_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists truck_opportunities_set_sent_at_bi on public.truck_opportunities;
create trigger truck_opportunities_set_sent_at_bi
  before insert on public.truck_opportunities
  for each row
  execute function public.truck_opportunities_set_sent_at();

-- Note: requires PostgreSQL 14+ (e.g. Supabase) for EXECUTE FUNCTION; older PG used EXECUTE PROCEDURE.
