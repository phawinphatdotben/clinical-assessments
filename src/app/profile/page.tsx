"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { DashboardNav } from "../components/dashboard-nav";
import { getDashboardPathForRole, getUserAccessLookupResultByEmail } from "../lib/auth";
import { supabase } from "../lib/supabase";

type ProfileDraft = {
  email: string;
  name: string;
  hospital: string;
  studentId: string;
  staffId: string;
};

const pickString = (row: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return "";
};

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [role, setRole] = useState<"Staff" | "Student" | null>(null);
  const [email, setEmail] = useState("");
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    email: "",
    name: "",
    hospital: "",
    studentId: "",
    staffId: "",
  });
  const [columnMap, setColumnMap] = useState({
    studentIdColumn: "Student ID",
    staffIdColumn: "Staff ID",
    hospitalColumn: "Hospital",
  });

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        router.replace("/");
        return;
      }

      const access = await getUserAccessLookupResultByEmail(user.email);

      if (!access.role || !access.isApproved) {
        await supabase.auth.signOut();
        router.replace("/");
        return;
      }

      if (access.role === "Admin") {
        router.replace("/admin");
        return;
      }

      const { data, error } = await supabase.from("Users").select("*").eq("Email", user.email).limit(1);

      if (error || !data || data.length === 0) {
        setErrorMessage(error?.message ?? "Unable to load profile data.");
        setIsLoading(false);
        return;
      }

      const row = data[0] as Record<string, unknown>;
      const studentIdColumn = row["Student ID"] !== undefined ? "Student ID" : "StudentID";
      const staffIdColumn =
        row["Staff ID"] !== undefined ? "Staff ID" : row["StaffID"] !== undefined ? "StaffID" : "User";
      const hospitalColumn = row["Hospital"] !== undefined ? "Hospital" : "hospital";

      setColumnMap({
        studentIdColumn,
        staffIdColumn,
        hospitalColumn,
      });

      setEmail(user.email);
      setRole(access.role);
      setProfileDraft({
        email: user.email,
        name: pickString(row, ["Name", "name"]),
        hospital: pickString(row, ["Hospital", "hospital"]),
        studentId: pickString(row, ["Student ID", "StudentID", "student_id"]),
        staffId: pickString(row, ["Staff ID", "StaffID", "User", "staff_id"]),
      });
      setIsLoading(false);
    };

    void loadProfile();
  }, [router]);

  const handleChange = (key: keyof ProfileDraft, value: string) => {
    setProfileDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    const updatePayload: Record<string, string> = {
      Name: profileDraft.name.trim(),
      [columnMap.hospitalColumn]: profileDraft.hospital.trim(),
    };

    if (role === "Student") {
      updatePayload[columnMap.studentIdColumn] = profileDraft.studentId.trim();
    }

    if (role === "Staff") {
      updatePayload[columnMap.staffIdColumn] = profileDraft.staffId.trim();
    }

    const { error } = await supabase.from("Users").update(updatePayload).eq("Email", email);

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    if (role === "Staff" || role === "Student") {
      router.push(getDashboardPathForRole(role));
    } else {
      setSuccessMessage("Profile updated successfully.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNav email={email} />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
            {role === "Staff" || role === "Student" ? (
              <Link
                href={getDashboardPathForRole(role)}
                className="text-sm font-medium text-slate-700 underline-offset-4 transition hover:text-slate-900 hover:underline"
              >
                Back to dashboard
              </Link>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Update your account details. Email cannot be changed.
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Role: {role}</p>
        </section>

        <form
          onSubmit={handleSave}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                readOnly
                value={profileDraft.email}
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Full Name</span>
              <input
                type="text"
                value={profileDraft.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Hospital</span>
              <select
                value={profileDraft.hospital}
                onChange={(event) => handleChange("hospital", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              >
                <option value="">Select hospital</option>
                <option value="NPH">NPH</option>
                <option value="CRA">CRA</option>
                <option value="PBH">PBH</option>
              </select>
            </label>

            {role === "Student" ? (
              <div className="space-y-3 md:col-span-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-700">Student ID</span>
                  <input
                    type="text"
                    value={profileDraft.studentId}
                    onChange={(event) => handleChange("studentId", event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                  />
                </label>
                {profileDraft.studentId.trim() ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-800">Code for staff to scan</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Open this page on your phone and let staff use <strong>Scan code</strong> on the assessment
                      form to fill your Student ID. The QR encodes exactly what is saved above.
                    </p>
                    <div className="mt-3 flex justify-center rounded-lg bg-white p-4">
                      <QRCode value={profileDraft.studentId.trim()} size={192} />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Save a Student ID above to generate a scannable QR.</p>
                )}
              </div>
            ) : null}

            {role === "Staff" ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Staff ID</span>
                <input
                  type="text"
                  value={profileDraft.staffId}
                  onChange={(event) => handleChange("staffId", event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                />
              </label>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          <div className="mt-5">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
