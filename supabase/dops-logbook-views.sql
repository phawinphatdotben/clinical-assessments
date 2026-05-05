-- DOPS logbook views (cleaner read path + easier debugging)
-- Run this in Supabase SQL editor.

-- 1) Read-only catalog view for all authenticated users.
--    Useful for DOPS form procedure search and dashboard listing.
create or replace view public.dops_skills_catalog as
select
  s.skill,
  s."group",
  s.amount_required,
  s.enlisted_in_manual_skill,
  s.department
from public.skills s
order by s.skill;

grant select on public.dops_skills_catalog to authenticated;

-- 2) Student progress view:
--    completed count is computed from Assessment (DOPS only),
--    amount_required comes from skills.
--    Uses current JWT email to resolve current student's Student ID.
--    Keep original column order before `completed`; append new columns only after it, or
--    `create or replace view` fails (42P16: cannot change name of view column "completed" ...).
create or replace view public.student_dops_logbook_progress as
with student_profile as (
  select
    u."Student ID" as student_id
  from public."Users" u
  where lower(coalesce(u."Email", '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
),
dops_done as (
  select
    a."Student ID" as student_id,
    a."Procedure Name" as skill,
    count(*)::int as completed
  from public."Assessment" a
  where a."Form Type" = 'DOPS'
    and lower(coalesce(a."Status", '')) not like '%pending%'
    and lower(coalesce(a."Status", '')) <> 'fail'
  group by a."Student ID", a."Procedure Name"
)
select
  s.skill,
  s."group",
  s.amount_required,
  s.enlisted_in_manual_skill,
  coalesce(d.completed, 0)::int as completed,
  s.department
from public.skills s
cross join student_profile sp
left join dops_done d
  on d.student_id = sp.student_id
 and d.skill = s.skill
order by s.skill;

grant select on public.student_dops_logbook_progress to authenticated;

-- Quick test (as signed-in student in app):
-- select * from public.student_dops_logbook_progress limit 20;
