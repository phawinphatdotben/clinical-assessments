"use client";

import WpbaForm from "./WpbaForm";
import { getWpbaFormConfigBySlug } from "./wpba-config";

type DopsFormProps = {
  createdBy: "Staff" | "Student";
};

export default function DopsForm({ createdBy }: DopsFormProps) {
  const config = getWpbaFormConfigBySlug("dops");

  if (!config) {
    return null;
  }

  return <WpbaForm createdBy={createdBy} config={config} />;
}
