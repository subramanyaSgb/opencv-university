import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "OpenCV University", template: "%s · OpenCV University" },
  description: "Image processing and computer vision with OpenCV, from zero to production.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1419" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <header className="site-header">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            OpenCV University
          </Link>
          <span className="site-tag">Internal training · Phase 0 preview</span>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
