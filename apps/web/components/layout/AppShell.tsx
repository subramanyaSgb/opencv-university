"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { CourseIndex } from "@/lib/course-types";
import { TopBar } from "./TopBar";
import { CourseTree } from "./CourseTree";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function AppShell({ course, children }: { course: CourseIndex; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const close = () => setDrawerOpen(false);

  useEffect(() => {
    if (drawerOpen) {
      wasOpen.current = true;
      sidebarRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      menuButtonRef.current?.focus();
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !sidebarRef.current) return;
      const focusable = Array.from(sidebarRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
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
      <TopBar course={course} drawerOpen={drawerOpen} onMenuClick={() => setDrawerOpen((v) => !v)} menuButtonRef={menuButtonRef} />
      <div className="app-body">
        <aside
          id="course-nav-drawer"
          ref={sidebarRef}
          className={`sidebar${drawerOpen ? " is-open" : ""}`}
          aria-label="Course navigation"
          tabIndex={-1}
        >
          <CourseTree course={course} />
        </aside>
        {drawerOpen && <div className="drawer-overlay" onClick={close} aria-hidden="true" />}
        <main id="main" className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
