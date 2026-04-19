import { supabase } from "./supabase";

export type DashboardRole = "Admin" | "Staff" | "Student";
export type RoleLookupFailureReason = "query_error" | "no_row" | "invalid_role";
export type AccountApprovalFailureReason = "not_approved";

export type UserRoleLookupResult = {
  role: DashboardRole | null;
  failureReason?: RoleLookupFailureReason;
  errorMessage?: string;
};

export type UserAccessLookupResult = {
  role: DashboardRole | null;
  isApproved: boolean;
  failureReason?: RoleLookupFailureReason | AccountApprovalFailureReason;
  errorMessage?: string;
};

const DASHBOARD_PATHS: Record<DashboardRole, string> = {
  Admin: "/admin",
  Staff: "/staff",
  Student: "/student",
};

export const getDashboardPathForRole = (role: DashboardRole): string => {
  return DASHBOARD_PATHS[role];
};

export const getUserRoleLookupResultByEmail = async (
  email: string
): Promise<UserRoleLookupResult> => {
  const access = await getUserAccessLookupResultByEmail(email);
  return {
    role: access.role,
    failureReason:
      access.failureReason === "not_approved" ? undefined : access.failureReason,
    errorMessage: access.errorMessage,
  };
};

export const getUserAccessLookupResultByEmail = async (
  email: string
): Promise<UserAccessLookupResult> => {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("Users")
    .select('Role, Status, "Is Approved"')
    .ilike("Email", normalizedEmail)
    .limit(1);

  if (error) {
    return {
      role: null,
      isApproved: false,
      failureReason: "query_error",
      errorMessage: error.message,
    };
  }

  if (!data || data.length === 0) {
    return { role: null, isApproved: false, failureReason: "no_row" };
  }

  const firstRow = data[0] as Record<string, unknown>;
  const roleValue = firstRow.Role ?? firstRow.role;
  const approvalValue =
    firstRow["Is Approved"] ?? firstRow.is_approved ?? firstRow.isApproved ?? false;
  const statusValue = firstRow.Status ?? firstRow.status;

  const normalizedStatus = typeof statusValue === "string" ? statusValue.trim().toLowerCase() : "";
  const isApproved = approvalValue === true || normalizedStatus === "approved";

  if (typeof roleValue !== "string") {
    return { role: null, isApproved, failureReason: "invalid_role" };
  }

  const role = roleValue.trim().toLowerCase();

  if (role === "admin") {
    if (!isApproved) {
      return {
        role: "Admin",
        isApproved: false,
        failureReason: "not_approved",
        errorMessage: "Account is waiting for admin approval.",
      };
    }

    return { role: "Admin", isApproved: true };
  }

  if (role === "staff") {
    if (!isApproved) {
      return {
        role: "Staff",
        isApproved: false,
        failureReason: "not_approved",
        errorMessage: "Account is waiting for admin approval.",
      };
    }

    return { role: "Staff", isApproved: true };
  }

  if (role === "student") {
    if (!isApproved) {
      return {
        role: "Student",
        isApproved: false,
        failureReason: "not_approved",
        errorMessage: "Account is waiting for admin approval.",
      };
    }

    return { role: "Student", isApproved: true };
  }

  return {
    role: null,
    isApproved,
    failureReason: "invalid_role",
    errorMessage: `Unsupported role value: "${String(roleValue)}"`,
  };
};

export const getUserRoleByEmail = async (email: string): Promise<DashboardRole | null> => {
  const result = await getUserRoleLookupResultByEmail(email);
  return result.role;
};
