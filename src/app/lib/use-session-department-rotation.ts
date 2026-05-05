"use client";

import { useCallback, useEffect, useState } from "react";

export const SESSION_DEPARTMENT_ROTATION_STORAGE_KEY = "clinical-assessments:department-rotation";

export function useSessionDepartmentRotation(): [string, (value: string) => void] {
  const [departmentRotation, setDepartmentRotationState] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_DEPARTMENT_ROTATION_STORAGE_KEY);
      if (stored) {
        queueMicrotask(() => setDepartmentRotationState(stored));
      }
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const setDepartmentRotation = useCallback((value: string) => {
    setDepartmentRotationState(value);
    try {
      if (value.trim()) {
        sessionStorage.setItem(SESSION_DEPARTMENT_ROTATION_STORAGE_KEY, value);
      } else {
        sessionStorage.removeItem(SESSION_DEPARTMENT_ROTATION_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  return [departmentRotation, setDepartmentRotation];
}
