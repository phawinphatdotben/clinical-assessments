"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";
import { getDashboardPathForRole, getUserAccessLookupResultByEmail } from "./lib/auth";

const formatRoleLookupDebugMessage = (failureReason?: string, errorMessage?: string): string => {
  if (failureReason === "not_approved") {
    return "Your account is pending admin approval.";
  }

  if (failureReason === "query_error") {
    return `Role query failed: ${errorMessage ?? "Unknown query error."}`;
  }

  if (failureReason === "no_row") {
    return "No row found in Users where Email matches this login.";
  }

  if (failureReason === "invalid_role") {
    return `Role value is missing or unsupported.${errorMessage ? ` (${errorMessage})` : ""}`;
  }

  return "Role lookup failed for an unknown reason.";
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [requestedRole, setRequestedRole] = useState("Student");
  const [signupStudentId, setSignupStudentId] = useState("");
  const [signupStaffId, setSignupStaffId] = useState("");
  const [signupHospital, setSignupHospital] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  const createPendingUserRowForApproval = async (
    authEmail: string,
    userMetadata?: Record<string, unknown>
  ): Promise<{ ok: boolean; message?: string }> => {
    const requestedRoleFromMeta = String(userMetadata?.requested_role ?? "Student").trim();
    const normalizedRequestedRole = requestedRoleFromMeta.toLowerCase();
    const roleForInsert =
      normalizedRequestedRole === "staff"
        ? "Staff"
        : normalizedRequestedRole === "admin"
          ? "Admin"
          : "Student";
    const fullNameFromMeta = String(userMetadata?.full_name ?? "").trim();
    const studentIdFromMeta = String(userMetadata?.student_id ?? "").trim();
    const staffIdFromMeta = String(userMetadata?.staff_id ?? "").trim();
    const hospitalFromMeta = String(userMetadata?.hospital ?? "").trim();

    const { error: createUserRowError } = await supabase.from("Users").insert([
      {
        Email: authEmail,
        Name: fullNameFromMeta || authEmail,
        Role: roleForInsert,
        "Student ID": studentIdFromMeta || null,
        "Staff ID": staffIdFromMeta || null,
        Hospital: hospitalFromMeta || null,
        "Is Approved": false,
        Status: "Pending Approval",
      },
    ]);

    if (createUserRowError) {
      return {
        ok: false,
        message: `Account confirmed, but approval request creation failed: ${createUserRowError.message}`,
      };
    }

    return { ok: true };
  };

  useEffect(() => {
    const hashParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.hash.replace(/^#/, ""))
        : null;
    const isRecoveryFromUrl = hashParams?.get("type") === "recovery";

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        setIsCheckingSession(false);
      }
    });

    const checkExistingSession = async () => {
      if (isRecoveryFromUrl) {
        await supabase.auth.getSession();
        setIsPasswordRecovery(true);
        setIsCheckingSession(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setIsCheckingSession(false);
        return;
      }

      const accessLookup = await getUserAccessLookupResultByEmail(user.email);

      if (accessLookup.failureReason === "no_row") {
        const creation = await createPendingUserRowForApproval(
          user.email,
          user.user_metadata as Record<string, unknown> | undefined
        );
        await supabase.auth.signOut();

        if (!creation.ok) {
          setErrorMessage(creation.message ?? "Failed to create approval request.");
          setIsCheckingSession(false);
          return;
        }

        setSuccessMessage(
          "Email confirmed and approval request submitted. Please wait for admin approval, then sign in."
        );
        setIsCheckingSession(false);
        return;
      }

      if (!accessLookup.role || !accessLookup.isApproved) {
        await supabase.auth.signOut();
        setErrorMessage(
          `Your account does not have a valid role. ${formatRoleLookupDebugMessage(
            accessLookup.failureReason,
            accessLookup.errorMessage
          )}`
        );
        setIsCheckingSession(false);
        return;
      }

      router.replace(getDashboardPathForRole(accessLookup.role));
    };

    void checkExistingSession();
    return () => subscription.unsubscribe();
  }, [router]);

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setIsPasswordRecovery(false);
    setNewPassword("");
    setConfirmNewPassword("");
    setSuccessMessage("Password updated. Sign in with your new password.");
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage("Enter your email address.");
      return;
    }

    setIsLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: origin ? `${origin}/` : undefined,
    });
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setForgotMode(false);
    setSuccessMessage("Check your email for a password reset link.");
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    if (mode === "signup") {
      if (requestedRole === "Student" && !signupStudentId.trim()) {
        setErrorMessage("Student ID is required for student accounts.");
        setIsLoading(false);
        return;
      }

      if (requestedRole === "Staff" && !signupStaffId.trim()) {
        setErrorMessage("Staff ID is required for staff accounts.");
        setIsLoading(false);
        return;
      }

      if (requestedRole === "Staff" && !signupHospital.trim()) {
        setErrorMessage("Hospital is required for staff accounts.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            requested_role: requestedRole,
            student_id: signupStudentId.trim(),
            staff_id: signupStaffId.trim(),
            hospital: signupHospital.trim(),
          },
        },
      });

      if (error || !data.user?.email) {
        setErrorMessage(error?.message ?? "Sign up failed. Please try again.");
        setIsLoading(false);
        return;
      }

      await supabase.auth.signOut();
      setSuccessMessage(
        "Account created. If email confirmation is enabled, verify your email first, then sign in once to submit your approval request."
      );
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user?.email) {
      setErrorMessage(error?.message ?? "Login failed. Please try again.");
      setIsLoading(false);
      return;
    }

    const accessLookup = await getUserAccessLookupResultByEmail(data.user.email);

    if (accessLookup.failureReason === "no_row") {
      const creation = await createPendingUserRowForApproval(
        data.user.email,
        data.user.user_metadata as Record<string, unknown> | undefined
      );
      await supabase.auth.signOut();

      if (!creation.ok) {
        setErrorMessage(creation.message ?? "Approval request failed.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Approval request submitted. Please wait for admin approval before signing in.");
      setIsLoading(false);
      return;
    }

    if (!accessLookup.role || !accessLookup.isApproved) {
      await supabase.auth.signOut();
      setErrorMessage(
        `No valid role found for this account. ${formatRoleLookupDebugMessage(
          accessLookup.failureReason,
          accessLookup.errorMessage
        )}`
      );
      setIsLoading(false);
      return;
    }

    router.replace(getDashboardPathForRole(accessLookup.role));
  };

  if (isCheckingSession && !isPasswordRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <p className="text-sm text-slate-600">Checking session...</p>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Clinical Assessments
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Set a new password</h1>
            <p className="mt-1 text-sm text-slate-600">
              You opened a password reset link. Choose a new password below.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleUpdatePassword}>
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-new-password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                placeholder="••••••••"
              />
            </div>

            {errorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Saving..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Clinical Assessments
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            {mode === "signin"
              ? "Use your account email and password to continue."
              : "Create your account. Admin approval is required before login."}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setForgotMode(false);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`rounded-md px-3 py-2 font-medium transition ${
              mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setForgotMode(false);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={`rounded-md px-3 py-2 font-medium transition ${
              mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Create Account
          </button>
        </div>

        <form
          className="space-y-5"
          onSubmit={mode === "signin" && forgotMode ? handleForgotPassword : handleLogin}
        >
          {mode === "signin" && forgotMode ? (
            <p className="text-sm text-slate-600">
              Enter your account email. We will send a link to reset your password.
            </p>
          ) : null}

          {mode === "signup" ? (
            <>
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="requested-role"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Requested Role
                </label>
                <select
                  id="requested-role"
                  value={requestedRole}
                  onChange={(event) => setRequestedRole(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                >
                  <option value="Student">Student</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              {requestedRole === "Student" ? (
                <div>
                  <label
                    htmlFor="signup-student-id"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Student ID
                  </label>
                  <input
                    id="signup-student-id"
                    type="text"
                    required
                    value={signupStudentId}
                    onChange={(event) => setSignupStudentId(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    placeholder="Enter student ID"
                  />
                </div>
              ) : null}

              {requestedRole === "Staff" ? (
                <>
                  <div>
                    <label
                      htmlFor="signup-staff-id"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Staff ID
                    </label>
                    <input
                      id="signup-staff-id"
                      type="text"
                      required
                      value={signupStaffId}
                      onChange={(event) => setSignupStaffId(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                      placeholder="Enter staff ID"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-hospital"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Hospital
                    </label>
                    <select
                      id="signup-hospital"
                      required
                      value={signupHospital}
                      onChange={(event) => setSignupHospital(event.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    >
                      <option value="">Select hospital</option>
                      <option value="NPH">NPH</option>
                      <option value="CRA">CRA</option>
                      <option value="PBH">PBH</option>
                    </select>
                  </div>
                </>
              ) : null}
            </>
          ) : null}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              placeholder="you@hospital.com"
              autoComplete={mode === "signin" && forgotMode ? "email" : "username"}
            />
          </div>

          {mode === "signin" && !forgotMode ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    setSuccessMessage("");
                    setForgotMode(true);
                  }}
                  className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                placeholder="********"
                autoComplete="current-password"
              />
            </div>
          ) : null}

          {mode === "signup" ? (
            <div>
              <label
                htmlFor="password-signup"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password-signup"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                placeholder="********"
                autoComplete="new-password"
              />
            </div>
          ) : null}

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          {mode === "signin" && forgotMode ? (
            <button
              type="button"
              onClick={() => {
                setForgotMode(false);
                setErrorMessage("");
              }}
              className="w-full text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Back to sign in
            </button>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? mode === "signin" && forgotMode
                ? "Sending..."
                : mode === "signin"
                  ? "Signing in..."
                  : "Creating account..."
              : mode === "signin" && forgotMode
                ? "Send reset link"
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
