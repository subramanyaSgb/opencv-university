export const THEMES = ["auto", "light", "dark", "sepia"] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "ocu-theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

export function readStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isTheme(raw) ? raw : "auto";
  } catch {
    return "auto";
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private mode, etc.): the in-memory choice still applies this session
  }
}

export function applyTheme(theme: Theme): void {
  if (theme === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

/** Inlined into `<head>` so the stored theme applies before first paint (no flash). */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t === 'light' || t === 'dark' || t === 'sepia') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;
