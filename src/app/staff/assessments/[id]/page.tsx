"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
    const payload = buildStaffApprovalUpdatePayload(formType, { studentSelfReflection: reflection });

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
        ? "Assessment approved and marked complete (student self-reflection was already provided)."
        : "Assessment approved. The student can complete self-reflection from their dashboard by the deadline."
    );
    setSaving(false);
    setRow({ ...row, ...payload });
  };

  if (gateLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Loading...</p>
      </div>
    );
  }

  if (rowLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <DashboardNav email={email} />
        <div className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-slate-600">Loading assessment...</p>
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
            Back to staff dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!row) {
    return null;
  }

  const formType = pickString(row, ["Form Type", "form_type"]);
  const studentId = pickString(row, ["Student ID", "StudentID", "student_id"]);
  const staffIdOnRow = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
  const status = pickString(row, ["Status", "status"]);
  const evaluatorEmail = pickString(row, ["Evaluator Email", "EvaluatorEmail"]);
  const hospital = pickString(row, ["Hospital", "hospital"]);
  const dept = pickString(row, ["Department/Rotation", "Department"]);
  const reflection = pickString(row, [STUDENT_SELF_REFLECTION_COLUMN, "Student Self-Reflection"]);
  const pendingApproval = isAwaitingStaffApproval(status);

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNav email={email} />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/staff" className="text-sm font-medium text-slate-600 underline hover:text-slate-900">
          ← Staff dashboard
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-slate-900">Assessment review</h1>
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
          </dl>

          {reflection ? (
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Student self-reflection</h2>
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
              This submission is waiting for you to approve it. If the student already entered self-reflection on
              the form, approving marks the assessment <strong>complete</strong>. If not, approving sends it to
              the usual student follow-up (deadline for self-reflection on their dashboard).
            </p>
            <button
              type="submit"
              disabled={saving || !assessmentPkColumn}
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Approving…" : "Approve assessment"}
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-slate-600">
            No approval action is required for this record (not in &quot;Pending Staff Approval&quot; status).
          </p>
        )}

        <p className="mt-6 text-xs text-slate-500">
          Record ID: {pickAssessmentRowId(row) || "—"}
        </p>
      </main>
    </div>
  );
}
