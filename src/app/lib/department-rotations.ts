import type { WpbaFormSlug } from "../../components/forms/wpba-config";
import { getFormOffersForDepartment, getWpbaSlugsForFormOffers } from "./department-form-catalog";

export {
  CLINICAL_DEPARTMENTS,
  CLINICAL_DEPARTMENT_ROTATIONS,
  YEAR7_CLINICAL_FORMS_DRIVE_URL,
  getFormOffersForDepartment,
  getWpbaSlugsForFormOffers,
  type ClinicalDepartmentRotation,
  type DepartmentFormOffer,
} from "./department-form-catalog";

/** In-app WPBA slugs referenced by catalog rows for this rotation (empty if no department). */
export function getWpbaSlugsForDepartment(departmentRotation: string): WpbaFormSlug[] {
  const trimmed = departmentRotation.trim();
  if (!trimmed) {
    return [];
  }
  return getWpbaSlugsForFormOffers(getFormOffersForDepartment(trimmed));
}

/** Escape a value for PostgREST `.or()` filters (e.g. department.eq."Internal Medicine"). */
export function escapePostgrestFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
