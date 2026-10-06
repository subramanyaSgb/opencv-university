"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { CourseIndex } from "@/lib/course-types";
import { TopBar } from "./TopBar";
import { CourseTree } from "./CourseTree";

export function AppShell({ course, children }: { course: CourseIndex; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="app">
      <TopBar course={course} onMenuClick={() => setDrawerOpen((v) => !v)} />
      <div className="app-body">
        <aside className={`sidebar${drawerOpen ? " is-open" : ""}`} aria-label="Course navigation">
          <CourseTree course={course} />
        </aside>
        {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} aria-hidden="true" />}
        <main id="main" className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
