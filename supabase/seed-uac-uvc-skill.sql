-- Add UAC/UVC insertion as a Pediatric DOPS logbook skill (optional seed).
insert into public.skills (skill, "group", amount_required, enlisted_in_manual_skill, department, rubric_pdf_url)
values (
  'UAC/UVC insertion',
  null,
  null,
  null,
  'Pediatrics',
  null
)
on conflict (skill) do update
set
  department = excluded.department;
