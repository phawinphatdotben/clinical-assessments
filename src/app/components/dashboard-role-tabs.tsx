"use client";

export type DashboardMainTab = "dashboard" | "portfolio" | "logbook" | "create";

type DashboardRoleTabsProps = {
  active: DashboardMainTab;
  onChange: (tab: DashboardMainTab) => void;
  /** Admin: only Dashboard + Portfolio. Staff/Student: also Create assessment. */
  variant?: "admin" | "role";
};

export function DashboardRoleTabs({ active, onChange, variant = "admin" }: DashboardRoleTabsProps) {
  const base =
    "rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500";
  const activeCls = "bg-slate-900 text-white";
  const idleCls = "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={active === "dashboard"}
        className={`${base} ${active === "dashboard" ? activeCls : idleCls}`}
        onClick={() => onChange("dashboard")}
      >
        Dashboard
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "portfolio"}
        className={`${base} ${active === "portfolio" ? activeCls : idleCls}`}
        onClick={() => onChange("portfolio")}
      >
        Portfolio
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "logbook"}
        className={`${base} ${active === "logbook" ? activeCls : idleCls}`}
        onClick={() => onChange("logbook")}
      >
        DOPS logbook
      </button>
      {variant === "role" ? (
        <button
          type="button"
          role="tab"
          aria-selected={active === "create"}
          className={`${base} ${active === "create" ? activeCls : idleCls}`}
          onClick={() => onChange("create")}
        >
          Create assessment
        </button>
      ) : null}
    </div>
  );
}
