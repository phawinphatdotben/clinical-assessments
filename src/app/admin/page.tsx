"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminStudentScoresExport } from "../components/admin-student-scores-export";
import { AssessmentSearchBar } from "../components/assessment-search-bar";
import { CreateAssessmentDashboardFoot } from "../components/create-assessment-links";
import { DashboardRoleTabs, type DashboardMainTab } from "../components/dashboard-role-tabs";
import { DepartmentPortfolioChart } from "../components/department-portfolio-chart";
import { DopsLogbookPanel } from "../components/dops-logbook-panel";
import { DashboardNav } from "../components/dashboard-nav";
import {
  aggregateCompletedWpbaByDepartment,
  emptyUserDirectoryLookup,
  fetchAllAssessmentsForAdmin,
  fetchApprovedUsersDirectory,
  filterAssessmentsByPersonSearch,
  type UserDirectoryLookup,
} from "../lib/assessment-filters";
import { getDashboardPathForRole, getUserAccessLookupResultByEmail } from "../lib/auth";
import { pickStoredOrComputedScoreSum } from "../lib/assessment-score-summation";
import { pickAssessmentRowId } from "../lib/student-feedback";
import { supabase } from "../lib/supabase";
import { t, useUiLanguage } from "../lib/ui-language";

type PendingAccount = {
  Email: string;
  Name: string | null;
  Role: string | null;
  Status: string | null;
  "Is Approved": boolean | null;
};

type AssessmentRow = Record<string, unknown>;

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { language } = useUiLanguage();
  const PAGE_SIZE = 20;
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [listError, setListError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mainTab, setMainTab] = useState<DashboardMainTab>("dashboard");
  const [personSearch, setPersonSearch] = useState("");
  const [portfolioPersonSearch, setPortfolioPersonSearch] = useState("");
  const [assessmentRows, setAssessmentRows] = useState<AssessmentRow[]>([]);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [assessmentPage, setAssessmentPage] = useState(1);
  const [userLookup, setUserLookup] = useState<UserDirectoryLookup | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  const loadPendingAccounts = async () => {
    setIsRefreshing(true);
    setListError("");

    const { data, error } = await supabase
      .from("Users")
      .select('Email, Name, Role, Status, "Is Approved"')
      .eq("Status", "Pending Approval");

    if (error) {
      setListError(error.message);
      setIsRefreshing(false);
      return;
    }

    setPendingAccounts((data as PendingAccount[] | null) ?? []);
    setIsRefreshing(false);
  };

  const approveAccount = async (accountEmail: string) => {
    const { error } = await supabase
      .from("Users")
      .update({ "Is Approved": true, Status: "Approved" })
      .eq("Email", accountEmail);

    if (error) {
      setListError(error.message);
      return;
    }

    await loadPendingAccounts();
  };

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

      if (access.role !== "Admin") {
        router.replace(getDashboardPathForRole(access.role));
        return;
      }

      setEmail(user.email);
      await loadPendingAccounts();
      setIsLoading(false);
    };

    void validateAccess();
  }, [router]);

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

  useEffect(() => {
    if (isLoading) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      setAssessmentLoading(true);
      setAssessmentError(null);
      const { rows, errorMessage } = await fetchAllAssessmentsForAdmin();
      if (cancelled) {
        return;
      }
      if (errorMessage) {
        setAssessmentError(errorMessage);
        setAssessmentRows([]);
      } else {
        setAssessmentRows(rows);
      }
      setAssessmentLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [isLoading]);

  const lookupForFilter = useMemo(() => userLookup ?? emptyUserDirectoryLookup(), [userLookup]);

  const filteredAssessments = useMemo(
    () =>
      filterAssessmentsByPersonSearch(
        assessmentRows,
        personSearch,
        lookupForFilter
      ) as AssessmentRow[],
    [assessmentRows, personSearch, lookupForFilter]
  );
  const assessmentTotalPages = Math.max(1, Math.ceil(filteredAssessments.length / PAGE_SIZE));
  const assessmentPageSafe = Math.min(assessmentPage, assessmentTotalPages);
  const pagedAssessments = useMemo(() => {
    const start = (assessmentPageSafe - 1) * PAGE_SIZE;
    return filteredAssessments.slice(start, start + PAGE_SIZE);
  }, [filteredAssessments, assessmentPageSafe, PAGE_SIZE]);

  useEffect(() => {
    queueMicrotask(() => setAssessmentPage(1));
  }, [personSearch]);

  useEffect(() => {
    if (assessmentPage > assessmentTotalPages) {
      queueMicrotask(() => setAssessmentPage(assessmentTotalPages));
    }
  }, [assessmentPage, assessmentTotalPages]);

  const portfolioFilteredRows = useMemo(
    () =>
      filterAssessmentsByPersonSearch(
        assessmentRows,
        portfolioPersonSearch,
        lookupForFilter
      ) as AssessmentRow[],
    [assessmentRows, portfolioPersonSearch, lookupForFilter]
  );

  const portfolioByDepartment = useMemo(
    () => aggregateCompletedWpbaByDepartment(portfolioFilteredRows),
    [portfolioFilteredRows]
  );

  const portfolioChartEmptyMessage = useMemo(() => {
    if (assessmentRows.length === 0) {
      return t(language, "No assessments in the database.", "ไม่มีแบบประเมินในฐานข้อมูล");
    }
    if (portfolioFilteredRows.length === 0 && portfolioPersonSearch.trim()) {
      return t(language, "No assessments match your search.", "ไม่พบแบบประเมินที่ตรงกับการค้นหา");
    }
    return t(language, "No completed assessments to chart for this filter yet.", "ยังไม่มีแบบประเมินที่เสร็จสมบูรณ์สำหรับตัวกรองนี้");
  }, [assessmentRows.length, portfolioFilteredRows.length, portfolioPersonSearch, language]);

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
          <h1 className="text-2xl font-semibold text-slate-900">{t(language, "Admin Dashboard", "แดชบอร์ดผู้ดูแลระบบ")}</h1>
          <p className="mt-2 text-sm text-slate-600">
            {t(language, "Welcome. You are signed in as an Admin user.", "ยินดีต้อนรับ คุณเข้าสู่ระบบในบทบาทผู้ดูแลระบบ")}
          </p>

          <div className="mt-6">
            <DashboardRoleTabs active={mainTab} onChange={setMainTab} />
          </div>

          {mainTab === "portfolio" ? (
            <div className="mt-6">
              {directoryError ? (
                <p className="mb-2 text-xs text-amber-800" role="status">
                  Directory lookup: {directoryError} — portfolio search may be limited to IDs/emails on each row.
                </p>
              ) : null}
              <AssessmentSearchBar
                value={portfolioPersonSearch}
                onChange={setPortfolioPersonSearch}
                id="admin-portfolio-person-search"
                label="Filter portfolio by person"
                placeholder="Student or staff name, Student ID, Staff ID, or email"
                helperText="Narrows the chart to that person's assessments. Leave empty to include everyone. Completed items are counted by department (rotation)."
              />
              <DepartmentPortfolioChart
                data={portfolioByDepartment}
                emptyMessage={portfolioChartEmptyMessage}
              />
              {assessmentError ? (
                <p className="mt-3 text-sm text-rose-700">
                  Could not load assessments for this chart: {assessmentError}. Run{" "}
                  <code className="rounded bg-slate-100 px-1">supabase/rls-admin-assessments.sql</code> if needed.
                </p>
              ) : null}
            </div>
          ) : null}

          {mainTab === "dashboard" ? (
            <>
              {directoryError ? (
                <p className="mt-2 text-xs text-amber-800" role="status">
                  Directory lookup: {directoryError} — search may be limited to IDs/emails on each assessment row.
                </p>
              ) : null}
            </>
          ) : null}
        </section>

        {mainTab === "dashboard" ? (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{t(language, "Pending Account Approvals", "รายการบัญชีรออนุมัติ")}</h2>
              <button
                type="button"
                onClick={() => void loadPendingAccounts()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                {isRefreshing ? t(language, "Refreshing...", "กำลังรีเฟรช...") : t(language, "Refresh", "รีเฟรช")}
              </button>
            </div>

            {listError ? (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {listError}
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              {pendingAccounts.length === 0 ? (
              <p className="text-sm text-slate-600">{t(language, "No pending accounts.", "ไม่มีบัญชีที่รออนุมัติ")}</p>
              ) : (
                pendingAccounts.map((account) => (
                  <div
                    key={account.Email}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{account.Email}</p>
                      <p className="text-xs text-slate-600">
                        {(account.Name || t(language, "No name provided", "ไม่ระบุชื่อ"))} - {t(language, "Requested role", "บทบาทที่ขอ")}: {account.Role || t(language, "Unknown", "ไม่ทราบ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void approveAccount(account.Email)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                      {t(language, "Approve", "อนุมัติ")}
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {mainTab === "dashboard" ? (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{t(language, "All assessments", "แบบประเมินทั้งหมด")}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Filter by person (name, Student ID, Staff ID, or email). Leave the search empty to show the most
              recent activity first.
            </p>
            <div className="mt-3">
              <AssessmentSearchBar
                value={personSearch}
                onChange={setPersonSearch}
                id="admin-assessment-search-table"
                label={t(language, "Search in all assessments", "ค้นหาในแบบประเมินทั้งหมด")}
                placeholder={t(
                  language,
                  "Student/staff name, Student ID, Staff ID, email, or form",
                  "ชื่อนักศึกษา/เจ้าหน้าที่, รหัสนักศึกษา, รหัสอาจารย์/เจ้าหน้าที่, อีเมล หรือชื่อฟอร์ม"
                )}
                helperText={t(
                  language,
                  "The table updates instantly and keeps only 20 rows per page.",
                  "ตารางจะอัปเดตทันที และแสดงครั้งละ 20 รายการต่อหน้า"
                )}
              />
            </div>
            {assessmentError ? (
              <p className="mt-3 text-sm text-rose-700" role="alert">
                {assessmentError}{" "}
                <span className="text-xs text-rose-600">
                  (Ensure the admin policy in <code className="rounded bg-rose-50 px-1">rls-admin-assessments.sql</code>{" "}
                  is applied.)
                </span>
              </p>
            ) : null}
            {assessmentLoading ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "Loading assessments...", "กำลังโหลดแบบประเมิน...")}</p>
            ) : assessmentRows.length === 0 && !assessmentError ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "No assessments in the database.", "ไม่มีแบบประเมินในฐานข้อมูล")}</p>
            ) : filteredAssessments.length === 0 && !assessmentError ? (
              <p className="mt-3 text-sm text-slate-500">{t(language, "No assessments match your search.", "ไม่พบแบบประเมินที่ตรงกับการค้นหา")}</p>
            ) : (
              <>
                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-3">{t(language, "Form", "แบบฟอร์ม")}</th>
                      <th className="px-3 py-3">{t(language, "Student ID", "รหัสนักศึกษา")}</th>
                      <th className="px-3 py-3">{t(language, "Staff ID", "รหัสอาจารย์/เจ้าหน้าที่")}</th>
                      <th className="px-3 py-3">{t(language, "Department", "แผนก")}</th>
                      <th className="px-3 py-3">{t(language, "Status", "สถานะ")}</th>
                      <th className="px-3 py-3">{t(language, "Score sum", "ผลรวมคะแนน")}</th>
                      <th className="px-3 py-3">{t(language, "Date", "วันที่")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pagedAssessments.map((row, index) => {
                      const formType = pickString(row, ["Form Type", "form_type"]);
                      const studentId = pickString(row, ["Student ID", "StudentID", "student_id"]);
                      const staffId = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
                      const dept = pickString(row, ["Department/Rotation", "Department"]);
                      const status = pickString(row, ["Status", "status"]);
                      const rid = pickAssessmentRowId(row);
                      return (
                        <tr key={rid || `adm-${assessmentPageSafe}-${index}`} className="text-slate-800">
                          <td className="px-3 py-2 font-medium">{formType || "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{studentId || "—"}</td>
                          <td className="px-3 py-2 text-slate-600">{staffId || "—"}</td>
                          <td className="max-w-[220px] truncate px-3 py-2 text-slate-600" title={dept}>
                            {dept || "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-700">{status || "—"}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-600 tabular-nums">
                            {pickStoredOrComputedScoreSum(row) || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatRowDate(row)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                {filteredAssessments.length > PAGE_SIZE ? (
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <p className="text-slate-600">
                      {t(language, "Page", "หน้า")} {assessmentPageSafe} / {assessmentTotalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={assessmentPageSafe <= 1}
                        onClick={() => setAssessmentPage((prev) => Math.max(1, prev - 1))}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        {t(language, "Previous", "ก่อนหน้า")}
                      </button>
                      <button
                        type="button"
                        disabled={assessmentPageSafe >= assessmentTotalPages}
                        onClick={() => setAssessmentPage((prev) => Math.min(assessmentTotalPages, prev + 1))}
                        className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                      >
                        {t(language, "Next", "ถัดไป")}
                      </button>
                    </div>
                  </div>
                ) : null}
              </>
            )}
            <AdminStudentScoresExport
              assessmentRows={assessmentRows}
              assessmentLoading={assessmentLoading}
              assessmentError={assessmentError}
            />
            <CreateAssessmentDashboardFoot role="admin" />
          </section>
        ) : null}

        {mainTab === "logbook" ? <DopsLogbookPanel role="Admin" /> : null}
      </main>
    </div>
  );
}
