"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { CourseIndex } from "@/lib/course-types";
import { locateBreadcrumb } from "@/lib/breadcrumb";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar({ course, onMenuClick }: { course: CourseIndex; onMenuClick: () => void }) {
  const pathname = usePathname();
  const loc = locateBreadcrumb(course, pathname);

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar-menu" onClick={onMenuClick} aria-label="Open course navigation">
        <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        OpenCV University
      </Link>
      {loc && (
        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <span aria-hidden="true" className="tb-sep">
            /
          </span>
          <span className="tb-crumb tb-crumb-part">
            Part {loc.part.letter}: {loc.module.title}
          </span>
          <span aria-hidden="true" className="tb-sep">
            /
          </span>
          <span className="tb-crumb tb-crumb-chapter">
            {loc.chapter.number} {loc.chapter.title}
          </span>
        </nav>
      )}
      <div className="topbar-spacer" />
      <span className="badge-preview">Preview</span>
      <ThemeToggle />
    </header>
  );
}
