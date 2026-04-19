"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import WpbaForm from "../../../../components/forms/WpbaForm";
import { getWpbaFormConfigBySlug } from "../../../../components/forms/wpba-config";
import { DashboardNav } from "../../../components/dashboard-nav";
import { getDashboardPathForRole, getUserAccessLookupResultByEmail } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

export default function StaffWpbaFormPage() {
  const router = useRouter();
  const params = useParams<{ formType: string }>();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const formConfig = useMemo(() => {
    return getWpbaFormConfigBySlug(params.formType);
  }, [params.formType]);

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

      if (access.role !== "Staff") {
        router.replace(getDashboardPathForRole(access.role));
        return;
      }

      if (!formConfig) {
        router.replace("/staff");
        return;
      }

      setEmail(user.email);
      setIsLoading(false);
    };

    void validateAccess();
  }, [formConfig, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Loading form...</p>
      </div>
    );
  }

  if (!formConfig) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardNav email={email} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Create {formConfig.title}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Staff-created submissions are marked as pending until Student Self-Reflection is completed.
          </p>
          <div className="mt-4">
            <Link
              href="/staff"
              className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to Staff Dashboard
            </Link>
          </div>
        </section>
        <WpbaForm createdBy="Staff" config={formConfig} />
      </main>
    </div>
  );
}
