"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DopsForm from "../../../components/forms/DopsForm";
import { DashboardNav } from "../../components/dashboard-nav";
import { getDashboardPathForRole, getUserAccessLookupResultByEmail } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export default function StudentDopsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateAccess = async () => {
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

      if (access.role !== "Student") {
        router.replace(getDashboardPathForRole(access.role));
        return;
      }

      setEmail(user.email);
      setIsLoading(false);
    };

    void validateAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNav email={email} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Create DOPS Assessment</h1>
          <p className="mt-2 text-sm text-slate-600">
            Student-created submissions are marked as pending until staff approval is completed.
          </p>
          <div className="mt-4">
            <Link
              href="/student"
              className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to Student Dashboard
            </Link>
          </div>
        </section>
        <DopsForm createdBy="Student" />
      </main>
    </div>
  );
}
