"use client";

type AssessmentSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
};

export function AssessmentSearchBar({
  value,
  onChange,
  id = "assessment-person-search",
  label = "Filter by person",
  placeholder = "Name, Student ID, Staff ID, or email (leave empty to show most recent first)",
  helperText = "Matches people linked to assessments (evaluator, student, staff). Empty search lists everything with the newest activity first.",
}: AssessmentSearchBarProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="search"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xl rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      />
      <p className="mt-1 text-xs text-slate-500">{helperText}</p>
    </div>
  );
}
