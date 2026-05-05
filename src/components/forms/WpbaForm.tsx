"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StudentIdBarcodeScanButton } from "../../app/components/student-id-barcode-scan-button";
import { CLINICAL_DEPARTMENT_ROTATIONS, escapePostgrestFilterValue } from "../../app/lib/department-rotations";
import { SESSION_DEPARTMENT_ROTATION_STORAGE_KEY } from "../../app/lib/use-session-department-rotation";
import { supabase } from "../../app/lib/supabase";
import {
  CRITERIA_SCORE_SUM_COLUMN,
  computeCriteriaScoreSumFromFormData,
} from "../../app/lib/assessment-score-summation";
import {
  ASSESSMENT_STATUS_PENDING,
  ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL,
  SELF_REFLECTION_DEADLINE_COLUMN,
  STUDENT_SELF_REFLECTION_COLUMN,
  computeSelfReflectionDeadlineDateString,
  formTypeUsesStudentFeedback,
} from "../../app/lib/student-feedback";
import { t, useUiLanguage } from "../../app/lib/ui-language";
import {
  EXTERN_TIER_LABELS,
  getExternScoreColumnName,
  getExternScoreTiers,
} from "./extern-criteria-scores";
import {
  IM_HEALTH_ED_CRITERION_RUBRIC_THAI,
  IM_HEALTH_ED_FORM_TYPE,
  getImHealthEdScoreColumnName,
  getImHealthEdScoreTiers,
  getImHealthEdTierLabels,
} from "./im-health-ed-criteria";
import {
  CASE_PRESENTATION_FORM_TYPE,
  CASE_PRESENTATION_TIER_LABELS,
  getCasePresentationScoreColumnName,
  getCasePresentationScoreTiers,
} from "./case-presentation-criteria";
import {
  INTERESTING_CASE_FORM_TYPE,
  INTERESTING_CASE_TIER_LABELS,
  getInterestingCaseScoreColumnName,
  getInterestingCaseScoreTiers,
} from "./interesting-case-criteria";
import {
  INTERESTING_CASE_GENERAL_FORM_TYPE,
  INTERESTING_CASE_GENERAL_TIER_LABELS,
  getInterestingCaseGeneralScoreColumnName,
  getInterestingCaseGeneralScoreTiers,
} from "./interesting-case-general-criteria";
import {
  OPD_ASSESSMENT_FORM_TYPE,
  OPD_ASSESSMENT_TIER_LABELS,
  getOpdAssessmentScoreColumnName,
  getOpdAssessmentScoreTiers,
} from "./opd-assessment-criteria";
import {
  ANTICIPATORY_GUIDANCE_FORM_TYPE,
  ANTICIPATORY_GUIDANCE_TIER_LABELS,
  getAnticipatoryGuidanceScoreColumnName,
  getAnticipatoryGuidanceScoreTiers,
} from "./anticipatory-guidance-criteria";
import {
  OR_ASSESSMENT_FORM_TYPE,
  OR_ASSESSMENT_TIER_LABELS,
  getOrAssessmentScoreColumnName,
  getOrAssessmentScoreTiers,
} from "./or-assessment-criteria";
import {
  OBGYN_HEALTH_EDUCATION_FORM_TYPE,
  OBGYN_HEALTH_EDUCATION_MAX_SCORE,
  OBGYN_HEALTH_EDUCATION_PASSING_SCORE,
  OBGYN_HEALTH_EDUCATION_SCORE_LABELS,
  OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN,
  OBGYN_HEALTH_EDUCATION_TOPICS,
  getObgynHealthEducationScoreColumnName,
  getObgynHealthEducationScoreTiers,
  getObgynHealthEducationTopicRubric,
  isObgynHealthEducationWarningSignsKey,
} from "./obgyn-health-education-criteria";
import {
  IPD_CLINICAL_FORM_TYPE,
  IPD_CLINICAL_TIER_LABELS,
  getIpdClinicalScoreColumnName,
  getIpdClinicalScoreTiers,
} from "./ipd-clinical-criteria";
import {
  OPD_CLINICAL_FORM_TYPE,
  OPD_CLINICAL_TIER_LABELS,
  getOpdClinicalScoreColumnName,
  getOpdClinicalScoreTiers,
} from "./opd-clinical-criteria";
import {
  findDopsProcedureRubric,
  getDopsProcedureAliasSuggestions,
  getFormTypeRubric,
  type RubricLink,
} from "./rubric-links";
import {
  JC_CRITERION_RUBRIC_THAI,
  JC_GENERIC_SCALE_RUBRIC_THAI,
  JC_TIER_LABELS,
  getJournalClubScoreColumnName,
  getJournalClubScoreTiers,
} from "./journal-club-criteria";
import {
  MSF_CRITERION_RUBRIC_THAI,
  MSF_GENERIC_SCALE_RUBRIC_THAI,
  MSF_TIER_LABELS_THAI,
  getMsfScoreColumnName,
  getMsfScoreTiers,
} from "./msf-criteria";
import {
  CBD_CRITERION_RUBRIC_THAI,
  CBD_GENERIC_SCALE_RUBRIC_THAI,
  CBD_TIER_LABELS,
  getCbdScoreColumnName,
  getCbdScoreTiers,
} from "./cbd-criteria";
import {
  MINICEX_CRITERION_RUBRIC_THAI,
  MINICEX_GENERIC_SCALE_RUBRIC_THAI,
  MINICEX_TIER_LABELS,
  getMiniCexScoreColumnName,
  getMiniCexScoreTiers,
} from "./minicex-criteria";
import { WpbaFormConfig } from "./wpba-config";
import { maskFormUiLabel } from "./form-ui-labels-th";

const criteriaFeedbackOptions = ["understandard", "standard", "exceptional"] as const;

/** Quick phrases for evaluator feedback text areas (append). */
const evaluatorFeedbackPresets = [
  "Very good",
  "Need more practice",
  "Outstanding",
  "Fail because: ",
] as const;

/** Stored values for DOPS criteria only (button UI). */
const dopsCriteriaFeedbackOptions = [
  { value: "understandard", label: "Under standard" },
  { value: "standard", label: "Standard" },
  { value: "Exceptional", label: "Exceptional" },
  { value: "Cannot be evaluated", label: "Cannot be evaluated" },
] as const;

type WpbaFormProps = {
  createdBy: "Staff" | "Student";
  config: WpbaFormConfig;
};

type SkillDirectoryRow = {
  skill: string;
  group: string | null;
  amount_required: number | null;
};

const normalizeSkillDirectoryRow = (row: Record<string, unknown>): SkillDirectoryRow | null => {
  const skill = pickStringValue(row, ["skill", "Skill"]);
  if (!skill) {
    return null;
  }
  const group = pickStringValue(row, ["group", "Group"]) || null;
  const requiredRaw = row.amount_required ?? row.AmountRequired ?? row["amount required"];
  const required =
    typeof requiredRaw === "number"
      ? requiredRaw
      : typeof requiredRaw === "string" && requiredRaw.trim()
        ? Number(requiredRaw)
        : null;
  return {
    skill,
    group,
    amount_required: Number.isFinite(required as number) ? (required as number) : null,
  };
};

const pickStringValue = (row: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const rawValue = row[key];
    if (typeof rawValue === "string" && rawValue.trim()) {
      return rawValue.trim();
    }
    if (typeof rawValue === "number") {
      return String(rawValue);
    }
  }
  return "";
};

type DirectoryRole = "Staff" | "Student";

/** Resolve Staff vs Student when Role is missing, using which ID columns are populated (common Supabase layout). */
function inferDirectoryRole(row: Record<string, unknown>): DirectoryRole | null {
  const roleRaw = pickStringValue(row, ["Role", "role"]).toLowerCase();
  if (roleRaw === "staff") {
    return "Staff";
  }
  if (roleRaw === "student") {
    return "Student";
  }
  const hasStaffId = Boolean(pickStringValue(row, ["Staff ID", "StaffID", "User", "user"]));
  const hasStudentId = Boolean(pickStringValue(row, ["Student ID", "StudentID", "student_id"]));
  if (hasStaffId && !hasStudentId) {
    return "Staff";
  }
  if (hasStudentId && !hasStaffId) {
    return "Student";
  }
  return null;
}

function matchesDirectoryRole(row: Record<string, unknown>, expected: DirectoryRole): boolean {
  return inferDirectoryRole(row) === expected;
}

function displayNameFromUserRow(row: Record<string, unknown>): string {
  const name = pickStringValue(row, ["Name", "name", "Full Name", "full_name"]);
  if (name) {
    return name;
  }
  const email = pickStringValue(row, ["Email", "email"]);
  if (email) {
    return email.split("@")[0] ?? email;
  }
  return "(no name)";
}

const FORM_TYPES_WITHOUT_PATIENT_HN = new Set([
  "Multisource Feedback",
  "Journal Conference",
  "Extern Clinical Assessment",
]);

const buildInitialFormState = (config: WpbaFormConfig, createdBy: "Staff" | "Student"): Record<string, string> => {
  const baseState: Record<string, string> = {
    "Student ID": "",
    "Staff ID": "",
    Hospital: "",
    "Department/Rotation": "",
    "Evaluator Role": createdBy === "Staff" ? "Staff" : "",
    "Patient HN": "",
    Setting: "",
    "Case Complexity": "",
    "Overall Performance Result": "",
    "Evaluator Feedback: What went well": "",
    "Evaluator Feedback: Areas to improve": "",
  };

  for (const criteriaKey of config.criteriaKeys) {
    baseState[criteriaKey] = "";
  }

  if (config.overallPerformanceKey) {
    baseState[config.overallPerformanceKey] = "";
  }

  if (config.formType === "Multisource Feedback") {
    baseState["Evaluator Name"] = "";
  }

  if (formTypeUsesStudentFeedback(config.formType)) {
    baseState[STUDENT_SELF_REFLECTION_COLUMN] = "";
  }

  if (config.formType === "DOPS") {
    baseState["Procedure Name"] = "";
  }
  if (config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE) {
    baseState[OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN] = "";
  }

  return baseState;
};

export default function WpbaForm({ createdBy, config }: WpbaFormProps) {
  const { language } = useUiLanguage();
  const initialFormState = useMemo(() => buildInitialFormState(config, createdBy), [config, createdBy]);
  const [formData, setFormData] = useState<Record<string, string>>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyLookupMessage, setCounterpartyLookupMessage] = useState("");
  const [nameSearchQuery, setNameSearchQuery] = useState("");
  const [nameSearchResults, setNameSearchResults] = useState<Record<string, unknown>[]>([]);
  const [nameSearchLoading, setNameSearchLoading] = useState(false);
  const [procedureSearchQuery, setProcedureSearchQuery] = useState("");
  const [procedureSearchResults, setProcedureSearchResults] = useState<SkillDirectoryRow[]>([]);
  const [procedureSearchLoading, setProcedureSearchLoading] = useState(false);
  const [showPreSubmitReview, setShowPreSubmitReview] = useState(false);
  const [previewRubric, setPreviewRubric] = useState<RubricLink | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_DEPARTMENT_ROTATION_STORAGE_KEY);
      const trimmed = stored?.trim() ?? "";
      if (!trimmed) {
        return;
      }
      queueMicrotask(() => {
        setFormData((previous) =>
          previous["Department/Rotation"]?.trim()
            ? previous
            : { ...previous, "Department/Rotation": trimmed },
        );
      });
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const generalFields = useMemo(() => {
    const fields: { key: string; label: string; type: string }[] = [];
    if (!FORM_TYPES_WITHOUT_PATIENT_HN.has(config.formType)) {
      fields.push({ key: "Patient HN", label: "Patient HN", type: "text" });
    }
    return fields;
  }, [config.formType]);

  const selectedDopsRubric = useMemo(() => {
    if (config.formType !== "DOPS") {
      return null;
    }
    return findDopsProcedureRubric(formData["Procedure Name"] ?? "");
  }, [config.formType, formData]);
  const selectedFormRubric = useMemo(() => getFormTypeRubric(config.formType), [config.formType]);
  const selectedObgynTopicRubric = useMemo(() => {
    if (config.formType !== OBGYN_HEALTH_EDUCATION_FORM_TYPE) {
      return null;
    }
    return getObgynHealthEducationTopicRubric(formData[OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN] ?? "");
  }, [config.formType, formData]);
  const dopsAliasSuggestions = useMemo(() => getDopsProcedureAliasSuggestions(), []);
  const criteriaScoreSumPreview = useMemo(
    () => computeCriteriaScoreSumFromFormData(formData, config),
    [formData, config]
  );
  const obgynHealthEducationTotal = useMemo(() => {
    if (config.formType !== OBGYN_HEALTH_EDUCATION_FORM_TYPE) {
      return null;
    }
    let total = 0;
    let counted = 0;
    for (const key of config.criteriaKeys) {
      const raw = formData[key];
      if (!raw?.trim()) {
        continue;
      }
      const n = Number(raw);
      if (!Number.isNaN(n)) {
        total += n;
        counted += 1;
      }
    }
    return counted > 0 ? total : 0;
  }, [config, formData]);
  const obgynAutoPassFromScore =
    obgynHealthEducationTotal != null
      ? obgynHealthEducationTotal >= OBGYN_HEALTH_EDUCATION_PASSING_SCORE
      : null;

  const lookupIdKey = createdBy === "Student" ? "Staff ID" : "Student ID";
  const lookupRole = createdBy === "Student" ? "Staff" : "Student";

  const handleChange = (key: string, value: string) => {
    if (key === "Department/Rotation") {
      try {
        const trimmed = value.trim();
        if (trimmed) {
          sessionStorage.setItem(SESSION_DEPARTMENT_ROTATION_STORAGE_KEY, trimmed);
        } else {
          sessionStorage.removeItem(SESSION_DEPARTMENT_ROTATION_STORAGE_KEY);
        }
      } catch {
        // ignore quota / private mode
      }
    }
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const applyScannedStudentId = useCallback((value: string) => {
    setFormData((previous) => ({
      ...previous,
      "Student ID": value,
    }));
  }, []);

  const appendEvaluatorFeedback = (fieldKey: string, phrase: string) => {
    setFormData((previous) => {
      const cur = (previous[fieldKey] ?? "").trim();
      const next = cur ? `${cur}\n${phrase}` : phrase;
      return { ...previous, [fieldKey]: next };
    });
  };

  /** Legacy rows may still store `understand` from older DOPS UI. */
  const isDopsCriterionSelected = (criteriaKey: string, optionValue: string) => {
    const current = formData[criteriaKey];
    if (current === optionValue) {
      return true;
    }
    if (optionValue === "understandard" && current === "understand") {
      return true;
    }
    return false;
  };

  useEffect(() => {
    const loadCurrentUserDefaults = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        return;
      }

      const { data, error } = await supabase
        .from("Users")
        .select("*")
        .eq("Email", user.email)
        .limit(1);

      if (error || !data || data.length === 0) {
        return;
      }

      const currentUser = data[0] as Record<string, unknown>;
      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const metadataStudentId = String(metadata.student_id ?? "").trim();
      const metadataStaffId = String(metadata.staff_id ?? "").trim();
      const metadataHospital = String(metadata.hospital ?? "").trim();

      const dbStudentId = pickStringValue(currentUser, [
        "Student ID",
        "StudentID",
        "student_id",
      ]);
      const dbStaffId = pickStringValue(currentUser, [
        "Staff ID",
        "StaffID",
        "staff_id",
        "User",
        "user",
      ]);
      const dbHospital = pickStringValue(currentUser, ["Hospital", "hospital"]);

      const currentUserStudentId = dbStudentId || metadataStudentId;
      const currentUserStaffId = dbStaffId || metadataStaffId;
      const currentUserHospital = dbHospital || metadataHospital;

      if (!dbStudentId && metadataStudentId) {
        await supabase.from("Users").update({ "Student ID": metadataStudentId }).eq("Email", user.email);
      }

      if (!dbStaffId && metadataStaffId) {
        await supabase.from("Users").update({ "Staff ID": metadataStaffId }).eq("Email", user.email);
      }

      if (!dbHospital && metadataHospital) {
        await supabase.from("Users").update({ Hospital: metadataHospital }).eq("Email", user.email);
      }

      setFormData((previous) => ({
        ...previous,
        "Student ID": createdBy === "Student" ? currentUserStudentId : previous["Student ID"],
        "Staff ID": createdBy === "Staff" ? currentUserStaffId : previous["Staff ID"],
        Hospital: currentUserHospital || previous.Hospital,
      }));
    };

    void loadCurrentUserDefaults();
  }, [createdBy]);

  useEffect(() => {
    const lookupValue = formData[lookupIdKey]?.trim() ?? "";

    if (!lookupValue) {
      const resetTimer = setTimeout(() => {
        setCounterpartyName("");
        setCounterpartyLookupMessage("");
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(async () => {
      let row: Record<string, unknown> | null = null;

      if (lookupRole === "Staff") {
        const bySpacedStaffId = await supabase
          .from("Users")
          .select("*")
          .eq("Staff ID", lookupValue)
          .limit(1);

        if (bySpacedStaffId.data && bySpacedStaffId.data.length > 0) {
          row = bySpacedStaffId.data[0] as Record<string, unknown>;
        } else {
          const byStaffId = await supabase
            .from("Users")
            .select("*")
            .eq("StaffID", lookupValue)
            .limit(1);

          if (byStaffId.data && byStaffId.data.length > 0) {
            row = byStaffId.data[0] as Record<string, unknown>;
          } else {
            const byUsername = await supabase
              .from("Users")
              .select("*")
              .eq("User", lookupValue)
              .limit(1);

            if (byUsername.data && byUsername.data.length > 0) {
              row = byUsername.data[0] as Record<string, unknown>;
            }
          }
        }
      } else {
        const bySpacedStudentId = await supabase
          .from("Users")
          .select("*")
          .eq("Student ID", lookupValue)
          .limit(1);

        if (bySpacedStudentId.data && bySpacedStudentId.data.length > 0) {
          row = bySpacedStudentId.data[0] as Record<string, unknown>;
        } else {
          const byStudentId = await supabase
            .from("Users")
            .select("*")
            .eq("StudentID", lookupValue)
            .limit(1);

          if (byStudentId.data && byStudentId.data.length > 0) {
            row = byStudentId.data[0] as Record<string, unknown>;
          }
        }
      }

      if (!row) {
        setCounterpartyName("");
        setCounterpartyLookupMessage(`${lookupRole} not found for ID "${lookupValue}".`);
        return;
      }

      const expected: DirectoryRole = lookupRole === "Staff" ? "Staff" : "Student";
      if (!matchesDirectoryRole(row, expected)) {
        setCounterpartyName("");
        setCounterpartyLookupMessage(`ID "${lookupValue}" belongs to a non-${lookupRole} account.`);
        return;
      }

      setCounterpartyName(displayNameFromUserRow(row));
      setCounterpartyLookupMessage("");
    }, 300);

    return () => clearTimeout(timer);
  }, [formData, lookupIdKey, lookupRole]);

  useEffect(() => {
    const q = nameSearchQuery.trim();
    if (q.length < 2) {
      queueMicrotask(() => setNameSearchResults([]));
      return;
    }

    const timer = setTimeout(async () => {
      setNameSearchLoading(true);
      const pattern = `%${q}%`;

      const [emailRes, nameRes, staffIdRes, studentIdRes] = await Promise.all([
        supabase.from("Users").select("*").ilike("Email", pattern).limit(30),
        supabase.from("Users").select("*").ilike("Name", pattern).limit(30),
        supabase.from("Users").select("*").ilike("Staff ID", pattern).limit(30),
        supabase.from("Users").select("*").ilike("Student ID", pattern).limit(30),
      ]);

      setNameSearchLoading(false);

      const directoryResponses = [emailRes, nameRes, staffIdRes, studentIdRes];
      if (directoryResponses.every((res) => res.error)) {
        setNameSearchResults([]);
        return;
      }

      const merged: Record<string, unknown>[] = [];
      const seen = new Set<string>();
      const pushUnique = (rows: Record<string, unknown>[] | null | undefined) => {
        if (!rows) {
          return;
        }
        for (const raw of rows) {
          const row = raw as Record<string, unknown>;
          const key =
            pickStringValue(row, ["Email", "email"]) ||
            `${pickStringValue(row, ["Staff ID", "StaffID"])}-${pickStringValue(row, ["Student ID", "StudentID"])}`;
          if (key && !seen.has(key)) {
            seen.add(key);
            merged.push(row);
          }
        }
      };

      for (const res of directoryResponses) {
        if (!res.error) {
          pushUnique(res.data as Record<string, unknown>[] | null);
        }
      }

      const expected: DirectoryRole = lookupRole === "Staff" ? "Staff" : "Student";
      const filtered = merged.filter((raw) => matchesDirectoryRole(raw as Record<string, unknown>, expected));

      setNameSearchResults(filtered.slice(0, 12));
    }, 380);

    return () => clearTimeout(timer);
  }, [nameSearchQuery, lookupRole]);

  const selectedDepartmentRotation = formData["Department/Rotation"]?.trim() ?? "";

  useEffect(() => {
    if (config.formType !== "DOPS") {
      return;
    }
    const q = procedureSearchQuery.trim();
    if (q.length < 2) {
      queueMicrotask(() => setProcedureSearchResults([]));
      return;
    }
    const timer = setTimeout(async () => {
      setProcedureSearchLoading(true);
      let normalizedRows: SkillDirectoryRow[] = [];
      const dept = selectedDepartmentRotation;
      let catalogQuery = supabase
        .from("dops_skills_catalog")
        .select("skill, group, amount_required")
        .ilike("skill", `%${q}%`);
      if (dept) {
        const escaped = escapePostgrestFilterValue(dept);
        catalogQuery = catalogQuery.or(`department.is.null,department.eq."${escaped}"`);
      }
      const { data: viewData, error: viewError } = await catalogQuery.limit(20);
      if (!viewError) {
        normalizedRows = ((viewData as Record<string, unknown>[] | null) ?? [])
          .map((raw) => normalizeSkillDirectoryRow(raw))
          .filter((row): row is SkillDirectoryRow => Boolean(row))
          .sort((a, b) => a.skill.localeCompare(b.skill));
      } else {
        const tables: Array<"skills" | "Skills"> = ["skills", "Skills"];
        for (const tableName of tables) {
          const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .or(`skill.ilike.%${q}%,Skill.ilike.%${q}%`)
            .limit(20);
          if (error) {
            continue;
          }
          normalizedRows = ((data as Record<string, unknown>[] | null) ?? [])
            .map((raw) => normalizeSkillDirectoryRow(raw))
            .filter((row): row is SkillDirectoryRow => Boolean(row))
            .sort((a, b) => a.skill.localeCompare(b.skill));
          break;
        }
      }

      setProcedureSearchLoading(false);
      setProcedureSearchResults(normalizedRows.slice(0, 20));
    }, 350);

    return () => clearTimeout(timer);
  }, [config.formType, procedureSearchQuery, selectedDepartmentRotation]);

  const applyCounterpartyFromSearch = (row: Record<string, unknown>) => {
    if (lookupRole === "Staff") {
      const id = pickStringValue(row, ["Staff ID", "StaffID", "User", "user"]);
      if (id) {
        handleChange("Staff ID", id);
      }
    } else {
      const id = pickStringValue(row, ["Student ID", "StudentID", "student_id"]);
      if (id) {
        handleChange("Student ID", id);
      }
    }
    setNameSearchQuery("");
    setNameSearchResults([]);
  };

  const applyProcedureFromSearch = (row: SkillDirectoryRow) => {
    handleChange("Procedure Name", row.skill);
    setProcedureSearchQuery(row.skill);
    setProcedureSearchResults([]);
  };

  const validateForSubmit = useCallback((): string | null => {
    if (!formData["Student ID"]?.trim()) {
      return "Student ID is required.";
    }
    if (!formData["Staff ID"]?.trim()) {
      return "Staff ID is required.";
    }
    const evaluatorRole = formData["Evaluator Role"]?.trim() ?? "";
    if (
      config.formType === "Multisource Feedback" &&
      (evaluatorRole === "Intern" || evaluatorRole === "Nurse") &&
      !formData["Evaluator Name"]?.trim()
    ) {
      return "Name of evaluator is required when evaluator role is Intern or Nurse.";
    }
    if (
      createdBy === "Student" &&
      formTypeUsesStudentFeedback(config.formType) &&
      !formData[STUDENT_SELF_REFLECTION_COLUMN]?.trim()
    ) {
      return "Student Self-Reflection is required before you can submit this assessment.";
    }
    if (
      config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE &&
      !formData[OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN]?.trim()
    ) {
      return "Health Education Topic is required for OB/GYNE Health Education.";
    }
    if (config.formType === "DOPS") {
      const procedure = (formData["Procedure Name"] ?? "").trim();
      if (!procedure) {
        return "Procedure Name is required for DOPS.";
      }
      if (!findDopsProcedureRubric(procedure)) {
        return "Please use an exact DOPS procedure name that has a rubric (see suggestions under Procedure Name).";
      }
    }
    return null;
  }, [formData, config, createdBy]);

  const buildAssessmentPayload = useCallback(
    (userEmail: string): Record<string, string> => {
      const evaluatorRole = formData["Evaluator Role"]?.trim() ?? "";
      const criteriaPayload = ((): Record<string, string> => {
        if (config.formType === IM_HEALTH_ED_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getImHealthEdScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === CASE_PRESENTATION_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getCasePresentationScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === INTERESTING_CASE_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getInterestingCaseScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === INTERESTING_CASE_GENERAL_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getInterestingCaseGeneralScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === OPD_ASSESSMENT_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getOpdAssessmentScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === ANTICIPATORY_GUIDANCE_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getAnticipatoryGuidanceScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === OR_ASSESSMENT_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getOrAssessmentScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getObgynHealthEducationScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === OPD_CLINICAL_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getOpdClinicalScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === IPD_CLINICAL_FORM_TYPE) {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getIpdClinicalScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === "Extern Clinical Assessment") {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getExternScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === "Journal Conference") {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getJournalClubScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === "Multisource Feedback") {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getMsfScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === "Case-Based Discussion") {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getCbdScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        if (config.formType === "MiniCEX") {
          const payload: Record<string, string> = {};
          for (const key of config.criteriaKeys) {
            payload[getMiniCexScoreColumnName(key)] = formData[key] ?? "";
          }
          return payload;
        }
        return config.criteriaKeys.reduce<Record<string, string>>((payload, key) => {
          payload[key] = formData[key] ?? "";
          return payload;
        }, {});
      })();

      const assessmentPayload: Record<string, string> = {
        "Student ID": formData["Student ID"],
        "Staff ID": formData["Staff ID"],
        Hospital: formData["Hospital"],
        "Department/Rotation": formData["Department/Rotation"],
        "Evaluator Role": formData["Evaluator Role"],
        "Patient HN": formData["Patient HN"] ?? "",
        Setting: formData["Setting"],
        "Procedure Name": formData["Procedure Name"] ?? "",
        "Case Complexity": formData["Case Complexity"],
        ...criteriaPayload,
        "Overall Performance Result": formData["Overall Performance Result"],
        "Evaluator Feedback: What went well": formData["Evaluator Feedback: What went well"],
        "Evaluator Feedback: Areas to improve": formData["Evaluator Feedback: Areas to improve"],
        "Evaluator Email": userEmail,
        "Form Type": config.formType,
        Status:
          createdBy === "Staff"
            ? formTypeUsesStudentFeedback(config.formType)
              ? ASSESSMENT_STATUS_PENDING
              : "Submitted"
            : ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL,
      };

      if (config.overallPerformanceKey) {
        assessmentPayload[config.overallPerformanceKey] = formData[config.overallPerformanceKey] ?? "";
      }

      if (config.formType === "Multisource Feedback") {
        assessmentPayload["Evaluator Name"] =
          evaluatorRole === "Intern" || evaluatorRole === "Nurse"
            ? (formData["Evaluator Name"] ?? "").trim()
            : "";
      }
      if (config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE) {
        assessmentPayload[OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN] =
          (formData[OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN] ?? "").trim();
      }

      if (formTypeUsesStudentFeedback(config.formType)) {
        assessmentPayload[STUDENT_SELF_REFLECTION_COLUMN] =
          createdBy === "Student" ? (formData[STUDENT_SELF_REFLECTION_COLUMN] ?? "").trim() : "";
      }

      if (createdBy === "Staff" && formTypeUsesStudentFeedback(config.formType)) {
        assessmentPayload[SELF_REFLECTION_DEADLINE_COLUMN] = computeSelfReflectionDeadlineDateString();
      }

      const criteriaScoreSum = computeCriteriaScoreSumFromFormData(formData, config);
      if (criteriaScoreSum != null) {
        assessmentPayload[CRITERIA_SCORE_SUM_COLUMN] = String(criteriaScoreSum);
      }

      return assessmentPayload;
    },
    [formData, config, createdBy]
  );

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    const validationError = validateForSubmit();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    setShowPreSubmitReview(true);
  };

  const handleConfirmSubmit = async () => {
    setErrorMessage("");
    const validationError = validateForSubmit();
    if (validationError) {
      setErrorMessage(validationError);
      setShowPreSubmitReview(false);
      return;
    }
    setIsSubmitting(true);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      setErrorMessage(userError?.message ?? "Unable to find logged-in evaluator.");
      setIsSubmitting(false);
      return;
    }
    const assessmentPayload = buildAssessmentPayload(user.email);
    const { error } = await supabase.from("Assessment").insert([assessmentPayload]);
    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }
    setShowPreSubmitReview(false);
    setIsSubmitting(false);
    router.push(createdBy === "Staff" ? "/staff" : "/student");
  };

  useEffect(() => {
    if (!showPreSubmitReview) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPreSubmitReview(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPreSubmitReview]);

  return (
    <form onSubmit={handleFormSubmit} className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t(language, "General Info", "ข้อมูลทั่วไป")}</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Student ID</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                type="text"
                inputMode={createdBy === "Staff" ? "text" : undefined}
                autoComplete="off"
                value={formData["Student ID"]}
                readOnly={createdBy === "Student"}
                onChange={(event) => handleChange("Student ID", event.target.value)}
                className={`min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 outline-none transition focus:border-slate-500 sm:text-sm ${
                  createdBy === "Student" ? "bg-slate-100" : ""
                }`}
              />
              {createdBy === "Staff" ? <StudentIdBarcodeScanButton onDecoded={applyScannedStudentId} /> : null}
            </div>
            {createdBy === "Staff" ? (
              <p className="mt-1 text-xs text-slate-500">
                Use <strong>Scan code</strong> to read a QR or barcode on the student&apos;s ID card or phone
                (camera permission required).
              </p>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Staff ID</span>
            <input
              type="text"
              value={formData["Staff ID"]}
              readOnly={createdBy === "Staff"}
              onChange={(event) => handleChange("Staff ID", event.target.value)}
              className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 ${
                createdBy === "Staff" ? "bg-slate-100" : ""
              }`}
            />
          </label>

          <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/90 p-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                {createdBy === "Student" ? "Search staff" : "Search student"} (name, email, ID)
              </span>
              <input
                type="search"
                autoComplete="off"
                value={nameSearchQuery}
                onChange={(event) => setNameSearchQuery(event.target.value)}
                placeholder="Type at least 2 characters (name, email, or Staff/Student ID)…"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </label>
            {nameSearchLoading ? (
              <p className="mt-2 text-xs text-slate-500">Searching…</p>
            ) : null}
            {nameSearchQuery.trim().length >= 2 && !nameSearchLoading && nameSearchResults.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No matching {lookupRole.toLowerCase()} found.</p>
            ) : null}
            {nameSearchResults.length > 0 ? (
              <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-1">
                {nameSearchResults.map((raw, index) => {
                  const row = raw as Record<string, unknown>;
                  const displayName = displayNameFromUserRow(row);
                  const resolvedId =
                    lookupRole === "Staff"
                      ? pickStringValue(row, ["Staff ID", "StaffID", "User", "user"])
                      : pickStringValue(row, ["Student ID", "StudentID", "student_id"]);
                  const hosp = pickStringValue(row, ["Hospital", "hospital"]);
                  return (
                    <li key={`${resolvedId || displayName}-${index}`}>
                      <button
                        type="button"
                        onClick={() => applyCounterpartyFromSearch(row)}
                        className="w-full rounded px-2 py-2 text-left text-sm transition hover:bg-slate-100"
                      >
                        <span className="font-medium text-slate-900">{displayName}</span>
                        {pickStringValue(row, ["Email", "email"]) ? (
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {pickStringValue(row, ["Email", "email"])}
                          </span>
                        ) : null}
                        <span className="mt-0.5 block text-xs text-slate-600">
                          {lookupRole} ID: {resolvedId || "—"}
                          {hosp ? ` · ${hosp}` : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              Select a row to fill {lookupRole === "Staff" ? "Staff ID" : "Student ID"}, or type an ID
              manually. Search matches <strong>email</strong>, <strong>name</strong>,{" "}
              <strong>Staff ID</strong>, and <strong>Student ID</strong>. If results are always empty, add a
              Supabase <strong>Row Level Security</strong> policy on <code className="rounded bg-slate-200 px-1">Users</code>{" "}
              so <code className="rounded bg-slate-200 px-1">authenticated</code> can{" "}
              <code className="rounded bg-slate-200 px-1">SELECT</code> directory rows (run the policy SQL in the
              Supabase SQL editor).
            </p>
          </div>

          {counterpartyName ? (
            <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700 md:col-span-2">
              {lookupRole} Name: {counterpartyName}
            </p>
          ) : null}

          {counterpartyLookupMessage ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 md:col-span-2">
              {counterpartyLookupMessage}
            </p>
          ) : null}

          {config.formType === "DOPS" ? (
            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50/90 p-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Procedure Name (from DOPS logbook)
                </span>
                <input
                  type="search"
                  value={procedureSearchQuery || formData["Procedure Name"] || ""}
                  onChange={(event) => {
                    const next = event.target.value;
                    setProcedureSearchQuery(next);
                    handleChange("Procedure Name", next);
                  }}
                  placeholder="Type at least 2 characters to search procedure..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                />
              </label>
              {procedureSearchLoading ? (
                <p className="mt-2 text-xs text-slate-500">Searching procedures...</p>
              ) : null}
              {procedureSearchQuery.trim().length >= 2 &&
              !procedureSearchLoading &&
              procedureSearchResults.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No matching procedure found in skills table. You can still type manually.
                </p>
              ) : null}
              {procedureSearchResults.length > 0 ? (
                <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-1">
                  {procedureSearchResults.map((row, index) => (
                    <li key={`${row.skill}-${row.group ?? ""}-${row.amount_required ?? ""}-${index}`}>
                      <button
                        type="button"
                        onClick={() => applyProcedureFromSearch(row)}
                        className="w-full rounded px-2 py-2 text-left text-sm transition hover:bg-slate-100"
                      >
                        <span className="font-medium text-slate-900">{row.skill}</span>
                        <span className="mt-0.5 block text-xs text-slate-600">
                          Group: {row.group || "—"} · Required: {row.amount_required ?? "—"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {selectedDopsRubric ? (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50/90 px-3 py-2 text-sm text-indigo-900">
                  <p className="font-medium">{selectedDopsRubric.title}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewRubric(selectedDopsRubric)}
                      className="rounded border border-indigo-300 bg-white px-2 py-1 font-medium text-indigo-900 transition hover:bg-indigo-100"
                    >
                      Preview rubric
                    </button>
                    <a
                      href={selectedDopsRubric.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-indigo-700"
                    >
                      Open PDF ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <p className="font-medium">
                    No exact rubric match yet. Select one of these exact names:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dopsAliasSuggestions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          handleChange("Procedure Name", name);
                          setProcedureSearchQuery(name);
                          setProcedureSearchResults([]);
                        }}
                        className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-900 transition hover:bg-amber-100"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
          {config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE ? (
            <div className="md:col-span-2 rounded-lg border border-teal-200 bg-teal-50/90 p-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Health Education Topic
                </span>
                <select
                  value={formData[OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN] ?? ""}
                  onChange={(event) => handleChange(OBGYN_HEALTH_EDUCATION_TOPIC_COLUMN, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                >
                  <option value="">Select topic</option>
                  {OBGYN_HEALTH_EDUCATION_TOPICS.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </label>
              {selectedObgynTopicRubric ? (
                <div className="mt-2 rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs text-teal-900">
                  <p className="font-medium">{selectedObgynTopicRubric.title}</p>
                  <div className="mt-1 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewRubric(selectedObgynTopicRubric)}
                      className="rounded border border-teal-300 bg-teal-50 px-2 py-1 font-medium transition hover:bg-teal-100"
                    >
                      Preview topic rubric
                    </button>
                    <a
                      href={selectedObgynTopicRubric.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-teal-700"
                    >
                      Open topic PDF ↗
                    </a>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {generalFields.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">{field.label}</span>
              <input
                type={field.type}
                value={formData[field.key]}
                onChange={(event) => handleChange(field.key, event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </label>
          ))}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Hospital</span>
            <select
              value={formData["Hospital"]}
              onChange={(event) => handleChange("Hospital", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="">{t(language, "Select hospital", "เลือกโรงพยาบาล")}</option>
              <option value="NPH">NPH</option>
              <option value="CRA">CRA</option>
              <option value="PBH">PBH</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Department/Rotation</span>
            <select
              value={formData["Department/Rotation"]}
              onChange={(event) => handleChange("Department/Rotation", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="">{t(language, "Select department", "เลือกแผนก")}</option>
              {CLINICAL_DEPARTMENT_ROTATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Evaluator Role</span>
            <select
              value={formData["Evaluator Role"]}
              onChange={(event) => handleChange("Evaluator Role", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="">{t(language, "Select evaluator role", "เลือกบทบาทผู้ประเมิน")}</option>
              <option value="Staff">Staff</option>
              <option value="Intern">Intern</option>
              <option value="Nurse">Nurse</option>
            </select>
          </label>

          {config.formType === "Multisource Feedback" &&
          (formData["Evaluator Role"] === "Intern" || formData["Evaluator Role"] === "Nurse") ? (
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Name of evaluator</span>
              <input
                type="text"
                value={formData["Evaluator Name"] ?? ""}
                onChange={(event) => handleChange("Evaluator Name", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                placeholder="ชื่อ-นามสกุลผู้ประเมิน"
                autoComplete="name"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Setting</span>
            <select
              value={formData["Setting"]}
              onChange={(event) => handleChange("Setting", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="">{t(language, "Select setting", "เลือกสถานที่ประเมิน")}</option>
              <option value="IPD">IPD</option>
              <option value="OPD">OPD</option>
              <option value="ER">ER</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Case Complexity</span>
            <select
              value={formData["Case Complexity"]}
              onChange={(event) => handleChange("Case Complexity", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="">{t(language, "Select complexity", "เลือกระดับความซับซ้อน")}</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{config.criteriaSectionTitle}</h2>
        {config.formType === "Journal Conference" ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">เกณฑ์ระดับคะแนนทั่วไป (จากแบบประเมิน)</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {JC_GENERIC_SCALE_RUBRIC_THAI.map((block) => (
                <div key={block.title}>
                  <p className="font-medium text-slate-800">{block.title}</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-slate-600">
                    {block.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {config.formType === "Multisource Feedback" ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">เกณฑ์ระดับคะแนนทั่วไป (MSF)</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {MSF_GENERIC_SCALE_RUBRIC_THAI.map((block) => (
                <div key={block.title}>
                  <p className="font-medium text-slate-800">{block.title}</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-slate-600">
                    {block.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {config.formType === "Case-Based Discussion" ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">เกณฑ์ระดับคะแนนทั่วไป (CbD)</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {CBD_GENERIC_SCALE_RUBRIC_THAI.map((block) => (
                <div key={block.title}>
                  <p className="font-medium text-slate-800">{block.title}</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-slate-600">
                    {block.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {config.formType === "MiniCEX" ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">เกณฑ์ระดับคะแนนทั่วไป (MiniCEX)</p>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {MINICEX_GENERIC_SCALE_RUBRIC_THAI.map((block) => (
                <div key={block.title}>
                  <p className="font-medium text-slate-800">{block.title}</p>
                  <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-slate-600">
                    {block.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {config.formType === IM_HEALTH_ED_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">
              Internal Medicine · Health education evaluation (CHMD 7403)
            </p>
            <p className="mt-2 text-slate-700">
              Section 1: Health education skills (4 items). Section 2: Communication + Professionalism (6-point
              checklist scored by band). Stored scores use tiers 1–4 as on the PDF.
            </p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewRubric(selectedFormRubric)}
                  className="rounded border border-emerald-300 bg-white px-2 py-1 font-medium text-emerald-900 transition hover:bg-emerald-100"
                >
                  Preview rubric
                </button>
                <a
                  href={selectedFormRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-900 underline underline-offset-2 hover:text-emerald-800"
                >
                  Open official rubric PDF ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === CASE_PRESENTATION_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">Case Presentation rubric</p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewRubric(selectedFormRubric)}
                  className="rounded border border-indigo-300 bg-white px-2 py-1 font-medium text-indigo-900 transition hover:bg-indigo-100"
                >
                  Preview rubric
                </button>
                <a
                  href={selectedFormRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-indigo-900 underline underline-offset-2 hover:text-indigo-800"
                >
                  Open rubric PDF ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === INTERESTING_CASE_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">Interesting Case Presentation rubric</p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewRubric(selectedFormRubric)}
                  className="rounded border border-violet-300 bg-white px-2 py-1 font-medium text-violet-900 transition hover:bg-violet-100"
                >
                  Preview rubric
                </button>
                <a
                  href={selectedFormRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-violet-900 underline underline-offset-2 hover:text-violet-800"
                >
                  Open rubric PDF ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === INTERESTING_CASE_GENERAL_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-violet-200 bg-violet-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">Interesting Case Presentation (General) rubric</p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewRubric(selectedFormRubric)}
                  className="rounded border border-violet-300 bg-white px-2 py-1 font-medium text-violet-900 transition hover:bg-violet-100"
                >
                  Preview rubric
                </button>
                <a
                  href={selectedFormRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-violet-900 underline underline-offset-2 hover:text-violet-800"
                >
                  Open rubric PDF ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === OPD_ASSESSMENT_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">OPD Assessment rubric</p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewRubric(selectedFormRubric)}
                  className="rounded border border-cyan-300 bg-white px-2 py-1 font-medium text-cyan-900 transition hover:bg-cyan-100"
                >
                  Preview rubric
                </button>
                <a
                  href={selectedFormRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cyan-900 underline underline-offset-2 hover:text-cyan-800"
                >
                  Open rubric PDF ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === ANTICIPATORY_GUIDANCE_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">Anticipatory Guidance rubric</p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewRubric(selectedFormRubric)}
                  className="rounded border border-teal-300 bg-white px-2 py-1 font-medium text-teal-900 transition hover:bg-teal-100"
                >
                  Preview rubric
                </button>
                <a
                  href={selectedFormRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-teal-900 underline underline-offset-2 hover:text-teal-800"
                >
                  Open rubric PDF ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === OR_ASSESSMENT_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">OR Assessment rubric</p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewRubric(selectedFormRubric)}
                  className="rounded border border-rose-300 bg-white px-2 py-1 font-medium text-rose-900 transition hover:bg-rose-100"
                >
                  Preview rubric
                </button>
                <a
                  href={selectedFormRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-rose-900 underline underline-offset-2 hover:text-rose-800"
                >
                  Open rubric PDF ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">OB/GYNE Health Education template</p>
            <p className="mt-1 text-xs text-slate-700">
              Weighted scoring model (max {OBGYN_HEALTH_EDUCATION_MAX_SCORE}); pass threshold is{" "}
              {OBGYN_HEALTH_EDUCATION_PASSING_SCORE} ({Math.round((OBGYN_HEALTH_EDUCATION_PASSING_SCORE / OBGYN_HEALTH_EDUCATION_MAX_SCORE) * 100)}%).
            </p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewRubric(selectedFormRubric)}
                  className="rounded border border-teal-300 bg-white px-2 py-1 font-medium text-teal-900 transition hover:bg-teal-100"
                >
                  Preview template
                </button>
                <a
                  href={selectedFormRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-teal-900 underline underline-offset-2 hover:text-teal-800"
                >
                  Open template PDF ↗
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === OPD_CLINICAL_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">OPD Clinical Assessment rubric</p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button type="button" onClick={() => setPreviewRubric(selectedFormRubric)} className="rounded border border-cyan-300 bg-white px-2 py-1 font-medium text-cyan-900 transition hover:bg-cyan-100">Preview rubric</button>
                <a href={selectedFormRubric.url} target="_blank" rel="noopener noreferrer" className="font-medium text-cyan-900 underline underline-offset-2 hover:text-cyan-800">Open rubric PDF ↗</a>
              </div>
            ) : null}
          </div>
        ) : null}
        {config.formType === IPD_CLINICAL_FORM_TYPE ? (
          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50/80 p-4 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">IPD Clinical Assessment rubric</p>
            {selectedFormRubric ? (
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                <button type="button" onClick={() => setPreviewRubric(selectedFormRubric)} className="rounded border border-sky-300 bg-white px-2 py-1 font-medium text-sky-900 transition hover:bg-sky-100">Preview rubric</button>
                <a href={selectedFormRubric.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sky-900 underline underline-offset-2 hover:text-sky-800">Open rubric PDF ↗</a>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-1 gap-4">
          {config.criteriaKeys.map((criteriaKey) => (
            <div
              key={criteriaKey}
              className={
                config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE &&
                isObgynHealthEducationWarningSignsKey(criteriaKey)
                  ? "block rounded-lg border-2 border-rose-300 bg-rose-50/70 p-3"
                  : "block"
              }
            >
              <span className="mb-2 block text-sm font-medium text-slate-700">
                {maskFormUiLabel(language, criteriaKey)}
              </span>
              {config.formType === "DOPS" ? (
                <div className="flex flex-wrap gap-2">
                  {dopsCriteriaFeedbackOptions.map(({ value, label }) => {
                    const selected = isDopsCriterionSelected(criteriaKey, value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[7rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === IM_HEALTH_ED_FORM_TYPE ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {getImHealthEdScoreTiers().map((score, index) => {
                      const value = String(score);
                      const selected = formData[criteriaKey] === value;
                      const tierLabels = getImHealthEdTierLabels(criteriaKey);
                      const tierLabel = tierLabels[index] ?? "";
                      return (
                        <button
                          key={`${criteriaKey}-${score}-${index}`}
                          type="button"
                          onClick={() => handleChange(criteriaKey, value)}
                          className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium leading-snug transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                            selected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {tierLabel}
                        </button>
                      );
                    })}
                  </div>
                  {IM_HEALTH_ED_CRITERION_RUBRIC_THAI[criteriaKey] ? (
                    <div className="mt-3 rounded-md border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                      <span className="font-medium text-slate-800">เกณฑ์เนื้อหา: </span>
                      {IM_HEALTH_ED_CRITERION_RUBRIC_THAI[criteriaKey]}
                    </div>
                  ) : null}
                </>
              ) : config.formType === CASE_PRESENTATION_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getCasePresentationScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = CASE_PRESENTATION_TIER_LABELS[index];
                    return (
                      <button
                        key={`${criteriaKey}-${score}-${index}`}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === INTERESTING_CASE_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getInterestingCaseScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = INTERESTING_CASE_TIER_LABELS[index];
                    return (
                      <button
                        key={`${criteriaKey}-${score}-${index}`}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === INTERESTING_CASE_GENERAL_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getInterestingCaseGeneralScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = INTERESTING_CASE_GENERAL_TIER_LABELS[index];
                    return (
                      <button
                        key={`${criteriaKey}-${score}-${index}`}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === OPD_ASSESSMENT_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getOpdAssessmentScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = OPD_ASSESSMENT_TIER_LABELS[index];
                    return (
                      <button
                        key={`${criteriaKey}-${score}-${index}`}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === ANTICIPATORY_GUIDANCE_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getAnticipatoryGuidanceScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = ANTICIPATORY_GUIDANCE_TIER_LABELS[index];
                    return (
                      <button
                        key={`${criteriaKey}-${score}-${index}`}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === OR_ASSESSMENT_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getOrAssessmentScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = OR_ASSESSMENT_TIER_LABELS[index];
                    return (
                      <button
                        key={`${criteriaKey}-${score}-${index}`}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getObgynHealthEducationScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = OBGYN_HEALTH_EDUCATION_SCORE_LABELS[index];
                    return (
                      <button
                        key={`${criteriaKey}-${score}-${index}`}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[11rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === OPD_CLINICAL_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getOpdClinicalScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = OPD_CLINICAL_TIER_LABELS[index];
                    return (
                      <button key={`${criteriaKey}-${score}-${index}`} type="button" onClick={() => handleChange(criteriaKey, value)} className={`min-w-[10rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"}`}>
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === IPD_CLINICAL_FORM_TYPE ? (
                <div className="flex flex-wrap gap-2">
                  {getIpdClinicalScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = IPD_CLINICAL_TIER_LABELS[index];
                    return (
                      <button key={`${criteriaKey}-${score}-${index}`} type="button" onClick={() => handleChange(criteriaKey, value)} className={`min-w-[10rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"}`}>
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === "Extern Clinical Assessment" ? (
                <div className="flex flex-wrap gap-2">
                  {getExternScoreTiers(criteriaKey).map((score, index) => {
                    const value = String(score);
                    const selected = formData[criteriaKey] === value;
                    const tierLabel = EXTERN_TIER_LABELS[index];
                    return (
                      <button
                        key={`${criteriaKey}-${score}`}
                        type="button"
                        onClick={() => handleChange(criteriaKey, value)}
                        className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                          selected
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                        }`}
                      >
                        {tierLabel} ({score})
                      </button>
                    );
                  })}
                </div>
              ) : config.formType === "Journal Conference" ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {getJournalClubScoreTiers(criteriaKey).map((score, index) => {
                      const value = String(score);
                      const selected = formData[criteriaKey] === value;
                      const tierLabel = JC_TIER_LABELS[index];
                      return (
                        <button
                          key={`${criteriaKey}-${score}-${index}`}
                          type="button"
                          onClick={() => handleChange(criteriaKey, value)}
                          className={`min-w-[9rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                            selected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {tierLabel} ({score})
                        </button>
                      );
                    })}
                  </div>
                  {JC_CRITERION_RUBRIC_THAI[criteriaKey] ? (
                    <div className="mt-3 rounded-md border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                      <span className="font-medium text-slate-800">เกณฑ์เนื้อหา: </span>
                      {JC_CRITERION_RUBRIC_THAI[criteriaKey]}
                    </div>
                  ) : null}
                </>
              ) : config.formType === "Multisource Feedback" ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {getMsfScoreTiers(criteriaKey).map((score, index) => {
                      const value = String(score);
                      const selected = formData[criteriaKey] === value;
                      const tierLabel = MSF_TIER_LABELS_THAI[index];
                      return (
                        <button
                          key={`${criteriaKey}-${score}-${index}`}
                          type="button"
                          onClick={() => handleChange(criteriaKey, value)}
                          className={`min-w-[8rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                            selected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {tierLabel} ({score})
                        </button>
                      );
                    })}
                  </div>
                  {MSF_CRITERION_RUBRIC_THAI[criteriaKey] ? (
                    <div className="mt-3 rounded-md border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                      <span className="font-medium text-slate-800">เกณฑ์เนื้อหา: </span>
                      {MSF_CRITERION_RUBRIC_THAI[criteriaKey]}
                    </div>
                  ) : null}
                </>
              ) : config.formType === "Case-Based Discussion" ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {getCbdScoreTiers(criteriaKey).map((score, index) => {
                      const value = String(score);
                      const selected = formData[criteriaKey] === value;
                      const tierLabel = CBD_TIER_LABELS[index];
                      return (
                        <button
                          key={`${criteriaKey}-${score}-${index}`}
                          type="button"
                          onClick={() => handleChange(criteriaKey, value)}
                          className={`min-w-[8rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                            selected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {tierLabel} ({score})
                        </button>
                      );
                    })}
                  </div>
                  {CBD_CRITERION_RUBRIC_THAI[criteriaKey] ? (
                    <div className="mt-3 rounded-md border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                      <span className="font-medium text-slate-800">เกณฑ์เนื้อหา: </span>
                      {CBD_CRITERION_RUBRIC_THAI[criteriaKey]}
                    </div>
                  ) : null}
                </>
              ) : config.formType === "MiniCEX" ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {getMiniCexScoreTiers(criteriaKey).map((score, index) => {
                      const value = String(score);
                      const selected = formData[criteriaKey] === value;
                      const tierLabel = MINICEX_TIER_LABELS[index];
                      return (
                        <button
                          key={`${criteriaKey}-${score}-${index}`}
                          type="button"
                          onClick={() => handleChange(criteriaKey, value)}
                          className={`min-w-[8rem] flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 sm:min-w-0 sm:flex-initial ${
                            selected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {tierLabel} ({score})
                        </button>
                      );
                    })}
                  </div>
                  {MINICEX_CRITERION_RUBRIC_THAI[criteriaKey] ? (
                    <div className="mt-3 rounded-md border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-sm leading-relaxed text-slate-700">
                      <span className="font-medium text-slate-800">เกณฑ์เนื้อหา: </span>
                      {MINICEX_CRITERION_RUBRIC_THAI[criteriaKey]}
                    </div>
                  ) : null}
                </>
              ) : (
                <select
                  value={formData[criteriaKey]}
                  onChange={(event) => handleChange(criteriaKey, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                >
                  <option value="">Select feedback level</option>
                  {criteriaFeedbackOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">{t(language, "Final Evaluation", "สรุปการประเมิน")}</h2>
        {criteriaScoreSumPreview != null ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
            <p className="font-medium">
              {t(language, "Total score", "คะแนนรวม")}: {criteriaScoreSumPreview}
            </p>
          </div>
        ) : null}
        {config.formType === OBGYN_HEALTH_EDUCATION_FORM_TYPE ? (
          <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
            <p className="font-medium">
              Total score: {obgynHealthEducationTotal ?? 0} / {OBGYN_HEALTH_EDUCATION_MAX_SCORE}
            </p>
            <p className="text-xs">
              Auto result from score:{" "}
              {obgynAutoPassFromScore == null ? "—" : obgynAutoPassFromScore ? "Pass" : "Fail"} (evaluator can override via Overall Performance below)
            </p>
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-1 gap-4">
          {config.overallPerformanceKey ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                {maskFormUiLabel(language, config.overallPerformanceKey)}
              </span>
              <select
                value={formData[config.overallPerformanceKey]}
                onChange={(event) => handleChange(config.overallPerformanceKey!, event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">Select overall performance</option>
                {(config.overallPerformanceOptions ?? ["Pass", "Fail"]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              {t(language, "Overall Performance Result", "ผลการประเมินโดยรวม")}
            </span>
            <select
              value={formData["Overall Performance Result"]}
              onChange={(event) => handleChange("Overall Performance Result", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              <option value="">Select result</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
              <option value="Needs Remediation">Needs Remediation</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Evaluator Feedback: What went well
            </span>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {evaluatorFeedbackPresets.map((phrase) => (
                <button
                  key={`well-${phrase}`}
                  type="button"
                  onClick={() => appendEvaluatorFeedback("Evaluator Feedback: What went well", phrase)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {phrase}
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              value={formData["Evaluator Feedback: What went well"]}
              onChange={(event) => handleChange("Evaluator Feedback: What went well", event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Evaluator Feedback: Areas to improve
            </span>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {evaluatorFeedbackPresets.map((phrase) => (
                <button
                  key={`improve-${phrase}`}
                  type="button"
                  onClick={() => appendEvaluatorFeedback("Evaluator Feedback: Areas to improve", phrase)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {phrase}
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              value={formData["Evaluator Feedback: Areas to improve"]}
              onChange={(event) =>
                handleChange("Evaluator Feedback: Areas to improve", event.target.value)
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
          </label>

          {formTypeUsesStudentFeedback(config.formType) && createdBy === "Student" ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Student Self-Reflection <span className="text-rose-600">*</span>
              </span>
              <textarea
                rows={4}
                value={formData[STUDENT_SELF_REFLECTION_COLUMN] ?? ""}
                onChange={(event) =>
                  handleChange(STUDENT_SELF_REFLECTION_COLUMN, event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                placeholder="Your reflection on this encounter (required to submit)."
              />
              <p className="mt-1 text-xs text-slate-500">
                Required when you create this assessment. Describe your perspective, what you learned, or
                what you would do differently.
              </p>
            </label>
          ) : null}

          {formTypeUsesStudentFeedback(config.formType) && createdBy === "Staff" ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <strong>You do not</strong> fill in <strong>Student Self-Reflection</strong>—that section is for
              the student. After you submit, they complete it from their dashboard (and the record moves
              toward complete when they finish).
            </div>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Saving...
          </>
        ) : (
          `${t(language, "Review & submit", "ตรวจทานและส่ง")} ${config.title}`
        )}
      </button>

      {showPreSubmitReview ? (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPreSubmitReview(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pre-submit-review-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="pre-submit-review-title" className="text-lg font-semibold text-slate-900">
              {t(language, "Review before you submit", "ตรวจทานก่อนส่ง")}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Please read through your answers again, including scores and feedback. If anything is wrong, go back
              and edit the form. When you are sure, confirm below—after that you will return to your dashboard.
            </p>
            <dl className="mt-4 space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Form</dt>
                <dd className="text-right font-medium text-slate-900">{config.title}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Student ID</dt>
                <dd className="text-right text-slate-900">{formData["Student ID"] || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Staff ID</dt>
                <dd className="text-right text-slate-900">{formData["Staff ID"] || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Hospital</dt>
                <dd className="text-right text-slate-900">{formData["Hospital"] || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Department / rotation</dt>
                <dd className="text-right text-slate-900">{formData["Department/Rotation"] || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Evaluator role</dt>
                <dd className="text-right text-slate-900">{formData["Evaluator Role"] || "—"}</dd>
              </div>
              {config.formType === "DOPS" ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Procedure name</dt>
                  <dd className="text-right text-slate-900">{formData["Procedure Name"] || "—"}</dd>
                </div>
              ) : null}
              {!FORM_TYPES_WITHOUT_PATIENT_HN.has(config.formType) ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Patient HN</dt>
                  <dd className="text-right text-slate-900">{formData["Patient HN"] || "—"}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Setting</dt>
                <dd className="text-right text-slate-900">{formData["Setting"] || "—"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Case complexity</dt>
                <dd className="text-right text-slate-900">{formData["Case Complexity"] || "—"}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              Criteria scores and written feedback are included in your submission—scroll the form above if you
              need to double-check those sections.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                onClick={() => setShowPreSubmitReview(false)}
              >
                {t(language, "Back to edit", "กลับไปแก้ไข")}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => void handleConfirmSubmit()}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  t(language, "Confirm and submit", "ยืนยันและส่ง")
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {previewRubric ? (
        <div
          className="fixed inset-0 z-[130] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewRubric(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Rubric preview"
            className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">{previewRubric.title}</h3>
              <div className="flex items-center gap-3">
                <a
                  href={previewRubric.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900"
                >
                  Open in new tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewRubric(null)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
            <iframe
              src={previewRubric.url}
              className="h-full w-full"
              title={previewRubric.title}
            />
          </div>
        </div>
      ) : null}
    </form>
  );
}
