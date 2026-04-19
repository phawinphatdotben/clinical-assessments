-- Run in Supabase SQL Editor against your project.
-- Adds columns expected by src/components/forms/WpbaForm.tsx inserts into public."Assessment".
-- Uses quoted identifiers to match PostgREST (spaces and casing).

alter table public."Assessment"
  add column if not exists "Student ID" text,
  add column if not exists "Staff ID" text,
  add column if not exists "Hospital" text,
  add column if not exists "Department/Rotation" text,
  add column if not exists "Evaluator Role" text,
  add column if not exists "Patient HN" text,
  add column if not exists "Setting" text,
  add column if not exists "Procedure Name" text,
  add column if not exists "Case Complexity" text,
  add column if not exists "Overall Performance Result" text,
  add column if not exists "Evaluator Feedback: What went well" text,
  add column if not exists "Evaluator Feedback: Areas to improve" text,
  add column if not exists "Evaluator Email" text,
  add column if not exists "Form Type" text,
  add column if not exists "Status" text,
  add column if not exists "Evaluator Name" text,
  add column if not exists "Student Self-Reflection" text,
  add column if not exists "Self Reflection Deadline" text,
  add column if not exists "Criteria Score Sum" numeric;

-- DOPS (criteria + overall; values are button labels like understand / standard / …)
alter table public."Assessment"
  add column if not exists "DOPS - Before: Indications/Complications" text,
  add column if not exists "DOPS - Before: Consent" text,
  add column if not exists "DOPS - Before: Preparation" text,
  add column if not exists "DOPS - During: Patient Comfort" text,
  add column if not exists "DOPS - During: Procedure Steps" text,
  add column if not exists "DOPS - During: Aseptic" text,
  add column if not exists "DOPS - During: Problem Solving" text,
  add column if not exists "DOPS - After: Post-procedure Care" text,
  add column if not exists "DOPS - After: Communication" text,
  add column if not exists "DOPS - Patient Empathy" text,
  add column if not exists "DOPS - Pre Performance practice preparation" text,
  add column if not exists "DOPS - Overall Performance" text;

-- Extern (PDF score columns)
alter table public."Assessment"
  add column if not exists "Extern-History Taking SCORE" text,
  add column if not exists "Extern-Physical Exam SCORE" text,
  add column if not exists "Extern-Diagnosis & Diff Dx SCORE" text,
  add column if not exists "Extern-Management Plan SCORE" text,
  add column if not exists "Extern-Communication Skills SCORE" text,
  add column if not exists "Extern-Professionalism SCORE" text;

-- Journal Conference
alter table public."Assessment"
  add column if not exists "JC-1.1 Rationale/Importance SCORE" text,
  add column if not exists "JC-1.2 Methodology Overview SCORE" text,
  add column if not exists "JC-1.3 Results Overview SCORE" text,
  add column if not exists "JC-1.4 Discussion & Conclusion SCORE" text,
  add column if not exists "JC-2.1 Strengths & Limitations SCORE" text,
  add column if not exists "JC-2.2 Clinical Application SCORE" text,
  add column if not exists "JC-2.3 Further Studies Needed SCORE" text,
  add column if not exists "JC-2.4 Review & Summary SCORE" text,
  add column if not exists "JC-3.1 Preparation & Materials SCORE" text,
  add column if not exists "JC-3.2 Presentation Skills SCORE" text,
  add column if not exists "JC-3.3 Time Management SCORE" text,
  add column if not exists "JC-4.0 Ability to Answer Questions SCORE" text;

-- Multisource Feedback
alter table public."Assessment"
  add column if not exists "MSF-Continuous Prof. Development (C) SCORE" text,
  add column if not exists "MSF-Research & Innovation (R) SCORE" text,
  add column if not exists "MSF-Resilience (R) SCORE" text,
  add column if not exists "MSF-Altruism (A) SCORE" text,
  add column if not exists "MSF-Mastery (M) SCORE" text,
  add column if not exists "MSF-Digital Literacy (D) SCORE" text,
  add column if not exists "MSF-Professionalism (P) SCORE" text,
  add column if not exists "MSF-Humility & Volunteerism (H) SCORE" text;

-- Case-Based Discussion
alter table public."Assessment"
  add column if not exists "CbD-Data Gathering & Presentation SCORE" text,
  add column if not exists "CbD-Problem Summarization SCORE" text,
  add column if not exists "CbD-Diagnosis & Diff Dx SCORE" text,
  add column if not exists "CbD-Investigations SCORE" text,
  add column if not exists "CbD-Management & Prevention SCORE" text,
  add column if not exists "CbD - Overall performance" text;

-- MiniCEX
alter table public."Assessment"
  add column if not exists "MiniCEX-History Taking SCORE" text,
  add column if not exists "MiniCEX-Physical Exam SCORE" text,
  add column if not exists "MiniCEX-Diagnosis & Diff Dx SCORE" text,
  add column if not exists "MiniCEX-Investigations SCORE" text,
  add column if not exists "MiniCEX-Management Plan SCORE" text,
  add column if not exists "MiniCEX-Patient Education/Counseling SCORE" text,
  add column if not exists "MiniCEX-Communication Skills SCORE" text,
  add column if not exists "MiniCEX-Professionalism SCORE" text,
  add column if not exists "MiniCEX - Over all performance" text;

-- Student dashboard "Date completed" uses created_at / updated_at. Add if the table was created without them.
alter table public."Assessment"
  add column if not exists created_at timestamptz default now();
alter table public."Assessment"
  add column if not exists updated_at timestamptz default now();
