import { WPBA_FORM_CONFIGS } from "../../components/forms/wpba-config";
import {
  ASSESSMENT_STATUS_COMPLETE,
  ASSESSMENT_STATUS_COMPLETE_FAIL,
  formTypeUsesStudentFeedback,
} from "./student-feedback";

function pickOverallRaw(
  formType: string,
  rowLike: Record<string, unknown>,
  overrides?: Record<string, string>
): string {
  const config = WPBA_FORM_CONFIGS.find((c) => c.formType === formType);
  const key = config?.overallPerformanceKey;
  if (!key) {
    return "";
  }
  const fromOverride = overrides?.[key];
  if (fromOverride != null && String(fromOverride).trim()) {
    return String(fromOverride).trim();
  }
  const v = rowLike[key];
  if (typeof v === "string" && v.trim()) {
    return v.trim();
  }
  if (typeof v === "number" && !Number.isNaN(v)) {
    return String(v);
  }
  return "";
}

export function resolveOverallFailFromRow(
  formType: string,
  row: Record<string, unknown>,
  overrides?: Record<string, string>
): boolean {
  const config = WPBA_FORM_CONFIGS.find((c) => c.formType === formType);
  if (!config?.overallPerformanceKey) {
    return false;
  }
  return pickOverallRaw(formType, row, overrides).trim().toLowerCase() === "fail";
}

/**
 * Staff-submitted forms that skip the student self-reflection workflow use `Submitted` when the
 * attempt passes; failed overall outcomes are stored as `Complete (Fail)` so the row is closed but
 * visibly distinct.
 */
export function resolveStaffSubmitStatusWithoutStudentWorkflow(
  formType: string,
  formData: Record<string, string>
): string {
  if (formTypeUsesStudentFeedback(formType)) {
    return "";
  }
  if (resolveOverallFailFromFormType(formType, formData)) {
    return ASSESSMENT_STATUS_COMPLETE_FAIL;
  }
  return "Submitted";
}

function resolveOverallFailFromFormType(formType: string, formData: Record<string, string>): boolean {
  const config = WPBA_FORM_CONFIGS.find((c) => c.formType === formType);
  const key = config?.overallPerformanceKey;
  if (!key) {
    return false;
  }
  return (formData[key] ?? "").trim().toLowerCase() === "fail";
}

export function resolveCompleteStatusAfterStudentWorkflow(
  formType: string,
  row: Record<string, unknown>,
  gradingOverrides?: Record<string, string>
): typeof ASSESSMENT_STATUS_COMPLETE | typeof ASSESSMENT_STATUS_COMPLETE_FAIL {
  if (resolveOverallFailFromRow(formType, row, gradingOverrides)) {
    return ASSESSMENT_STATUS_COMPLETE_FAIL;
  }
  return ASSESSMENT_STATUS_COMPLETE;
}
