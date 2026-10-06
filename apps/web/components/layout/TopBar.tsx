"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Ref } from "react";
import { Menu } from "lucide-react";
import type { CourseIndex } from "@/lib/course-types";
import { locateBreadcrumb } from "@/lib/breadcrumb";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  course: CourseIndex;
  drawerOpen: boolean;
  onMenuClick: () => void;
  menuButtonRef: Ref<HTMLButtonElement>;
}

export function TopBar({ course, drawerOpen, onMenuClick, menuButtonRef }: Props) {
  const pathname = usePathname();
  const loc = locateBreadcrumb(course, pathname);

  return (
    <header className="topbar">
      <button
        type="button"
        ref={menuButtonRef}
        className="icon-btn topbar-menu"
        onClick={onMenuClick}
        aria-label="Open course navigation"
        aria-expanded={drawerOpen}
        aria-controls="course-nav-drawer"
      >
        <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-text">OpenCV University</span>
      </Link>
      {loc && <span className="topbar-divider" aria-hidden="true" />}
      {loc && (
        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="tb-crumb tb-crumb-course">
            Course
          </Link>
          <span className="tb-part-group">
            <span aria-hidden="true" className="tb-sep">
              /
            </span>
            <span className="tb-crumb tb-crumb-part">
              Part {loc.part.letter}: {loc.part.title}
            </span>
          </span>
          <span className="tb-module-group">
            <span aria-hidden="true" className="tb-sep">
              /
            </span>
            <span className="tb-crumb tb-crumb-module">
              {loc.module.number}. {loc.module.title}
            </span>
          </span>
          <span aria-hidden="true" className="tb-sep">
            /
          </span>
          <span className="tb-crumb tb-crumb-chapter">
            {loc.chapter.number} {loc.chapter.title}
          </span>
        </nav>
      )}
      {!loc && <div className="topbar-spacer" />}
      <span className="badge-preview">Preview</span>
      <ThemeToggle />
    </header>
  );
}
