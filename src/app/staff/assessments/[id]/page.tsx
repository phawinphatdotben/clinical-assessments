"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCbdScoreColumnName, getCbdScoreTiers, CBD_TIER_LABELS } from "../../../../components/forms/cbd-criteria";
import {
  getImHealthEdScoreColumnName,
  getImHealthEdScoreTiers,
  getImHealthEdTierLabels,
  IM_HEALTH_ED_FORM_TYPE,
} from "../../../../components/forms/im-health-ed-criteria";
import {
  getJournalClubScoreColumnName,
  getJournalClubScoreTiers,
  JC_TIER_LABELS,
} from "../../../../components/forms/journal-club-criteria";
import { getMiniCexScoreColumnName, getMiniCexScoreTiers, MINICEX_TIER_LABELS } from "../../../../components/forms/minicex-criteria";
import { getMsfScoreColumnName, getMsfScoreTiers, MSF_TIER_LABELS_THAI } from "../../../../components/forms/msf-criteria";
import { getExternScoreColumnName, getExternScoreTiers, EXTERN_TIER_LABELS } from "../../../../components/forms/extern-criteria-scores";
import {
  CASE_PRESENTATION_FORM_TYPE,
  CASE_PRESENTATION_TIER_LABELS,
  getCasePresentationScoreColumnName,
  getCasePresentationScoreTiers,
} from "../../../../components/forms/case-presentation-criteria";
import {
  INTERESTING_CASE_FORM_TYPE,
  INTERESTING_CASE_TIER_LABELS,
  getInterestingCaseScoreColumnName,
  getInterestingCaseScoreTiers,
} from "../../../../components/forms/interesting-case-criteria";
import {
  OPD_ASSESSMENT_FORM_TYPE,
  OPD_ASSESSMENT_TIER_LABELS,
  getOpdAssessmentScoreColumnName,
  getOpdAssessmentScoreTiers,
} from "../../../../components/forms/opd-assessment-criteria";
import {
  INTERESTING_CASE_GENERAL_FORM_TYPE,
  INTERESTING_CASE_GENERAL_TIER_LABELS,
  getInterestingCaseGeneralScoreColumnName,
  getInterestingCaseGeneralScoreTiers,
} from "../../../../components/forms/interesting-case-general-criteria";
import {
  ANTICIPATORY_GUIDANCE_FORM_TYPE,
  ANTICIPATORY_GUIDANCE_TIER_LABELS,
  getAnticipatoryGuidanceScoreColumnName,
  getAnticipatoryGuidanceScoreTiers,
} from "../../../../components/forms/anticipatory-guidance-criteria";
import {
  OR_ASSESSMENT_FORM_TYPE,
  OR_ASSESSMENT_TIER_LABELS,
  getOrAssessmentScoreColumnName,
  getOrAssessmentScoreTiers,
} from "../../../../components/forms/or-assessment-criteria";
import {
  OBGYN_HEALTH_EDUCATION_FORM_TYPE,
  OBGYN_HEALTH_EDUCATION_SCORE_LABELS,
  OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN,
  getObgynHealthEducationScoreColumnName,
  getObgynHealthEducationScoreTiers,
  getObgynHealthEducationTopicRubric,
} from "../../../../components/forms/obgyn-health-education-criteria";
import {
  OPD_CLINICAL_FORM_TYPE,
  OPD_CLINICAL_TIER_LABELS,
  getOpdClinicalScoreColumnName,
  getOpdClinicalScoreTiers,
} from "../../../../components/forms/opd-clinical-criteria";
import {
  IPD_CLINICAL_FORM_TYPE,
  IPD_CLINICAL_TIER_LABELS,
  getIpdClinicalScoreColumnName,
  getIpdClinicalScoreTiers,
} from "../../../../components/forms/ipd-clinical-criteria";
import { findDopsProcedureRubric, getFormTypeRubric } from "../../../../components/forms/rubric-links";
import { WPBA_FORM_CONFIGS } from "../../../../components/forms/wpba-config";
import { DashboardNav } from "../../../components/dashboard-nav";
import { getDashboardPathForRole, getUserAccessLookupResultByEmail } from "../../../lib/auth";
import { ASSESSMENT_STATUS_COMPLETE, STUDENT_SELF_REFLECTION_COLUMN } from "../../../lib/student-feedback";
import {
  buildStaffApprovalUpdatePayload,
  fetchAssessmentByRouteId,
  getStaffProfileForCurrentUserWithError,
  isAwaitingStaffApproval,
  pickAssessmentRowId,
  staffCanAccessAssessmentRow,
} from "../../../lib/staff-assessments";
import { supabase } from "../../../lib/supabase";
import { t, useUiLanguage } from "../../../lib/ui-language";

const pickString = (row: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
    if (typeof v === "number") {
      return String(v);
    }
  }
  return "";
};

type GradeOption = { value: string; label: string };
type GradeFieldDef = { label: string; column: string; options: GradeOption[] };

const DOPS_OPTIONS: GradeOption[] = [
  { value: "understandard", label: "Under standard" },
  { value: "standard", label: "Standard" },
  { value: "Exceptional", label: "Exceptional" },
  { value: "Cannot be evaluated", label: "Cannot be evaluated" },
];

function toTierOptions(scores: readonly number[], labels: readonly string[]): GradeOption[] {
  return scores.map((score, index) => {
    const tierLabel = labels[index] ?? `Tier ${index + 1}`;
    return { value: String(score), label: `${tierLabel} (${score})` };
  });
}

function buildGradeFieldDefs(formType: string): GradeFieldDef[] {
  const config = WPBA_FORM_CONFIGS.find((c) => c.formType === formType);
  if (!config) {
    return [];
  }

  const defs: GradeFieldDef[] = [];

  for (const criteriaKey of config.criteriaKeys) {
    if (formType === "DOPS") {
      defs.push({ label: criteriaKey, column: criteriaKey, options: DOPS_OPTIONS });
      continue;
    }
    if (formType === "Extern Clinical Assessment") {
      defs.push({
        label: criteriaKey,
        column: getExternScoreColumnName(criteriaKey),
        options: toTierOptions(getExternScoreTiers(criteriaKey), EXTERN_TIER_LABELS),
      });
      continue;
    }
    if (formType === "Journal Conference") {
      defs.push({
        label: criteriaKey,
        column: getJournalClubScoreColumnName(criteriaKey),
        options: toTierOptions(getJournalClubScoreTiers(criteriaKey), JC_TIER_LABELS),
      });
      continue;
    }
    if (formType === "Multisource Feedback") {
      defs.push({
        label: criteriaKey,
        column: getMsfScoreColumnName(criteriaKey),
        options: toTierOptions(getMsfScoreTiers(criteriaKey), MSF_TIER_LABELS_THAI),
      });
      continue;
    }
    if (formType === "Case-Based Discussion") {
      defs.push({
        label: criteriaKey,
        column: getCbdScoreColumnName(criteriaKey),
        options: toTierOptions(getCbdScoreTiers(criteriaKey), CBD_TIER_LABELS),
      });
      continue;
    }
    if (formType === "MiniCEX") {
      defs.push({
        label: criteriaKey,
        column: getMiniCexScoreColumnName(criteriaKey),
        options: toTierOptions(getMiniCexScoreTiers(criteriaKey), MINICEX_TIER_LABELS),
      });
      continue;
    }
    if (formType === IM_HEALTH_ED_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getImHealthEdScoreColumnName(criteriaKey),
        options: toTierOptions(getImHealthEdScoreTiers(), getImHealthEdTierLabels(criteriaKey)),
      });
      continue;
    }
    if (formType === CASE_PRESENTATION_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getCasePresentationScoreColumnName(criteriaKey),
        options: toTierOptions(getCasePresentationScoreTiers(criteriaKey), CASE_PRESENTATION_TIER_LABELS),
      });
      continue;
    }
    if (formType === INTERESTING_CASE_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getInterestingCaseScoreColumnName(criteriaKey),
        options: toTierOptions(getInterestingCaseScoreTiers(criteriaKey), INTERESTING_CASE_TIER_LABELS),
      });
      continue;
    }
    if (formType === OPD_ASSESSMENT_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getOpdAssessmentScoreColumnName(criteriaKey),
        options: toTierOptions(getOpdAssessmentScoreTiers(criteriaKey), OPD_ASSESSMENT_TIER_LABELS),
      });
      continue;
    }
    if (formType === INTERESTING_CASE_GENERAL_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getInterestingCaseGeneralScoreColumnName(criteriaKey),
        options: toTierOptions(
          getInterestingCaseGeneralScoreTiers(criteriaKey),
          INTERESTING_CASE_GENERAL_TIER_LABELS
        ),
      });
      continue;
    }
    if (formType === ANTICIPATORY_GUIDANCE_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getAnticipatoryGuidanceScoreColumnName(criteriaKey),
        options: toTierOptions(
          getAnticipatoryGuidanceScoreTiers(criteriaKey),
          ANTICIPATORY_GUIDANCE_TIER_LABELS
        ),
      });
      continue;
    }
    if (formType === OR_ASSESSMENT_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getOrAssessmentScoreColumnName(criteriaKey),
        options: toTierOptions(getOrAssessmentScoreTiers(criteriaKey), OR_ASSESSMENT_TIER_LABELS),
      });
      continue;
    }
    if (formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getObgynHealthEducationScoreColumnName(criteriaKey),
        options: toTierOptions(getObgynHealthEducationScoreTiers(criteriaKey), OBGYN_HEALTH_EDUCATION_SCORE_LABELS),
      });
      continue;
    }
    if (formType === OPD_CLINICAL_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getOpdClinicalScoreColumnName(criteriaKey),
        options: toTierOptions(getOpdClinicalScoreTiers(criteriaKey), OPD_CLINICAL_TIER_LABELS),
      });
      continue;
    }
    if (formType === IPD_CLINICAL_FORM_TYPE) {
      defs.push({
        label: criteriaKey,
        column: getIpdClinicalScoreColumnName(criteriaKey),
        options: toTierOptions(getIpdClinicalScoreTiers(criteriaKey), IPD_CLINICAL_TIER_LABELS),
      });
      continue;
    }
  }

  if (config.overallPerformanceKey && config.overallPerformanceOptions?.length) {
    defs.push({
      label: config.overallPerformanceKey,
      column: config.overallPerformanceKey,
      options: config.overallPerformanceOptions.map((value) => ({ value, label: value })),
    });
  }

  return defs;
}

export default function StaffAssessmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeId = params.id;

  const [email, setEmail] = useState("");
  const [gateLoading, setGateLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState(true);
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [assessmentPkColumn, setAssessmentPkColumn] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [gradeDraft, setGradeDraft] = useState<Record<string, string>>({});
  const { language } = useUiLanguage();

  useEffect(() => {
    const gate = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) {
        router.replace("/");
        return;
      }
      const access = await getUserAccessLookupResultByEmail(user.email);
      if (!access.role || !access.isApproved) {
        await supabase.auth.signOut();
        router.replace("/");
        return;
      }
      if (access.role !== "Staff") {
        router.replace(getDashboardPathForRole(access.role));
        return;
      }
      setEmail(user.email);
      setGateLoading(false);
    };
    void gate();
  }, [router]);

  useEffect(() => {
    if (gateLoading || !routeId) {
      return;
    }

    const load = async () => {
      setRowLoading(true);
      setErrorMessage("");

      const profile = await getStaffProfileForCurrentUserWithError();
      if (profile.errorMessage || !profile.staffId || !profile.email) {
        setErrorMessage(profile.errorMessage ?? "Could not load staff profile.");
        setRowLoading(false);
        return;
      }

      const { data, idColumn, errorMessage: fetchErr } = await fetchAssessmentByRouteId(routeId);
      if (fetchErr || !data) {
        setErrorMessage(fetchErr ?? "Assessment not found.");
        setAssessmentPkColumn(null);
        setRowLoading(false);
        return;
      }

      if (!staffCanAccessAssessmentRow(data, profile.email, profile.staffId)) {
        setErrorMessage("You do not have access to this assessment.");
        setAssessmentPkColumn(null);
        setRowLoading(false);
        return;
      }

      setAssessmentPkColumn(idColumn);
      setRow(data);
      setRowLoading(false);
    };

    void load();
  }, [gateLoading, routeId]);

  const formType = pickString(row ?? {}, ["Form Type", "form_type"]);
  const gradeFieldDefs = useMemo(() => buildGradeFieldDefs(formType), [formType]);

  useEffect(() => {
    if (!row) {
      return;
    }
    const nextDraft: Record<string, string> = {};
    for (const def of gradeFieldDefs) {
      nextDraft[def.column] = pickString(row, [def.column]);
    }
    queueMicrotask(() => setGradeDraft(nextDraft));
  }, [row, gradeFieldDefs]);

  const handleApprove = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!row || !assessmentPkColumn || !routeId) {
      setErrorMessage("Missing assessment data.");
      return;
    }

    const status = pickString(row, ["Status", "status"]);
    if (!isAwaitingStaffApproval(status)) {
      setErrorMessage("This assessment is not waiting for staff approval.");
      return;
    }

    const formType = pickString(row, ["Form Type", "form_type"]);
    const reflection = pickString(row, [STUDENT_SELF_REFLECTION_COLUMN, "Student Self-Reflection"]);
    const gradingDefs = buildGradeFieldDefs(formType);
    const missingGrading = gradingDefs.filter((def) => !(gradeDraft[def.column] ?? "").trim());
    if (missingGrading.length > 0) {
      setErrorMessage(
        `Please complete grading before approval. Missing: ${missingGrading[0]?.label ?? "criteria score"}.`
      );
      return;
    }

    const gradePayload: Record<string, string> = {};
    for (const def of gradingDefs) {
      gradePayload[def.column] = (gradeDraft[def.column] ?? "").trim();
    }

    const payload = {
      ...gradePayload,
      ...buildStaffApprovalUpdatePayload(formType, { studentSelfReflection: reflection }),
    };

    setSaving(true);
    const { error } = await supabase
      .from("Assessment")
      .update(payload)
      .eq(assessmentPkColumn, routeId);

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    const becameComplete = payload.Status === ASSESSMENT_STATUS_COMPLETE;
    setSuccessMessage(
      becameComplete
        ? "Assessment graded, approved, and marked complete (student self-reflection was already provided)."
        : "Assessment graded and approved. The student can complete self-reflection from their dashboard by the deadline."
    );
    setSaving(false);
    const updated = { ...row, ...payload };
    setRow(updated);
  };

  if (gateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">{t(language, "Loading...", "กำลังโหลด...")}</p>
      </div>
    );
  }

  if (rowLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <DashboardNav email={email} />
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-slate-600">{t(language, "Loading assessment...", "กำลังโหลดแบบประเมิน...")}</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !row) {
    return (
      <div className="min-h-screen bg-slate-100">
        <DashboardNav email={email} />
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-rose-700">{errorMessage}</p>
          <Link href="/staff" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
            {t(language, "Back to staff dashboard", "กลับไปหน้าแดชบอร์ดอาจารย์/เจ้าหน้าที่")}
          </Link>
        </div>
      </div>
    );
  }

  if (!row) {
    return null;
  }

  const studentId = pickString(row, ["Student ID", "StudentID", "student_id"]);
  const staffIdOnRow = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
  const status = pickString(row, ["Status", "status"]);
  const evaluatorEmail = pickString(row, ["Evaluator Email", "EvaluatorEmail"]);
  const hospital = pickString(row, ["Hospital", "hospital"]);
  const dept = pickString(row, ["Department/Rotation", "Department"]);
  const procedureName = pickString(row, ["Procedure Name", "procedure_name"]);
  const reflection = pickString(row, [STUDENT_SELF_REFLECTION_COLUMN, "Student Self-Reflection"]);
  const pendingApproval = isAwaitingStaffApproval(status);
  const obgynTopic = pickString(row, [OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN]);
  const rubricLink =
    formType === "DOPS"
      ? findDopsProcedureRubric(procedureName)
      : formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE
        ? getObgynHealthEducationTopicRubric(obgynTopic) ?? getFormTypeRubric(formType)
        : getFormTypeRubric(formType);

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNav email={email} />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/staff" className="text-sm font-medium text-slate-600 underline hover:text-slate-900">
          ← {t(language, "Staff dashboard", "แดชบอร์ดอาจารย์/เจ้าหน้าที่")}
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-slate-900">{t(language, "Assessment review", "ตรวจทานแบบประเมิน")}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Form: <strong>{formType || "—"}</strong> · Status: <strong>{status || "—"}</strong>
        </p>

        <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm text-slate-800">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Student ID</dt>
              <dd>{studentId || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Staff ID (evaluator)</dt>
              <dd>{staffIdOnRow || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Evaluator email (submitter)</dt>
              <dd className="break-all">{evaluatorEmail || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Hospital</dt>
              <dd>{hospital || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Department / rotation</dt>
              <dd>{dept || "—"}</dd>
            </div>
            {formType === "DOPS" ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Procedure name</dt>
                <dd>{procedureName || "—"}</dd>
              </div>
            ) : null}
            {formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE ? (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Health education topic</dt>
                <dd>{obgynTopic || "—"}</dd>
              </div>
            ) : null}
          </dl>

          {rubricLink ? (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900">
              <p className="font-semibold">{rubricLink.title}</p>
              <a
                href={rubricLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block underline underline-offset-2 hover:text-indigo-700"
              >
                {t(language, "Open rubric PDF", "เปิดไฟล์เกณฑ์ประเมิน PDF")} ↗
              </a>
            </div>
          ) : null}

          {reflection ? (
            <div>
                <h2 className="text-sm font-semibold text-slate-900">{t(language, "Student self-reflection", "การสะท้อนตนเองของนักศึกษา")}</h2>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-700">{reflection}</p>
            </div>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="mt-4 text-sm text-rose-700" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mt-4 text-sm text-emerald-800" role="status">
            {successMessage}
          </p>
        ) : null}

        {pendingApproval ? (
          <form onSubmit={handleApprove} className="mt-6">
            <p className="text-sm text-slate-600">
              This submission is waiting for your grading + approval. If the student already entered self-reflection
              on the form, approving marks the assessment <strong>complete</strong>. If not, approving sends it to
              student follow-up (deadline for self-reflection on their dashboard).
            </p>
            {gradeFieldDefs.length > 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">{t(language, "Grading review", "ทบทวนการให้คะแนน")}</h2>
                <p className="mt-1 text-xs text-slate-600">
                  Recheck the student&apos;s grades. If no grade was provided, fill all fields before approving.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {gradeFieldDefs.map((def) => (
                    <label key={def.column} className="block">
                      <span className="mb-1 block text-xs font-medium text-slate-700">{def.label}</span>
                      <select
                        value={gradeDraft[def.column] ?? ""}
                        onChange={(event) =>
                          setGradeDraft((previous) => ({ ...previous, [def.column]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                      >
                        <option value="">{t(language, "Select grade", "เลือกคะแนน")}</option>
                        {def.options.map((opt) => (
                          <option key={`${def.column}-${opt.value}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={saving || !assessmentPkColumn}
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? t(language, "Approving…", "กำลังอนุมัติ...") : t(language, "Approve assessment", "อนุมัติแบบประเมิน")}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-slate-600">
            {t(
              language,
              'No approval action is required for this record (not in "Pending Staff Approval" status).',
              "รายการนี้ไม่ต้องอนุมัติ (ไม่ได้อยู่สถานะรออาจารย์อนุมัติ)"
            )}
          </p>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Record ID: {pickAssessmentRowId(row) || "—"}
        </p>
      </main>
    </div>
  );
}
