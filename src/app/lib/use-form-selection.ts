"use client";

import { useMemo } from "react";
import { getFormOffersForDepartment, getWpbaSlugsForFormOffers } from "./department-form-catalog";
import { useSessionDepartmentRotation } from "./use-session-department-rotation";

/**
 * Step 1 · department (persisted session) → Step 2 · filtered form offers (`formOffers`).
 */
export function useFormSelection() {
  const [selectedDepartment, setSelectedDepartment] = useSessionDepartmentRotation();

  const formOffers = useMemo(() => {
    const trimmed = selectedDepartment.trim();
    if (!trimmed) {
      return [];
    }
    return getFormOffersForDepartment(trimmed);
  }, [selectedDepartment]);

  const wpbaSlugsForSelection = useMemo(
    () => getWpbaSlugsForFormOffers(formOffers),
    [formOffers],
  );

  return {
    selectedDepartment,
    setSelectedDepartment,
    formOffers,
    wpbaSlugsForSelection,
    hasDepartmentSelected: Boolean(selectedDepartment.trim()),
  };
}
