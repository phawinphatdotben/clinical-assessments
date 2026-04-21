"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type RoleMode = "Admin" | "Staff" | "Student";

type SkillRow = {
  skill: string;
  group: string | null;
  amount_required: number | null;
  enlisted_in_manual_skill: string | null;
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

const isCompletedStatus = (rawStatus: string): boolean => {
  const normalized = rawStatus.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized.includes("pending")) {
    return false;
  }
  if (normalized === "fail") {
    return false;
  }
  return true;
};

export function DopsLogbookPanel({ role, studentId = "" }: DopsLogbookPanelProps) {
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
    group: string;
    amount_required: string;
    enlisted_in_manual_skill: string;
  }>({ skill: "", group: "", amount_required: "", enlisted_in_manual_skill: "" });
  const [newSkill, setNewSkill] = useState({
    skill: "",
    group: "",
    amount_required: "",
    enlisted_in_manual_skill: "",
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
    return {
      skill,
      group: group || null,
      amount_required: Number.isFinite(required as number) ? (required as number) : null,
      enlisted_in_manual_skill: manual || null,
      completed:
        typeof raw.completed === "number"
          ? raw.completed
          : typeof raw.completed === "string" && raw.completed.trim()
            ? Number(raw.completed)
            : null,
    };
  };

  const loadSkills = async () => {
    setLoadingSkills(true);
    setLoadError(null);
    if (isStudentView) {
      const { data, error } = await supabase
        .from("student_dops_logbook_progress")
        .select("skill, group, amount_required, enlisted_in_manual_skill, completed")
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
      .select("skill, group, amount_required, enlisted_in_manual_skill")
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
  };

  useEffect(() => {
    void loadSkills();
  }, [isStudentView, studentId]);

  const filteredSkills = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return skills;
    }
    return skills.filter((row) => {
      const skill = pickString(row.skill).toLowerCase();
      const group = pickString(row.group).toLowerCase();
      const enlisted = pickString(row.enlisted_in_manual_skill).toLowerCase();
      return skill.includes(q) || group.includes(q) || enlisted.includes(q);
    });
  }, [skills, search]);

  const startEdit = (row: SkillRow) => {
    setSavingError(null);
    setSavingMessage(null);
    setEditingSkill(row.skill);
    setEditDraft({
      skill: row.skill,
      group: row.group ?? "",
      amount_required:
        row.amount_required == null || Number.isNaN(row.amount_required)
          ? ""
          : String(row.amount_required),
      enlisted_in_manual_skill: row.enlisted_in_manual_skill ?? "",
    });
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
        group: editDraft.group.trim() || null,
        amount_required: requiredNumber,
        enlisted_in_manual_skill: editDraft.enlisted_in_manual_skill.trim() || null,
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
        group: newSkill.group.trim() || null,
        amount_required: requiredNumber,
        enlisted_in_manual_skill: newSkill.enlisted_in_manual_skill.trim() || null,
      },
    ]);

    if (error) {
      setSavingError(error.message);
      return;
    }

    setSavingMessage("New skill added.");
    setNewSkill({
      skill: "",
      group: "",
      amount_required: "",
      enlisted_in_manual_skill: "",
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
              ? "Track your completed procedures against required counts."
              : "Reference of DOPS skills from Supabase."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSkills()}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Search skills</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by skill, group, or manual tag..."
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
          <p className="text-sm font-medium text-slate-900">Add new skill</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="text"
              value={newSkill.skill}
              onChange={(event) => setNewSkill((prev) => ({ ...prev, skill: event.target.value }))}
              placeholder="Skill name"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 md:col-span-2"
            />
            <input
              type="text"
              value={newSkill.group}
              onChange={(event) => setNewSkill((prev) => ({ ...prev, group: event.target.value }))}
              placeholder="Group"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
            <input
              type="text"
              inputMode="numeric"
              value={newSkill.amount_required}
              onChange={(event) => setNewSkill((prev) => ({ ...prev, amount_required: event.target.value }))}
              placeholder="Amount required"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={newSkill.enlisted_in_manual_skill}
              onChange={(event) =>
                setNewSkill((prev) => ({ ...prev, enlisted_in_manual_skill: event.target.value }))
              }
              placeholder="Enlisted in manual skill (e.g. Yes)"
              className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Add skill
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-3">Skill</th>
              <th className="px-3 py-3">Group</th>
              <th className="px-3 py-3">Required</th>
              {isStudentView ? <th className="px-3 py-3">Completed</th> : null}
              {isStudentView ? <th className="px-3 py-3">Progress</th> : null}
              <th className="px-3 py-3">Manual</th>
              {canEdit ? <th className="px-3 py-3">Action</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loadingSkills ? (
              <tr>
                <td
                  className="px-3 py-3 text-slate-500"
                  colSpan={canEdit ? (isStudentView ? 7 : 5) : isStudentView ? 6 : 4}
                >
                  Loading skills...
                </td>
              </tr>
            ) : filteredSkills.length === 0 ? (
              <tr>
                <td
                  className="px-3 py-3 text-slate-500"
                  colSpan={canEdit ? (isStudentView ? 7 : 5) : isStudentView ? 6 : 4}
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
                    key={`${row.skill}-${row.group ?? ""}-${row.enlisted_in_manual_skill ?? ""}-${index}`}
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
