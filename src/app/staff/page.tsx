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
  fetchStaffAssessmentsForCurrentUser,
  formatStaffAssessmentStatusLabel,
  getStaffProfileForCurrentUserWithError,
  pickAssessmentRowId,
} from "../lib/staff-assessments";
import {
  ASSESSMENT_STATUS_COMPLETE_FAIL,
  ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL,
} from "../lib/student-feedback";
import { supabase } from "../lib/supabase";
import { t, useUiLanguage } from "../lib/ui-language";

type AssessmentRow = Record<string, unknown> & { id?: string | number };

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

function formatRowDate(row: AssessmentRow): string {
  const raw = row.updated_at ?? row.created_at;
  if (raw == null || raw === "") {
    return "—";
  }
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const { language } = useUiLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<DashboardMainTab>("dashboard");
  const [personSearch, setPersonSearch] = useState("");
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

      if (access.role !== "Staff") {
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

    const load = async () => {
      setListLoading(true);
      setListError(null);
      setProfileError(null);

      const profile = await getStaffProfileForCurrentUserWithError();
      if (!profile.staffId || !profile.email) {
        if (!cancelled) {
          setProfileError(profile.errorMessage);
          setRows([]);
          setListLoading(false);
        }
        return;
      }

      const { rows: data, errorMessage } = await fetchStaffAssessmentsForCurrentUser(
        profile.email,
        profile.staffId
      );

      if (cancelled) {
        return;
      }

      if (errorMessage) {
        setListError(errorMessage);
        setRows([]);
      } else {
        setRows(data as AssessmentRow[]);
      }
      setListLoading(false);
    };

    void load();
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

  const filteredRows = useMemo(
    () =>
      filterAssessmentsByPersonSearch(
        rows as Record<string, unknown>[],
        personSearch,
        lookupForFilter
      ) as AssessmentRow[],
    [rows, personSearch, lookupForFilter]
  );

  const portfolioByDepartment = useMemo(
    () => aggregateCompletedWpbaByDepartment(rows as Record<string, unknown>[]),
    [rows]
  );

  const pendingApprovalCount = useMemo(() => {
    return filteredRows.filter(
      (r) =>
        pickString(r as Record<string, unknown>, ["Status", "status"]) ===
        ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL
    ).length;
  }, [filteredRows]);

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
          <h1 className="text-2xl font-semibold text-slate-900">{t(language, "Staff Dashboard", "แดชบอร์ดอาจารย์/เจ้าหน้าที่")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t(
              language,
              "Welcome. You are signed in as a Staff user. Assessments listed here are submissions you created (your email as evaluator) or submissions where you are the selected Staff ID evaluator.",
              "ยินดีต้อนรับ คุณเข้าสู่ระบบในบทบาทอาจารย์/เจ้าหน้าที่ รายการประเมินที่แสดงคือรายการที่คุณสร้าง หรือรายการที่ระบุ Staff ID ของคุณเป็นผู้ประเมิน"
            )}
          </p>

          <div className="mt-6">
            <DashboardRoleTabs active={mainTab} onChange={setMainTab} variant="role" />
          </div>

          {mainTab === "portfolio" ? (
            <div className="mt-6">
              <DepartmentPortfolioChart data={portfolioByDepartment} />
            </div>
          ) : null}

          {mainTab === "create" ? <CreateAssessmentTabPanel role="staff" /> : null}

          {mainTab === "dashboard" ? (
            <>
          {directoryError ? (
            <p className="mt-2 text-xs text-amber-800" role="status">
              Directory lookup: {directoryError} — search may be limited to IDs and emails on the assessment only.
            </p>
          ) : null}
          <AssessmentSearchBar value={personSearch} onChange={setPersonSearch} id="staff-assessment-search" />

          {profileError ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              <p className="font-medium">{t(language, "Profile", "โปรไฟล์")}</p>
              <p className="mt-1">{profileError}</p>
            </div>
          ) : null}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-900">{t(language, "Your assessments", "แบบประเมินของคุณ")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Open a row to review details. Student submissions that need you show status{" "}
              <strong>Awaiting your approval</strong> until you approve them.
              {pendingApprovalCount > 0 ? (
                <span className="ml-1 font-medium text-amber-900">
                  ({pendingApprovalCount} {t(language, "awaiting approval", "รออนุมัติ")})
                </span>
              ) : null}
            </p>

            {listError ? (
              <p className="mt-3 text-sm text-rose-700" role="alert">
                {listError}
              </p>
            ) : null}

            {listLoading ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "Loading assessments...", "กำลังโหลดแบบประเมิน...")}</p>
            ) : rows.length === 0 && !listError && !profileError ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "No assessments yet.", "ยังไม่มีแบบประเมิน")}</p>
            ) : !listLoading && rows.length > 0 && filteredRows.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "No assessments match your search.", "ไม่พบแบบประเมินที่ตรงกับการค้นหา")}</p>
            ) : !listLoading && filteredRows.length > 0 ? (
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-3">{t(language, "Form", "แบบฟอร์ม")}</th>
                      <th className="px-4 py-3">{t(language, "Student ID", "รหัสนักศึกษา")}</th>
                      <th className="px-4 py-3">{t(language, "Date", "วันที่")}</th>
                      <th className="px-4 py-3">{t(language, "Status", "สถานะ")}</th>
                      <th className="px-4 py-3">{t(language, "Action", "การดำเนินการ")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRows.map((row, index) => {
                      const raw = row as Record<string, unknown>;
                      const formType = pickString(raw, ["Form Type", "form_type"]);
                      const studentId = pickString(raw, ["Student ID", "StudentID", "student_id"]);
                      const statusRaw = pickString(raw, ["Status", "status"]);
                      const statusLabel = formatStaffAssessmentStatusLabel(statusRaw);
                      const rid = pickAssessmentRowId(raw);
                      return (
                        <tr key={rid || `s-${index}`} className="text-slate-800">
                          <td className="px-4 py-3 font-medium text-slate-900">{formType || "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{studentId || "—"}</td>
                          <td className="px-4 py-3 text-slate-600">{formatRowDate(row)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                statusRaw === ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL
                                  ? "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-200"
                                  : statusRaw === ASSESSMENT_STATUS_COMPLETE_FAIL
                                    ? "inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-900 ring-1 ring-inset ring-rose-200"
                                    : "text-slate-700"
                              }
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {rid ? (
                              <Link
                                href={`/staff/assessments/${encodeURIComponent(rid)}`}
                                className="font-medium text-sky-700 underline hover:text-sky-900"
                              >
                                {t(language, "Open", "เปิด")}
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-400">{t(language, "No row id", "ไม่มีรหัสรายการ")}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <CreateAssessmentDashboardFoot role="staff" />
            </>
          ) : null}
        </section>

        {mainTab === "logbook" ? <DopsLogbookPanel role="Staff" /> : null}
      </main>
    </div>
  );
}
