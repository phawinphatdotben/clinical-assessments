-- Additional Assessment columns for new forms:
-- 1) Case Presentation
-- 2) Interesting Case Presentation
-- 3) OPD Assessment
-- Run this if your project already ran assessment-add-columns.sql before these form definitions existed.

alter table public."Assessment"
  add column if not exists "Case Presentation-Content and currency SCORE" text,
  add column if not exists "Case Presentation-Evidence appraisal SCORE" text,
  add column if not exists "Case Presentation-Clinical application SCORE" text,
  add column if not exists "Case Presentation-Teaching media SCORE" text,
  add column if not exists "Case Presentation-Presentation skills SCORE" text;

alter table public."Assessment"
  add column if not exists "Interesting Case-Patient summary SCORE" text,
  add column if not exists "Interesting Case-Clinical diagnosis process SCORE" text,
  add column if not exists "Interesting Case-Management and holistic care SCORE" text,
  add column if not exists "Interesting Case-Discussion SCORE" text,
  add column if not exists "Interesting Case-Presentation media and delivery SCORE" text;

alter table public."Assessment"
  add column if not exists "Interesting Case General-Patient summary SCORE" text,
  add column if not exists "Interesting Case General-Clinical diagnosis process SCORE" text,
  add column if not exists "Interesting Case General-Management and holistic care SCORE" text,
  add column if not exists "Interesting Case General-Discussion SCORE" text,
  add column if not exists "Interesting Case General-Presentation media and delivery SCORE" text;

alter table public."Assessment"
  add column if not exists "OPD Assessment-History SCORE" text,
  add column if not exists "OPD Assessment-Physical examination SCORE" text,
  add column if not exists "OPD Assessment-Problem list SCORE" text,
  add column if not exists "OPD Assessment-Provisional diagnosis SCORE" text,
  add column if not exists "OPD Assessment-Differential diagnosis and discussion SCORE" text,
  add column if not exists "OPD Assessment-Investigation and interpretation SCORE" text,
  add column if not exists "OPD Assessment-Management plan SCORE" text,
  add column if not exists "OPD Assessment - Overall result" text;

alter table public."Assessment"
  add column if not exists "Anticipatory Guidance-History SCORE" text,
  add column if not exists "Anticipatory Guidance-Physical examination SCORE" text,
  add column if not exists "Anticipatory Guidance-Problem list SCORE" text,
  add column if not exists "Anticipatory Guidance-Management and anticipatory guidance SCORE" text,
  add column if not exists "Anticipatory Guidance - Overall result" text;

alter table public."Assessment"
  add column if not exists "OR Assessment-Surgical patient data SCORE" text,
  add column if not exists "OR Assessment-Disease background SCORE" text,
  add column if not exists "OR Assessment-Surgical procedure knowledge SCORE" text,
  add column if not exists "OR Assessment-Sterile technique SCORE" text,
  add column if not exists "OR Assessment-Operative field participation SCORE" text,
  add column if not exists "OR Assessment-Professionalism checklist SCORE" text,
  add column if not exists "OR Assessment - Overall Performance" text;

alter table public."Assessment"
  add column if not exists "OPD Clinical-Foundation knowledge SCORE" text,
  add column if not exists "OPD Clinical-Clinical evaluation SCORE" text,
  add column if not exists "OPD Clinical-Clinical reasoning and planning SCORE" text,
  add column if not exists "OPD Clinical-Management and follow-up SCORE" text,
  add column if not exists "OPD Clinical-Communication skills SCORE" text,
  add column if not exists "OPD Clinical-Professionalism checklist SCORE" text,
  add column if not exists "OPD Clinical - Overall Performance" text;

alter table public."Assessment"
  add column if not exists "IPD Clinical-Clinical data and monitoring SCORE" text,
  add column if not exists "IPD Clinical-Case presentation (SOAP) SCORE" text,
  add column if not exists "IPD Clinical-Clinical reasoning and management SCORE" text,
  add column if not exists "IPD Clinical-Procedural skill SCORE" text,
  add column if not exists "IPD Clinical-Responsibility and punctuality SCORE" text,
  add column if not exists "IPD Clinical-Clinical initiative and learning SCORE" text,
  add column if not exists "IPD Clinical-Communication and interpersonal SCORE" text,
  add column if not exists "IPD Clinical-Ethics and professional conduct SCORE" text,
  add column if not exists "IPD Clinical - Overall Performance" text;

alter table public."Assessment"
  add column if not exists "Health Education Topic" text,
  add column if not exists "OBGYN Health Ed-Introduction SCORE" text,
  add column if not exists "OBGYN Health Ed-Foundation SCORE" text,
  add column if not exists "OBGYN Health Ed-Technical instructions SCORE" text,
  add column if not exists "OBGYN Health Ed-Lifestyle advice SCORE" text,
  add column if not exists "OBGYN Health Ed-Warning signs SCORE" text,
  add column if not exists "OBGYN Health Ed-Follow-up and questions SCORE" text,
  add column if not exists "OB/GYNE Health Education - Overall result" text;
