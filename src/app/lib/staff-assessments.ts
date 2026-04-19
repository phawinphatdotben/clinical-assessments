import { supabase } from "./supabase";
import {
  ASSESSMENT_STATUS_COMPLETE,
  ASSESSMENT_STATUS_PENDING,
  ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL,
  SELF_REFLECTION_DEADLINE_COLUMN,
  computeSelfReflectionDeadlineDateString,
  fetchAssessmentByRouteId,
  formTypeUsesStudentFeedback,
  pickAssessmentRowId,
} from "./student-feedback";

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

const pickStaffIdFromUserRow = (row: Record<string, unknown>): string => {
  return pickString(row, ["Staff ID", "StaffID", "User", "staff_id"]);
};

export async function getStaffProfileForCurrentUserWithError(): Promise<{
  staffId: string | null;
  email: string | null;
  errorMessage: string | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { staffId: null, email: null, errorMessage: "Not signed in." };
  }
  const email = user.email.trim();
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .ilike("Email", email.toLowerCase())
    .limit(1);
  if (error) {
    return { staffId: null, email: null, errorMessage: error.message };
  }
  if (!data?.length) {
    return {
      staffId: null,
      email: null,
      errorMessage:
        "No Users row found for your email. Check RLS allows reading your profile.",
    };
  }
  const row = data[0] as Record<string, unknown>;
  const staffId = pickStaffIdFromUserRow(row);
  if (!staffId) {
    return {
      staffId: null,
      email,
      errorMessage: "Your Users row has no Staff ID set.",
    };
  }
  return { staffId, email, errorMessage: null };
}

/** Staff sees assessments they filed (Evaluator Email) or where they are the selected evaluator (Staff ID). */
export async function fetchStaffAssessmentsForCurrentUser(
  staffEmail: string,
  staffId: string
): Promise<{ rows: Record<string, unknown>[]; errorMessage: string | null }> {
  const emailNorm = staffEmail.trim();
  const byEmail = await supabase.from("Assessment").select("*").eq("Evaluator Email", emailNorm);

  const byStaffId = await supabase.from("Assessment").select("*").eq("Staff ID", staffId);

  if (byEmail.error && byStaffId.error) {
    return { rows: [], errorMessage: byEmail.error.message || byStaffId.error.message };
  }

  const merged: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const push = (rows: Record<string, unknown>[] | null | undefined) => {
    if (!rows) {
      return;
    }
    for (const raw of rows) {
      const row = raw as Record<string, unknown>;
      const rid = pickAssessmentRowId(row);
      const key = rid || JSON.stringify(Object.keys(row).sort().map((k) => [k, row[k]]));
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(row);
      }
    }
  };

  if (!byEmail.error) {
    push(byEmail.data as Record<string, unknown>[]);
  }
  if (!byStaffId.error) {
    push(byStaffId.data as Record<string, unknown>[]);
  }

  merged.sort((a, b) => {
    const ta = new Date(String(a.updated_at ?? a.created_at ?? 0)).getTime();
    const tb = new Date(String(b.updated_at ?? b.created_at ?? 0)).getTime();
    return tb - ta;
  });

  return { rows: merged, errorMessage: null };
}

export function staffCanAccessAssessmentRow(
  row: Record<string, unknown>,
  staffEmail: string,
  staffId: string
): boolean {
  const ev = pickString(row, ["Evaluator Email", "EvaluatorEmail", "evaluator_email"]).toLowerCase();
  const sid = pickString(row, ["Staff ID", "StaffID", "staff_id"]);
  const em = staffEmail.trim().toLowerCase();
  if (ev && ev === em) {
    return true;
  }
  if (sid && sid === staffId.trim()) {
    return true;
  }
  return false;
}

/**
 * After staff approves a student-submitted assessment:
 * - If the student already entered self-reflection on the form, mark **Complete** (no pending student step).
 * - If self-reflection is still empty, use the same next step as when staff creates the form (**Pending** + deadline).
 */
export function buildStaffApprovalUpdatePayload(
  formType: string,
  options?: { studentSelfReflection?: string }
): Record<string, string> {
  if (!formTypeUsesStudentFeedback(formType)) {
    return { Status: "Submitted" };
  }
  const reflection = (options?.studentSelfReflection ?? "").trim();
  if (reflection.length > 0) {
    return { Status: ASSESSMENT_STATUS_COMPLETE };
  }
  return {
    Status: ASSESSMENT_STATUS_PENDING,
    [SELF_REFLECTION_DEADLINE_COLUMN]: computeSelfReflectionDeadlineDateString(),
  };
}

export function isAwaitingStaffApproval(statusRaw: string): boolean {
  return statusRaw.trim() === ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL;
}

export function formatStaffAssessmentStatusLabel(statusRaw: string): string {
  const s = statusRaw.trim();
  if (s === ASSESSMENT_STATUS_PENDING_STAFF_APPROVAL) {
    return "Awaiting your approval";
  }
  return s;
}

export { fetchAssessmentByRouteId, pickAssessmentRowId };
