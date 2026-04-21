-- Deduplicate public.skills by normalized skill name.
-- Keeps ONE canonical row per skill (trimmed, case-insensitive key), including NG duplicates.
-- Safe to run multiple times.
-- IMPORTANT: run the WHOLE script (not partial selection).

begin;

-- 1) Build merged canonical rows into a temp table first.
create temp table _skills_deduped on commit drop as
with normalized as (
  select
    trim(skill) as trimmed_skill,
    lower(trim(skill)) as norm_skill,
    "group" as group_value,
    amount_required,
    enlisted_in_manual_skill as manual_value
  from public.skills
  where skill is not null
    and trim(skill) <> ''
),
ranked as (
  select
    n.*,
    row_number() over (
      partition by n.norm_skill
      order by length(n.trimmed_skill), n.trimmed_skill
    ) as row_rank
  from normalized n
),
merged as (
  select
    norm_skill,
    max(trimmed_skill) filter (where row_rank = 1) as skill,
    (array_remove(array_agg(group_value), null))[1] as "group",
    max(amount_required) as amount_required,
    (array_remove(array_agg(manual_value), null))[1] as enlisted_in_manual_skill
  from ranked
  group by norm_skill
)
select
  skill,
  "group",
  amount_required,
  enlisted_in_manual_skill
from merged;

-- 2) Replace table contents with deduped rows.
truncate table public.skills;

insert into public.skills (skill, "group", amount_required, enlisted_in_manual_skill)
select
  skill,
  "group",
  amount_required,
  enlisted_in_manual_skill
from _skills_deduped
order by skill;

commit;

-- Verify duplicates are gone:
-- select lower(trim(skill)) as norm_skill, count(*)
-- from public.skills
-- group by 1
-- having count(*) > 1;
