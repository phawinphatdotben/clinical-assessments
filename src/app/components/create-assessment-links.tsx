import Link from "next/link";
import { WPBA_FORM_CONFIGS } from "../../components/forms/wpba-config";

type CreateAssessmentLinksProps = {
  role: "staff" | "student";
  className?: string;
};

export function CreateAssessmentLinks({ role, className }: CreateAssessmentLinksProps) {
  const base = role === "staff" ? "/staff/forms" : "/student/forms";
  return (
    <div className={className ?? "flex flex-wrap gap-2"}>
      {WPBA_FORM_CONFIGS.map((formConfig) => (
        <Link
          key={formConfig.slug}
          href={`${base}/${formConfig.slug}`}
          className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Create {formConfig.title}
        </Link>
      ))}
    </div>
  );
}

type Role = "staff" | "student";

/** Full-width block for the Create assessment tab. */
export function CreateAssessmentTabPanel({ role }: { role: Role }) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-slate-900">Create assessment</h2>
      <p className="mt-1 text-sm text-slate-600">
        Pick a form to start. The same buttons are available at the bottom of the Dashboard tab if you prefer to
        scroll.
      </p>
      <div className="mt-4">
        <CreateAssessmentLinks role={role} />
      </div>
    </div>
  );
}

/** Bottom of Dashboard tab: duplicate shortcuts + note about the tab. */
export function CreateAssessmentDashboardFoot({ role }: { role: Role }) {
  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-semibold text-slate-900">Create assessment</h2>
      <p className="mt-1 text-sm text-slate-600">
        Quick links to new forms. You can also open the <strong>Create assessment</strong> tab so you do not need to
        scroll past your lists.
      </p>
      <div className="mt-3">
        <CreateAssessmentLinks role={role} />
      </div>
    </div>
  );
}
