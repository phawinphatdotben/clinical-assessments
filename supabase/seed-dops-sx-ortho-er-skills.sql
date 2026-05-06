-- DOPS logbook skills for Surgery / Orthopedics / ER (optional seed).
-- Matches procedure names used by the app under rotation "Sx/Ortho/ER".

insert into public.skills (skill, "group", amount_required, enlisted_in_manual_skill, department, rubric_pdf_url)
values
  (
    'FAST in trauma patients',
    null,
    null,
    null,
    'Sx/Ortho/ER',
    '/rubrics/dops-sx-ortho-er/dops-fast-in-trauma-patients.pdf'
  ),
  (
    'Excision (surgery)',
    null,
    null,
    null,
    'Sx/Ortho/ER',
    '/rubrics/dops-sx-ortho-er/dops-excision-surgery.docx'
  ),
  (
    'Digital nerve block',
    null,
    null,
    null,
    'Sx/Ortho/ER',
    '/rubrics/dops-sx-ortho-er/dops-digital-nerve-block.pdf'
  ),
  (
    'Short arm slab',
    null,
    null,
    null,
    'Sx/Ortho/ER',
    '/rubrics/dops-sx-ortho-er/dops-short-arm-slab.pdf'
  ),
  (
    'Skin traction',
    null,
    null,
    null,
    'Sx/Ortho/ER',
    '/rubrics/dops-sx-ortho-er/dops-skin-traction.pdf'
  )
on conflict (skill) do update
set
  department = excluded.department,
  rubric_pdf_url = excluded.rubric_pdf_url;
