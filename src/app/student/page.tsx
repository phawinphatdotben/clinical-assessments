"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AssessmentSearchBar } from "../components/assessment-search-bar";
import { CreateAssessmentDashboardFoot, CreateAssessmentTabPanel } from "../components/create-assessment-links";
import { DashboardRoleTabs, type DashboardMainTab } from "../components/dashboard-role-tabs";
import { DepartmentPortfolioChart } from "../components/department-portfolio-chart";
import { DashboardNav } from "../components/dashboard-nav";
import { DopsLogbookPanel } from "../components/dops-logbook-panel";
import {
  aggregateCompletedWpbaByDepartment,
  emptyUserDirectoryLookup,
  fetchApprovedUsersDirectory,
  filterAssessmentsByPersonSearch,
  type UserDirectoryLookup,
} from "../lib/assessment-filters";
import { getDashboardPathForRole, getUserAccessLookupResultByEmail } from "../lib/auth";
import {
  SELF_REFLECTION_DEADLINE_COLUMN,
  STUDENT_FEEDBACK_FORM_TYPES,
  formatSelfReflectionDeadline,
  fetchAssessmentHistoryRows,
  formatAssessmentDateMedium,
  getStudentDashboardSummaryStatus,
  getStudentFormSlugForAssessmentFormType,
  getStudentIdForCurrentUserWithError,
  pickAssessmentRowId,
  pickAssessmentRowTimestampRaw,
  isSelfReflectionDeadlinePassed,
  normalizeAssessmentStatusLabel,
  type StudentDashboardSummaryStatus,
} from "../lib/student-feedback";
import { supabase } from "../lib/supabase";
import { t, useUiLanguage } from "../lib/ui-language";

type AssessmentRow = Record<string, unknown> & {
  id?: string | number;
};

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

export default function StudentDashboardPage() {
  const router = useRouter();
  const { language } = useUiLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [reflectionRows, setReflectionRows] = useState<AssessmentRow[]>([]);
  const [reflectionLoading, setReflectionLoading] = useState(true);
  const [historyRows, setHistoryRows] = useState<AssessmentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [teacherNameByStaffId, setTeacherNameByStaffId] = useState<Record<string, string>>({});
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [reflectionLoadError, setReflectionLoadError] = useState<string | null>(null);
  const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<DashboardMainTab>("dashboard");
  const [personSearch, setPersonSearch] = useState("");
  const [currentStudentId, setCurrentStudentId] = useState("");
  const [userLookup, setUserLookup] = useState<UserDirectoryLookup | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  useEffect(() => {
    const validateAccess = async () => {
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
      setIsLoading(false);
    };

    void validateAccess();
  }, [router]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    let cancelled = false;

    const resolveTeacherNames = async (rows: AssessmentRow[]) => {
      const staffIds = [
        ...new Set(
          rows
            .map((raw) => pickString(raw as Record<string, unknown>, ["Staff ID", "StaffID", "staff_id"]))
            .filter((id) => Boolean(id))
        ),
      ];
      if (staffIds.length === 0) {
        setTeacherNameByStaffId({});
        return;
      }
      const { data: userRows, error: userError } = await supabase
        .from("Users")
        .select('"Staff ID", "Name", "Email"')
        .in("Staff ID", staffIds);
      const map: Record<string, string> = {};
      if (!userError && userRows?.length) {
        for (const u of userRows) {
          const row = u as Record<string, unknown>;
          const sid = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
          if (!sid || map[sid]) {
            continue;
          }
          const name = pickString(row, ["Name", "name", "Full Name", "full_name"]);
          const email = pickString(row, ["Email", "email"]);
          const label =
            name || (email ? (email.split("@")[0] ?? email).trim() : "") || `Staff ${sid}`;
          map[sid] = label;
        }
      }
      if (!cancelled) {
        setTeacherNameByStaffId(map);
      }
    };

    const loadDashboardData = async () => {
      setReflectionLoading(true);
      setHistoryLoading(true);
      setProfileLoadError(null);
      setReflectionLoadError(null);
      setHistoryLoadError(null);

      const { studentId, errorMessage: profileErr } = await getStudentIdForCurrentUserWithError();
      if (!studentId) {
        if (!cancelled) {
          setCurrentStudentId("");
          setProfileLoadError(profileErr);
          setReflectionRows([]);
          setHistoryRows([]);
          setTeacherNameByStaffId({});
          setReflectionLoading(false);
          setHistoryLoading(false);
        }
        return;
      }
      setCurrentStudentId(studentId);

      const [refRes, histResult] = await Promise.all([
        supabase
          .from("Assessment")
          .select("*")
          .eq("Student ID", studentId)
          .in("Form Type", [...STUDENT_FEEDBACK_FORM_TYPES]),
        fetchAssessmentHistoryRows(studentId),
      ]);

      if (cancelled) {
        return;
      }

      if (refRes.error) {
        setReflectionLoadError(refRes.error.message);
        setReflectionRows([]);
      } else {
        const filtered = (refRes.data ?? []).filter((raw) => {
          const st = pickString(raw as Record<string, unknown>, ["Status", "status"]);
          const label = normalizeAssessmentStatusLabel(st);
          const lower = st.trim().toLowerCase();
          return (
            label === "Pending" ||
            label === "Complete" ||
            label === "Fail" ||
            lower === "submitted"
          );
        });
        setReflectionRows(filtered as AssessmentRow[]);
      }
      setReflectionLoading(false);

      if (histResult.errorMessage) {
        setHistoryLoadError(histResult.errorMessage);
        setHistoryRows([]);
        setTeacherNameByStaffId({});
      } else {
        const historyData = histResult.rows as AssessmentRow[];
        setHistoryRows(historyData);
        setHistoryLoadError(null);
        await resolveTeacherNames(historyData);
      }
      setHistoryLoading(false);
    };

    void loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    let cancelled = false;
    void fetchApprovedUsersDirectory().then(({ lookup, errorMessage }) => {
      if (cancelled) {
        return;
      }
      setUserLookup(lookup);
      setDirectoryError(errorMessage);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  const lookupForFilter = useMemo(() => userLookup ?? emptyUserDirectoryLookup(), [userLookup]);

  const filteredReflectionRows = useMemo(() => {
    return filterAssessmentsByPersonSearch(
      reflectionRows as Record<string, unknown>[],
      personSearch,
      lookupForFilter
    ) as AssessmentRow[];
  }, [reflectionRows, personSearch, lookupForFilter]);

  const filteredHistoryRows = useMemo(() => {
    return filterAssessmentsByPersonSearch(
      historyRows as Record<string, unknown>[],
      personSearch,
      lookupForFilter
    ) as AssessmentRow[];
  }, [historyRows, personSearch, lookupForFilter]);

  const portfolioByDepartment = useMemo(
    () => aggregateCompletedWpbaByDepartment(historyRows as Record<string, unknown>[]),
    [historyRows]
  );

  const { pendingList, completeList, failList } = useMemo(() => {
    const pending: AssessmentRow[] = [];
    const complete: AssessmentRow[] = [];
    const fail: AssessmentRow[] = [];

    for (const row of filteredReflectionRows) {
      const st = pickString(row, ["Status", "status"]);
      const label = normalizeAssessmentStatusLabel(st);
      if (label === "Pending") {
        pending.push(row);
      } else if (label === "Complete") {
        complete.push(row);
      } else if (label === "Fail") {
        fail.push(row);
      }
    }

    const byDeadline = (a: AssessmentRow, b: AssessmentRow) => {
      const da = pickString(a, [SELF_REFLECTION_DEADLINE_COLUMN, "deadline", "Deadline"]);
      const db = pickString(b, [SELF_REFLECTION_DEADLINE_COLUMN, "deadline", "Deadline"]);
      return da.localeCompare(db);
    };

    pending.sort(byDeadline);
    complete.sort((a, b) => {
      const ca = pickString(a, ["created_at"]);
      const cb = pickString(b, ["created_at"]);
      return cb.localeCompare(ca);
    });

    return { pendingList: pending, completeList: complete, failList: fail };
  }, [filteredReflectionRows]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">{t(language, "Loading dashboard...", "กำลังโหลดแดชบอร์ด...")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNav email={email} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">{t(language, "Student Dashboard", "แดชบอร์ดนักศึกษา")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t(language, "Welcome. You are signed in as a Student user.", "ยินดีต้อนรับ คุณเข้าสู่ระบบในบทบาทนักศึกษา")}
          </p>

          <div className="mt-6">
            <DashboardRoleTabs active={mainTab} onChange={setMainTab} variant="role" />
          </div>

          {mainTab === "portfolio" ? (
            <div className="mt-6">
              <DepartmentPortfolioChart data={portfolioByDepartment} />
            </div>
          ) : null}

          {mainTab === "create" ? <CreateAssessmentTabPanel role="student" /> : null}

          {mainTab === "dashboard" ? (
            <>
          {directoryError ? (
            <p className="mt-2 text-xs text-amber-800" role="status">
              Directory lookup: {directoryError} — search may be limited to IDs and emails on the assessment only.
            </p>
          ) : null}
          <AssessmentSearchBar value={personSearch} onChange={setPersonSearch} id="student-assessment-search" />
          {profileLoadError ? (
            <div
              className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
              role="alert"
            >
              <p className="font-medium">{t(language, "Could not load your student profile", "ไม่สามารถโหลดข้อมูลโปรไฟล์นักศึกษาได้")}</p>
              <p className="mt-1 text-rose-800">{profileLoadError}</p>
            </div>
          ) : null}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-900">{t(language, "Student Self-Reflection", "การสะท้อนตนเองของนักศึกษา")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              For DOPS, Case-Based Discussion, MiniCEX, Internal Medicine Health Education, and OB/GYNE Health
              Education, complete your
              self-reflection within{" "}
              <strong>10 days</strong> of the assessment being created. Status and deadline come from your
              record in the system.
            </p>

            {reflectionLoadError ? (
              <div
                className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                role="alert"
              >
                {reflectionLoadError}
              </div>
            ) : null}

            {reflectionLoading ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "Loading assessments...", "กำลังโหลดแบบประเมิน...")}</p>
            ) : reflectionRows.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                {t(language, "No DOPS, CbD, or MiniCEX assessments in your self-reflection workflow yet.", "ยังไม่มีแบบประเมิน DOPS, CbD หรือ MiniCEX ในขั้นตอนการสะท้อนตนเอง")}
              </p>
            ) : filteredReflectionRows.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "No assessments match your search.", "ไม่พบแบบประเมินที่ตรงกับการค้นหา")}</p>
            ) : (
              <div className="mt-6 space-y-8">
                <ReflectionSection
                  title={t(language, "Pending — self-reflection required", "รอดำเนินการ — ต้องกรอกการสะท้อนตนเอง")}
                  description={t(language, "Submit your Student Self-Reflection before the deadline.", "กรุณาส่งการสะท้อนตนเองก่อนถึงกำหนด")}
                  rows={pendingList}
                  emptyMessage={t(language, "Nothing pending.", "ไม่มีรายการค้างอยู่")}
                  variant="pending"
                />
                <ReflectionSection
                  title={t(language, "Complete", "เสร็จสิ้น")}
                  description={t(language, "You have submitted your Student Self-Reflection.", "คุณได้ส่งการสะท้อนตนเองแล้ว")}
                  rows={completeList}
                  emptyMessage={t(language, "No completed items yet.", "ยังไม่มีรายการที่เสร็จสิ้น")}
                  variant="complete"
                />
                <ReflectionSection
                  title={t(language, "Fail — redo required", "ไม่ผ่าน — ต้องทำใหม่")}
                  description={t(language, "Create a new assessment submission for this type.", "กรุณาสร้างการส่งแบบประเมินใหม่สำหรับแบบนี้")}
                  rows={failList}
                  emptyMessage={t(language, "No failed assessments.", "ไม่มีรายการที่ไม่ผ่าน")}
                  variant="fail"
                />
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-900">{t(language, "Your assessments", "แบบประเมินของคุณ")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Summary of all forms linked to your Student ID. Scores are not shown—only form type, date, teacher,
              and status.
            </p>
            {historyLoadError ? (
              <div
                className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
                role="alert"
              >
              <p className="font-medium">{t(language, "Could not load assessments", "ไม่สามารถโหลดแบบประเมินได้")}</p>
                <p className="mt-1">{historyLoadError}</p>
                <p className="mt-2 text-xs text-rose-800">
                  If this mentions policy or permission, re-run the latest{" "}
                  <code className="rounded bg-rose-100 px-1">rls-student-dashboard.sql</code> (Assessment policy
                  uses <code className="rounded bg-rose-100 px-1">Student ID::text</code> so IDs match).
                </p>
              </div>
            ) : null}

            {historyLoading ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "Loading your assessments...", "กำลังโหลดแบบประเมินของคุณ...")}</p>
            ) : !historyLoadError && historyRows.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "No assessments recorded yet.", "ยังไม่มีแบบประเมินที่บันทึกไว้")}</p>
            ) : !historyLoadError && filteredHistoryRows.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "No assessments match your search.", "ไม่พบแบบประเมินที่ตรงกับการค้นหา")}</p>
            ) : !historyLoadError && filteredHistoryRows.length > 0 ? (
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3">{t(language, "Form", "แบบฟอร์ม")}</th>
                      <th className="px-4 py-3">{t(language, "Date completed", "วันที่เสร็จสิ้น")}</th>
                      <th className="px-4 py-3">{t(language, "Teacher", "อาจารย์")}</th>
                      <th className="px-4 py-3">{t(language, "Status", "สถานะ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredHistoryRows.map((row, index) => (
                      <AssessmentHistoryRow
                        key={pickAssessmentRowId(row as Record<string, unknown>) || `h-${index}`}
                        row={row}
                        teacherNameByStaffId={teacherNameByStaffId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <CreateAssessmentDashboardFoot role="student" />
            </>
          ) : null}
        </section>

        {mainTab === "logbook" ? <DopsLogbookPanel role="Student" studentId={currentStudentId} /> : null}
      </main>
    </div>
  );
}

function ReflectionSection({
  title,
  description,
  rows,
  emptyMessage,
  variant,
}: {
  title: string;
  description: string;
  rows: AssessmentRow[];
  emptyMessage: string;
  variant: "pending" | "complete" | "fail";
}) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row, index) => (
            <ReflectionRow
              key={pickAssessmentRowId(row as Record<string, unknown>) || `ref-${index}`}
              row={row}
              variant={variant}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ReflectionRow({ row, variant }: { row: AssessmentRow; variant: "pending" | "complete" | "fail" }) {
  const formType = pickString(row, ["Form Type", "form_type"]);
  const staffId = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
  const hospital = pickString(row, ["Hospital", "hospital"]);
  const statusRaw = pickString(row, ["Status", "status"]);
  const label = normalizeAssessmentStatusLabel(statusRaw);
  const deadlineRaw = row[SELF_REFLECTION_DEADLINE_COLUMN] ?? row["deadline"] ?? row["Deadline"];
  const deadlineText = formatSelfReflectionDeadline(deadlineRaw);
  const overdue = variant === "pending" && isSelfReflectionDeadlinePassed(deadlineRaw);
  const slug = getStudentFormSlugForAssessmentFormType(formType);

  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
        variant === "fail"
          ? "border-rose-200 bg-rose-50"
          : variant === "complete"
            ? "border-emerald-200 bg-emerald-50/60"
            : overdue
              ? "border-amber-300 bg-amber-50"
              : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-slate-900">{formType || "Assessment"}</p>
          <StatusBadge label={label} />
        </div>
        {staffId ? <p className="text-xs text-slate-600">Staff ID: {staffId}</p> : null}
        {hospital ? <p className="text-xs text-slate-600">{hospital}</p> : null}
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-medium text-slate-800">Deadline: </span>
          {deadlineText}
          {variant === "pending" && overdue ? (
            <span className="ml-2 font-medium text-amber-800">(overdue)</span>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        {variant === "pending" && pickAssessmentRowId(row as Record<string, unknown>) ? (
          <Link
            href={`/student/pending-feedback/${encodeURIComponent(
              pickAssessmentRowId(row as Record<string, unknown>)
            )}`}
            className="inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Add Student Self-Reflection
          </Link>
        ) : variant === "pending" ? (
          <span className="text-xs text-amber-800">No row ID on this assessment—add an id column in Supabase.</span>
        ) : null}
        {variant === "fail" && slug ? (
          <Link
            href={`/student/forms/${slug}`}
            className="inline-flex rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-900 transition hover:bg-rose-100"
          >
            Create new {formType}
          </Link>
        ) : null}
      </div>
    </li>
  );
}

function formatHistoryCompletedDate(
  row: AssessmentRow,
  summary: StudentDashboardSummaryStatus
): string {
  if (summary === "Pending") {
    return "—";
  }
  const raw = pickAssessmentRowTimestampRaw(row as Record<string, unknown>);
  return formatAssessmentDateMedium(raw);
}

function AssessmentHistoryRow({
  row,
  teacherNameByStaffId,
}: {
  row: AssessmentRow;
  teacherNameByStaffId: Record<string, string>;
}) {
  const formType = pickString(row, ["Form Type", "form_type"]);
  const statusRaw = pickString(row, ["Status", "status"]);
  const summary = getStudentDashboardSummaryStatus(statusRaw);
  const staffId = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
  const teacher =
    (staffId && teacherNameByStaffId[staffId]) || (staffId ? `Staff ID ${staffId}` : "—");
  const dateText = formatHistoryCompletedDate(row, summary);

  return (
    <tr className="text-slate-800">
      <td className="px-4 py-3 font-medium text-slate-900">{formType || "—"}</td>
      <td className="px-4 py-3 text-slate-600">{dateText}</td>
      <td className="px-4 py-3 text-slate-600">{teacher}</td>
      <td className="px-4 py-3">
        <SummaryStatusBadge label={summary} />
      </td>
    </tr>
  );
}

function SummaryStatusBadge({ label }: { label: StudentDashboardSummaryStatus }) {
  const styles =
    label === "Pending"
      ? "bg-amber-100 text-amber-900 ring-amber-200"
      : label === "Complete"
        ? "bg-emerald-100 text-emerald-900 ring-emerald-200"
        : label === "Fail"
          ? "bg-rose-100 text-rose-900 ring-rose-200"
          : "bg-slate-100 text-slate-800 ring-slate-200";

  const text =
    label === "Pending"
      ? "Pending"
      : label === "Complete"
        ? "Complete"
        : label === "Fail"
          ? "Fail"
          : "Other";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      {text}
    </span>
  );
}

function StatusBadge({ label }: { label: ReturnType<typeof normalizeAssessmentStatusLabel> }) {
  const styles =
    label === "Pending"
      ? "bg-amber-100 text-amber-900 ring-amber-200"
      : label === "Complete"
        ? "bg-emerald-100 text-emerald-900 ring-emerald-200"
        : label === "Fail"
          ? "bg-rose-100 text-rose-900 ring-rose-200"
          : "bg-slate-100 text-slate-800 ring-slate-200";

  const text =
    label === "Pending" ? "Pending" : label === "Complete" ? "Complete" : label === "Fail" ? "Fail" : label;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      {text}
    </span>
  );
}
