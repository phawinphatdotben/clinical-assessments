-- DOPS logbook skills for OB/GYN (optional seed).
-- Matches procedure names used by the app under rotation "OB/GYN".

insert into public.skills (skill, "group", amount_required, enlisted_in_manual_skill, department, rubric_pdf_url)
values
  (
    'PAP smear',
    null,
    null,
    null,
    'OB/GYN',
    '/rubrics/dops-obgyn/dops-pap-smear.docx'
  ),
  (
    'Vaginal packing',
    null,
    null,
    null,
    'OB/GYN',
    '/rubrics/dops-obgyn/dops-vaginal-packing.docx'
  ),
  (
    'IUD insertion',
    null,
    null,
    null,
    'OB/GYN',
    '/rubrics/dops-obgyn/dops-iud-insertion.pdf'
  ),
  (
    'Contraceptive implant removal',
    null,
    null,
    null,
    'OB/GYN',
    '/rubrics/dops-obgyn/dops-contraceptive-implant-removal.pdf'
  )
on conflict (skill) do update
set
  department = excluded.department,
  rubric_pdf_url = excluded.rubric_pdf_url;
