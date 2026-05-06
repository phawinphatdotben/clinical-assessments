"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CLINICAL_DEPARTMENT_ROTATIONS } from "../lib/department-rotations";
import { useSessionDepartmentRotation } from "../lib/use-session-department-rotation";
import { supabase } from "../lib/supabase";
import { t, useUiLanguage } from "../lib/ui-language";

type RoleMode = "Admin" | "Staff" | "Student";

type SkillRow = {
  skill: string;
  department: string | null;
  group: string | null;
  amount_required: number | null;
  enlisted_in_manual_skill: string | null;
  rubric_pdf_url: string | null;
  completed?: number | null;
};

type DopsLogbookPanelProps = {
  role: RoleMode;
  studentId?: string;
};

const pickString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
};


export function DopsLogbookPanel({ role, studentId = "" }: DopsLogbookPanelProps) {
  const { language } = useUiLanguage();
  const [sessionDepartmentRotation, setSessionDepartmentRotation] = useSessionDepartmentRotation();
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [skillsTableName, setSkillsTableName] = useState<"skills" | "Skills">("skills");
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingError, setSavingError] = useState<string | null>(null);
  const [savingMessage, setSavingMessage] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    skill: string;
    department: string;
    group: string;
    amount_required: string;
    enlisted_in_manual_skill: string;
    rubric_pdf_url: string;
  }>({
    skill: "",
    department: "",
    group: "",
    amount_required: "",
    enlisted_in_manual_skill: "",
    rubric_pdf_url: "",
  });
  const [newSkill, setNewSkill] = useState({
    skill: "",
    department: "",
    group: "",
    amount_required: "",
    enlisted_in_manual_skill: "",
    rubric_pdf_url: "",
  });
  const canEdit = role === "Admin";
  const isStudentView = role === "Student";

  const normalizeSkillRow = (raw: Record<string, unknown>): SkillRow => {
    const skill = pickString(raw.skill ?? raw.Skill);
    const group = pickString(raw.group ?? raw.Group);
    const manual = pickString(
      raw.enlisted_in_manual_skill ?? raw["enlisted in manual skill"] ?? raw.EnlistedInManualSkill
    );
    const requiredRaw = raw.amount_required ?? raw.AmountRequired ?? raw["amount required"];
    const required =
      typeof requiredRaw === "number"
        ? requiredRaw
        : typeof requiredRaw === "string" && requiredRaw.trim()
          ? Number(requiredRaw)
          : null;
    const departmentRaw = raw.department ?? raw.Department ?? raw["Department/Rotation"];
    const department = pickString(departmentRaw);
    const rubricPdfRaw = raw.rubric_pdf_url ?? raw.rubric_pdf;
    const rubric_pdf_url =
      typeof rubricPdfRaw === "string" && rubricPdfRaw.trim() ? rubricPdfRaw.trim() : null;

    return {
      skill,
      department: department || null,
      group: group || null,
      amount_required: Number.isFinite(required as number) ? (required as number) : null,
      enlisted_in_manual_skill: manual || null,
      rubric_pdf_url,
      completed:
        typeof raw.completed === "number"
          ? raw.completed
          : typeof raw.completed === "string" && raw.completed.trim()
            ? Number(raw.completed)
            : null,
    };
  };

  const loadSkills = useCallback(async () => {
    setLoadingSkills(true);
    setLoadError(null);
    if (isStudentView) {
      const { data, error } = await supabase
        .from("student_dops_logbook_progress")
        .select(
          "skill, department, group, amount_required, enlisted_in_manual_skill, completed, rubric_pdf_url",
        )
        .order("skill", { ascending: true });
      if (error) {
        setLoadError(error.message);
        setSkills([]);
        setLoadingSkills(false);
        return;
      }
      const normalized = ((data as Record<string, unknown>[] | null) ?? [])
        .map((row) => normalizeSkillRow(row))
        .filter((row) => Boolean(row.skill));
      setSkills(normalized);
      setLoadingSkills(false);
      return;
    }
      const { data: viewData, error: viewError } = await supabase
      .from("dops_skills_catalog")
      .select("skill, department, group, amount_required, enlisted_in_manual_skill, rubric_pdf_url")
      .order("skill", { ascending: true });
    if (!viewError) {
      const normalized = ((viewData as Record<string, unknown>[] | null) ?? [])
        .map((row) => normalizeSkillRow(row))
        .filter((row) => Boolean(row.skill));
      setSkills(normalized);
      setLoadingSkills(false);
      return;
    }
    const tables: Array<"skills" | "Skills"> = ["skills", "Skills"];
    for (const tableName of tables) {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) {
        continue;
      }
      const normalized = ((data as Record<string, unknown>[] | null) ?? [])
        .map((row) => normalizeSkillRow(row))
        .filter((row) => Boolean(row.skill))
        .sort((a, b) => a.skill.localeCompare(b.skill));
      setSkillsTableName(tableName);
      setSkills(normalized);
      setLoadingSkills(false);
      return;
    }
    setLoadError("Could not read skills table. Check RLS and table/column names.");
    setSkills([]);
    setLoadingSkills(false);
  }, [isStudentView]);

  useEffect(() => {
    queueMicrotask(() => void loadSkills());
  }, [isStudentView, studentId, loadSkills]);

  const filteredSkills = useMemo(() => {
    const dept = sessionDepartmentRotation.trim();
    const rotationFiltered =
      dept.length === 0
        ? skills
        : skills.filter((row) => !row.department || row.department === dept);
    const q = search.trim().toLowerCase();
    if (!q) {
      return rotationFiltered;
    }
    return rotationFiltered.filter((row) => {
      const skill = pickString(row.skill).toLowerCase();
      const group = pickString(row.group).toLowerCase();
      const enlisted = pickString(row.enlisted_in_manual_skill).toLowerCase();
      return skill.includes(q) || group.includes(q) || enlisted.includes(q);
    });
  }, [skills, search, sessionDepartmentRotation]);

  const startEdit = (row: SkillRow) => {
    setSavingError(null);
    setSavingMessage(null);
    setEditingSkill(row.skill);
    setEditDraft({
      skill: row.skill,
      department: row.department ?? "",
      group: row.group ?? "",
      amount_required:
        row.amount_required == null || Number.isNaN(row.amount_required)
          ? ""
          : String(row.amount_required),
      enlisted_in_manual_skill: row.enlisted_in_manual_skill ?? "",
      rubric_pdf_url: row.rubric_pdf_url ?? "",
    });
  };

  const uploadRubricPdfForSkill = async (skillName: string, file: File | undefined) => {
    if (!file) {
      return;
    }
    if (file.type !== "application/pdf") {
      setSavingError("Please choose a PDF file.");
      return;
    }
    setSavingError(null);
    setSavingMessage(null);
    const safeBase = skillName.replace(/[^\w\d-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 72) || "rubric";
    const objectPath = `${safeBase}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage.from("dops-rubric-pdfs").upload(objectPath, file, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (uploadError) {
      setSavingError(uploadError.message);
      return;
    }

    const { data: pub } = supabase.storage.from("dops-rubric-pdfs").getPublicUrl(objectPath);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) {
      setSavingError("Upload succeeded but public URL could not be resolved.");
      return;
    }

    const { error: updError } = await supabase
      .from(skillsTableName)
      .update({ rubric_pdf_url: publicUrl })
      .eq("skill", skillName);

    if (updError) {
      setSavingError(updError.message);
      return;
    }

    setSavingMessage(t(language, "Rubric PDF uploaded and linked.", "อัปโหลด PDF เกณฑ์ประเมินและเชื่อมโยงแล้ว"));
    await loadSkills();
  };

  const saveEdit = async () => {
    if (!editingSkill) {
      return;
    }
    const trimmedSkill = editDraft.skill.trim();
    if (!trimmedSkill) {
      setSavingError("Skill name is required.");
      return;
    }

    const requiredRaw = editDraft.amount_required.trim();
    const requiredNumber = requiredRaw ? Number(requiredRaw) : null;
    if (requiredRaw && !Number.isFinite(requiredNumber)) {
      setSavingError("Amount required must be a valid number.");
      return;
    }

    setSavingError(null);
    setSavingMessage(null);
    const { error } = await supabase
      .from(skillsTableName)
      .update({
        skill: trimmedSkill,
        department: editDraft.department.trim() || null,
        group: editDraft.group.trim() || null,
        amount_required: requiredNumber,
        enlisted_in_manual_skill: editDraft.enlisted_in_manual_skill.trim() || null,
        rubric_pdf_url: editDraft.rubric_pdf_url.trim() || null,
      })
      .eq("skill", editingSkill);

    if (error) {
      setSavingError(error.message);
      return;
    }

    setSavingMessage("Skill updated.");
    setEditingSkill(null);
    await loadSkills();
  };

  const handleAddSkill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const skillName = newSkill.skill.trim();
    const requiredRaw = newSkill.amount_required.trim();
    const requiredNumber = requiredRaw ? Number(requiredRaw) : null;
    if (!skillName) {
      setSavingError("Skill name is required.");
      return;
    }
    if (requiredRaw && !Number.isFinite(requiredNumber)) {
      setSavingError("Amount required must be a valid number.");
      return;
    }

    setSavingError(null);
    setSavingMessage(null);
    const { error } = await supabase.from(skillsTableName).insert([
      {
        skill: skillName,
        department: newSkill.department.trim() || null,
        group: newSkill.group.trim() || null,
        amount_required: requiredNumber,
        enlisted_in_manual_skill: newSkill.enlisted_in_manual_skill.trim() || null,
        rubric_pdf_url: newSkill.rubric_pdf_url.trim() || null,
      },
    ]);

    if (error) {
      setSavingError(error.message);
      return;
    }

    setSavingMessage("New skill added.");
    setNewSkill({
      skill: "",
      department: "",
      group: "",
      amount_required: "",
      enlisted_in_manual_skill: "",
      rubric_pdf_url: "",
    });
    await loadSkills();
  };

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">DOPS Logbook</h2>
          <p className="mt-1 text-sm text-slate-600">
            {isStudentView
              ? t(language, "Track your completed procedures against required counts.", "ติดตามจำนวนหัตถการที่ทำเสร็จเทียบกับจำนวนที่กำหนด")
              : t(language, "Reference of DOPS skills from Supabase.", "รายการทักษะ DOPS อ้างอิงจาก Supabase")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSkills()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          {t(language, "Refresh", "รีเฟรช")}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t(language, "Rotation filter", "ตัวกรองโรเตชัน")}</span>
          <select
            value={sessionDepartmentRotation}
            onChange={(event) => setSessionDepartmentRotation(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option value="">{t(language, "All rotations", "ทุกโรเตชัน")}</option>
            {CLINICAL_DEPARTMENT_ROTATIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Matches the dashboard / form session rotation. Rows with blank department apply to every rotation.
          </p>
        </label>
        <label className="block md:col-span-1">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t(language, "Search skills", "ค้นหาทักษะ")}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t(language, "Search by skill, group, or manual tag...", "ค้นหาจากชื่อทักษะ กลุ่ม หรือแท็กคู่มือ...")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </label>
      </div>

      {savingError ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {savingError}
        </p>
      ) : null}
      {savingMessage ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {savingMessage}
        </p>
      ) : null}
      {loadError ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {loadError}
        </p>
      ) : null}

      {canEdit ? (
        <form onSubmit={handleAddSkill} className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">{t(language, "Add new skill", "เพิ่มทักษะใหม่")}</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              type="text"
              value={newSkill.skill}
              onChange={(event) => setNewSkill((prev) => ({ ...prev, skill: event.target.value }))}
              placeholder={t(language, "Skill name", "ชื่อทักษะ")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 md:col-span-2"
            />
            <select
              value={newSkill.department}
              onChange={(event) => setNewSkill((prev) => ({ ...prev, department: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="">{t(language, "All rotations", "ทุกโรเตชัน")}</option>
              {CLINICAL_DEPARTMENT_ROTATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newSkill.group}
              onChange={(event) => setNewSkill((prev) => ({ ...prev, group: event.target.value }))}
              placeholder={t(language, "Group", "กลุ่ม")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
            <input
              type="text"
              inputMode="numeric"
              value={newSkill.amount_required}
              onChange={(event) => setNewSkill((prev) => ({ ...prev, amount_required: event.target.value }))}
              placeholder={t(language, "Amount required", "จำนวนที่ต้องทำ")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-1">
            <input
              type="url"
              value={newSkill.rubric_pdf_url}
              onChange={(event) => setNewSkill((prev) => ({ ...prev, rubric_pdf_url: event.target.value }))}
              placeholder={t(
                language,
                "Optional rubric PDF URL",
                "URL เกณฑ์ประเมิน PDF (ถ้ามี)",
              )}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={newSkill.enlisted_in_manual_skill}
              onChange={(event) =>
                setNewSkill((prev) => ({ ...prev, enlisted_in_manual_skill: event.target.value }))
              }
              placeholder={t(language, "Enlisted in manual skill (e.g. Yes)", "ระบุในคู่มือทักษะ (เช่น Yes)")}
              className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              {t(language, "Add skill", "เพิ่มทักษะ")}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-3">Skill</th>
              <th className="px-3 py-3">Rotation</th>
              <th className="px-3 py-3">Group</th>
              <th className="px-3 py-3">Required</th>
              {isStudentView ? <th className="px-3 py-3">Completed</th> : null}
              {isStudentView ? <th className="px-3 py-3">Progress</th> : null}
              <th className="px-3 py-3 min-w-[11rem]">
                {t(language, "Rubric PDF", "เกณฑ์ PDF")}
              </th>
              <th className="px-3 py-3">Manual</th>
              {canEdit ? <th className="px-3 py-3">Action</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loadingSkills ? (
              <tr>
                <td
                  className="px-3 py-3 text-slate-500"
                  colSpan={canEdit ? (isStudentView ? 9 : 7) : isStudentView ? 8 : 6}
                >
                  Loading skills...
                </td>
              </tr>
            ) : filteredSkills.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-3 text-slate-500"
                  colSpan={canEdit ? (isStudentView ? 9 : 7) : isStudentView ? 8 : 6}
                >
                  No skills match your search.
                </td>
              </tr>
            ) : (
              filteredSkills.map((row, index) => {
                const isEditing = editingSkill === row.skill;
                const completed = isStudentView ? row.completed ?? 0 : 0;
                const required = row.amount_required ?? 0;
                const isDone = required > 0 && completed >= required;
                return (
                  <tr
                    key={`${row.skill}-${row.department ?? ""}-${row.group ?? ""}-${row.enlisted_in_manual_skill ?? ""}-${index}`}
                    className="text-slate-800"
                  >
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.skill}
                          onChange={(event) => setEditDraft((prev) => ({ ...prev, skill: event.target.value }))}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="font-medium">{row.skill}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <select
                          value={editDraft.department}
                          onChange={(event) =>
                            setEditDraft((prev) => ({ ...prev, department: event.target.value }))
                          }
                          className="w-full min-w-[8rem] rounded border border-slate-300 px-2 py-1 text-sm"
                        >
                          <option value="">All rotations</option>
                          {CLINICAL_DEPARTMENT_ROTATIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      ) : row.department ? (
                        row.department
                      ) : (
                        <span className="text-slate-400">All</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.group}
                          onChange={(event) => setEditDraft((prev) => ({ ...prev, group: event.target.value }))}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      ) : (
                        row.group || "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editDraft.amount_required}
                          onChange={(event) =>
                            setEditDraft((prev) => ({ ...prev, amount_required: event.target.value }))
                          }
                          className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      ) : (
                        row.amount_required ?? "—"
                      )}
                    </td>
                    {isStudentView ? (
                      <td className="px-3 py-2 tabular-nums">
                        {completed}
                      </td>
                    ) : null}
                    {isStudentView ? (
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isDone
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {required > 0 ? `${completed}/${required}` : `${completed}`}
                        </span>
                      </td>
                    ) : null}
                    <td className="px-3 py-2 align-top">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="url"
                            value={editDraft.rubric_pdf_url}
                            onChange={(event) =>
                              setEditDraft((prev) => ({ ...prev, rubric_pdf_url: event.target.value }))
                            }
                            placeholder="https://..."
                            className="w-full min-w-[10rem] rounded border border-slate-300 px-2 py-1 text-xs"
                          />
                          <label className="block text-[11px] text-slate-600">
                            {t(language, "Upload PDF", "อัปโหลด PDF")}
                            <input
                              type="file"
                              accept="application/pdf"
                              className="mt-1 block max-w-[14rem] text-xs text-slate-700"
                              onChange={(event) =>
                                void uploadRubricPdfForSkill(
                                  (editingSkill ?? editDraft.skill).trim(),
                                  event.target.files?.[0],
                                )
                              }
                            />
                          </label>
                        </div>
                      ) : row.rubric_pdf_url ? (
                        <a
                          href={row.rubric_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-700 underline underline-offset-2 hover:text-sky-900"
                        >
                          {t(language, "Open PDF", "เปิด PDF")}
                        </a>
                      ) : canEdit ? (
                        <label className="flex cursor-pointer flex-col gap-1 text-[11px] text-slate-600">
                          {t(language, "Upload PDF", "อัปโหลด PDF")}
                          <input
                            type="file"
                            accept="application/pdf"
                            className="max-w-[14rem] text-xs text-slate-700"
                            onChange={(event) =>
                              void uploadRubricPdfForSkill(row.skill, event.target.files?.[0])
                            }
                          />
                        </label>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.enlisted_in_manual_skill}
                          onChange={(event) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              enlisted_in_manual_skill: event.target.value,
                            }))
                          }
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                        />
                      ) : (
                        row.enlisted_in_manual_skill || "—"
                      )}
                    </td>
                    {canEdit ? (
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void saveEdit()}
                              className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSkill(null)}
                              className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(row)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
