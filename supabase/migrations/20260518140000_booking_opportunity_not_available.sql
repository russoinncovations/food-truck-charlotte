-- Vendor decline label alignment: treat legacy "pass" as "not_available".
update public.truck_opportunities
set status = 'not_available'
where status = 'pass';
