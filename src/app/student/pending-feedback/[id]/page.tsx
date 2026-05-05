"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardNav } from "../../../components/dashboard-nav";
import { getDashboardPathForRole, getUserAccessLookupResultByEmail } from "../../../lib/auth";
import {
  ASSESSMENT_STATUS_COMPLETE,
  STUDENT_SELF_REFLECTION_COLUMN,
  fetchAssessmentByRouteId,
  formTypeUsesStudentFeedback,
  getStudentIdForCurrentUser,
  isPendingSelfReflectionStatus,
} from "../../../lib/student-feedback";
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

export default function PendingStudentFeedbackPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [email, setEmail] = useState("");
  const [gateLoading, setGateLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState(true);
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [feedback, setFeedback] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  /** Which Assessment column matched the URL id (id, Assessment ID, …). */
  const [assessmentPkColumn, setAssessmentPkColumn] = useState<string | null>(null);
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
      if (access.role !== "Student") {
        router.replace(getDashboardPathForRole(access.role));
        return;
      }
      setEmail(user.email);
      setGateLoading(false);
    };
    void gate();
  }, [router]);

  useEffect(() => {
    if (gateLoading || !id) {
      return;
    }

    const load = async () => {
      setRowLoading(true);
      setErrorMessage("");

      const studentId = await getStudentIdForCurrentUser();
      if (!studentId) {
        setErrorMessage("Could not load your student profile.");
        setRowLoading(false);
        return;
      }

      const { data, idColumn, errorMessage: fetchErr } = await fetchAssessmentByRouteId(id);

      if (fetchErr || !data) {
        setErrorMessage(fetchErr ?? "Assessment not found.");
        setAssessmentPkColumn(null);
        setRowLoading(false);
        return;
      }

      setAssessmentPkColumn(idColumn);
      const assessment = data;
      const rowStudentId = pickString(assessment, ["Student ID", "StudentID", "student_id"]);
      if (rowStudentId !== studentId) {
        setErrorMessage("This assessment is not assigned to your student account.");
        setRowLoading(false);
        return;
      }

      const status = pickString(assessment, ["Status", "status"]);
      if (!isPendingSelfReflectionStatus(status)) {
        setErrorMessage("This assessment is not waiting for your Student Self-Reflection.");
        setRowLoading(false);
        return;
      }

      const formType = pickString(assessment, ["Form Type", "form_type"]);
      if (!formTypeUsesStudentFeedback(formType)) {
        setErrorMessage("Student Self-Reflection is not used for this form type.");
        setRowLoading(false);
        return;
      }

      setRow(assessment);
      setFeedback(
        pickString(assessment, [STUDENT_SELF_REFLECTION_COLUMN, "Student Feedback", "student_feedback"])
      );
      setRowLoading(false);
    };

    void load();
  }, [gateLoading, id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!feedback.trim()) {
      setErrorMessage("Please enter your Student Self-Reflection before submitting.");
      return;
    }

    if (!assessmentPkColumn) {
      setErrorMessage("Cannot save: primary key column not found for this assessment.");
      return;
    }

    setSaving(true);
    const { data: updatedRows, error } = await supabase
      .from("Assessment")
      .update({
        [STUDENT_SELF_REFLECTION_COLUMN]: feedback.trim(),
        Status: ASSESSMENT_STATUS_COMPLETE,
      })
      .eq(assessmentPkColumn, id)
      .select("Status");

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    if (!updatedRows?.length) {
      setErrorMessage(
        "Nothing was updated. Your account may not have permission to save (run the Student UPDATE policy in supabase/rls-student-dashboard.sql), or this assessment ID did not match a row."
      );
      setSaving(false);
      return;
    }

      setSuccessMessage(t(language, "Thank you. Your Student Self-Reflection has been saved.", "บันทึกการสะท้อนตนเองเรียบร้อยแล้ว ขอบคุณครับ/ค่ะ"));
    setSaving(false);
    setTimeout(() => {
      router.push("/student");
    }, 1200);
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
        <div className="mx-auto max-w-2xl px-6 py-10">
          <p className="text-sm text-slate-600">{t(language, "Loading assessment...", "กำลังโหลดแบบประเมิน...")}</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !row) {
    return (
      <div className="min-h-screen bg-slate-100">
        <DashboardNav email={email} />
        <div className="mx-auto max-w-2xl px-6 py-10">
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {errorMessage}
          </p>
          <Link href="/student" className="mt-4 inline-block text-sm font-medium text-slate-700 underline">
            {t(language, "Back to dashboard", "กลับไปหน้าแดชบอร์ด")}
          </Link>
        </div>
      </div>
    );
  }

  if (!row) {
    return null;
  }

  const formType = pickString(row, ["Form Type", "form_type"]);
  const staffId = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
  const hospital = pickString(row, ["Hospital", "hospital"]);

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNav email={email} />
      <main className="mx-auto w-full max-w-2xl px-6 py-10">
        <Link href="/student" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← {t(language, "Student dashboard", "แดชบอร์ดนักศึกษา")}
        </Link>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">{t(language, "Student Self-Reflection", "การสะท้อนตนเองของนักศึกษา")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your evaluator submitted this {formType} assessment. Please add your Student Self-Reflection
            below.
          </p>

          <dl className="mt-4 grid gap-2 text-sm text-slate-700">
            <div>
              <dt className="font-medium text-slate-500">Form</dt>
              <dd>{formType}</dd>
            </div>
            {staffId ? (
              <div>
                <dt className="font-medium text-slate-500">Staff ID</dt>
                <dd>{staffId}</dd>
              </div>
            ) : null}
            {hospital ? (
              <div>
                <dt className="font-medium text-slate-500">Hospital</dt>
                <dd>{hospital}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Student Self-Reflection <span className="text-rose-600">*</span>
            </span>
            <textarea
              required
              rows={6}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              placeholder="Reflection on the encounter, what went well, and what you want to improve."
            />
          </label>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
                {saving
                  ? t(language, "Saving...", "กำลังบันทึก...")
                  : t(language, "Submit Student Self-Reflection", "ส่งการสะท้อนตนเองของนักศึกษา")}
          </button>
        </form>
      </main>
    </div>
  );
}
