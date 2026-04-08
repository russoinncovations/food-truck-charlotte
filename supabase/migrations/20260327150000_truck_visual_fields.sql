-- Backfill visual / display fields on trucks: initials, palette cycle, status, tagline.
-- Row order for color cycling: stable by primary key `id`.

update public.trucks t
set
  initial = case
    when t.initial is null then upper(left(trim(t.name), 1))
    else t.initial
  end,
  color = case
    when t.color is null then
      (array['#FDDCCE', '#CCE8E0', '#FAF0CC', '#CCE0F4', '#F4CCE0', '#D5EED5']::text[])[1 + (sub.rn % 6)]
    else t.color
  end,
  text_color = case
    when t.text_color is null then
      (array['#D94F1E', '#0F6E56', '#BA7517', '#185FA5', '#993556', '#2D6A2D']::text[])[1 + (sub.rn % 6)]
    else t.text_color
  end,
  status = case
    when t.status is null then 'available'
    else t.status
  end,
  tagline = case
    when t.tagline is null then t.name || ' — Charlotte food truck'
    else t.tagline
  end
from (
  select
    id,
    row_number() over (order by id) - 1 as rn
  from public.trucks
) sub
where t.id = sub.id;
