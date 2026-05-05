"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { t, useUiLanguage } from "../lib/ui-language";

type DashboardNavProps = {
  email: string;
};

export function DashboardNav({ email }: DashboardNavProps) {
  const router = useRouter();
  const { language, toggleLanguage } = useUiLanguage();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <p className="text-sm font-semibold tracking-wide text-slate-800">Clinical Assessments</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            title={t(language, "Switch language", "สลับภาษา")}
          >
            {language === "en" ? "ไทย" : "EN"}
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {email}
          </span>
          <Link
            href="/profile"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t(language, "Profile", "โปรไฟล์")}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {t(language, "Sign Out", "ออกจากระบบ")}
          </button>
        </div>
      </div>
    </header>
  );
}
