import type { Metadata } from "next";
import { course } from "@/generated/content-index";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div className="lookup-page">
      <h1>Progress</h1>
      <p className="lede">Stored on this device only (localStorage) -- not synced anywhere yet.</p>
      <ProgressDashboard course={course} />
    </div>
  );
}
