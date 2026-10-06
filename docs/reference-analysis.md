# Reference analysis: claudecertificationguide.com

Researched 2026-10-06 against the live site at 1440×1000 and 390×900, light and dark
themes (the site has both; dark is default, a moon/sun toggle in the top bar switches).
Screenshots captured, computed styles extracted via `getComputedStyle` across every
visible element on the home page, `/learn`, a part page (`/learn/1-agentic-architecture`)
and a lesson page (`/learn/1-agentic-architecture/1-1-agentic-loops`). Raw audit JSON kept
alongside screenshots for reference during implementation.

This is analysis only — nothing here is copied (no text, logo, brand, or exact colors).
The point is to extract *why it reads as professional* and build our own system from that.

## 1. Token table (as measured)

### Color — dark theme (default)

| Role | Value | Notes |
|---|---|---|
| Page background | `#1a120f` | Warm near-black, not pure black |
| Header/nav background | `#0f0f14` at 92% opacity over page bg | Slightly cooler than page bg, blurred |
| Card/surface background | `#312926` at ~50% opacity | Warm dark gray |
| Primary text | `#eee2dd` | Warm off-white, not pure white |
| Secondary text | `#d1c6c1` | Muted warm gray |
| Pure white (headings sometimes) | `#ffffff` | Used sparingly for emphasis |
| Accent / primary | `#c98969` (terracotta) and `#ffb494` (peach, lighter variant) | Used for CTA fill, link color, active states, module dots, glow shadows |
| Accent-on-accent text | `#4e1d09` | Dark brown text on the peach/terracotta banner and buttons |
| Hairline border | `rgba(82, 66, 61, 0.1)` | ~10% opacity warm gray — true hairline |
| Stronger border | `rgba(82, 66, 61, 0.3–0.4)` | Used for emphasis borders (e.g. dropdown, outlined button) |

### Color — light theme

| Role | Value | Notes |
|---|---|---|
| Page background | `#fafaf9` | Warm near-white, not pure white |
| Primary text | `#181b18` | Warm near-black, not pure black |
| Accent | Same terracotta family, values shifted for AA contrast on light bg | Accent hue is stable across themes; only the specific shade changes |
| Announcement banner | Stays peach/tan in both themes | One deliberately "branded" surface that doesn't follow the theme |

### Typography

| Role | Family | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| H1 (hero) | Newsreader (serif) | 72px | 700 | 72px (1.0) | -1.8px |
| H1 (lesson) | Newsreader (serif) | 48px | 700 | 48px (1.0) | -1.2px |
| H2 | Newsreader (serif) | 30px | 700 | 36px (1.2) | normal |
| H3 | Newsreader (serif) | 20px | 700 | 27.5px (1.375) | normal |
| Body | Inter (sans) | 16px | 400 | 24px (1.5) | normal |
| Small / meta | Inter (sans) | 14px | 400–600 | 19px (1.375) | normal |
| Eyebrow / micro-label | Inter, mono-styled via class | 10–12px | 400–600 | — | 0.64–1.1px (tracking-widest) |

Two families only: a serif (Newsreader) for all headings, Inter for everything else,
including small uppercase labels set in Inter with wide tracking rather than a true
monospace — the "mono" look on labels like `ALL CERTS` and `DOMAIN 1` comes from
letter-spacing + uppercase, not a different typeface.

### Radius, shadow, spacing

| Token | Value | Notes |
|---|---|---|
| Default radius | `2px` (Tailwind `rounded-sm`) | Nearly square — cards, buttons, inputs |
| Pill radius | `9999px` | Only for small dots/badges, never for cards |
| Occasional | `4px` | A handful of elements (banner dismiss button) |
| Card shadow | `0 10px 15px -3px / 0 4px 6px -4px`, color `rgba(0,0,0,0.1)` | Very subtle, neutral |
| CTA shadow | Same shape, tinted `rgba(201,137,105,0.2)` (accent color) | Only the primary CTA gets a colored glow |
| Border width | 1px everywhere observed | No thick borders |

Two shadow tiers total, exactly as a restrained system should have. Radius is almost
flat — this reads more "technical/engineering" than "soft app UI."

### Layout

- No CSS `max-width` on `<main>` itself at 1440px (full-bleed container), but content is
  visually bounded by inner padding/columns — a classic Tailwind `container` + grid
  pattern, not a single global max-width.
- Sidebar: ~256–280px, fixed, present on `/learn` and lesson pages, not on home.
- Lesson reading column: comfortably under 70ch, right-aligned nothing (no right rail on
  this particular reference — unlike our own TOC rail).
- Mobile (390px): sidebar collapses behind a hamburger; top bar keeps wordmark, a
  filter dropdown, and the theme toggle; content goes full-width single column.

## 2. Component inventory

- **Announcement banner** — full-width strip above the header, doesn't follow theme,
  dismiss button top-right.
- **Top bar** — serif wordmark (acts as home link) · nav links (Curriculum/Practice/
  Reference/Journal, current underlined in accent) · a filter dropdown (`ALL CERTS`,
  bordered, mono-tracked label) · primary CTA button (accent fill, colored shadow) ·
  icon-only theme toggle.
- **Sidebar, grouped by task** — "Study Tools" (Progress Dashboard, Drill Mode),
  "Curriculum" (numbered parts, each with a small colored dot, collapsible, current
  expanded with numbered lesson rows inside), "Look Up" (Quick Reference, Glossary).
  Group labels are uppercase micro-labels.
- **Part/module card** — colored dot + weight percentage top row, serif title, one-line
  description, "`NN` MODULES" count + arrow, bottom-right. 1px border, flat, no shadow
  at rest.
- **Lesson row** (inside an expanded part) — number · title · arrow, hairline divider
  between rows, no border/card around each row.
- **Breadcrumb** — uppercase, mono-tracked, slash-separated: `LEARN / AGENTIC
  ARCHITECTURE & ORCHESTRATION / 1.1`.
- **Lesson meta row** — a filled pill tag (`DOMAIN 1`, accent-colored background) + plain
  text (`TASK 1.1`) on the left, an outlined "Mark Complete" button on the right.
- **Mode tabs** — a bordered bar with a 2px accent left border (not a full outline),
  containing 3–4 plain-text links (e.g. "Learn this interactively | Concept Check |
  Exam Sim | Build Coach"), active one colored. This is the closest thing to our
  "key idea" callout treatment — an accent left bar, no fill, no card nesting.
- **Inline code** — dark chip, monospace, small radius, used inline in prose for field
  values like `stop_reason`.
- **Numbered/bulleted lists** — plain, serif-free (Inter), generous line-height.

## 3. Ten observations on why it reads professional

1. **Every list item carries data, never a bare title.** Part cards show weight %,
   lesson count, description. Lesson rows show number + title. Nothing is just a link.
2. **One accent, used everywhere consistently, never competing with a second color.**
   Terracotta/peach is the only hue beyond neutrals — buttons, links, active states,
   module dots (wait: module dots are actually multi-colored per module — the one
   deliberate exception, used purely as a categorical index, not as semantic/status
   color).
3. **Near-flat radius (2px) reads "engineering/technical," not "consumer app."** Rounder
   UI (8px+) reads softer/friendlier; this product wants to read rigorous.
4. **Warm neutrals instead of true black/white or cool gray.** `#1a120f`/`#eee2dd` and
   `#fafaf9`/`#181b18` feel designed, not default — avoids the common "AI slop" tell of
   pure `#000`/`#fff` with a cool gray scale.
5. **Serif headings against sans body creates immediate hierarchy** without needing
   color or weight tricks — you always know what's a heading at a glance.
6. **Hairline borders (~10% opacity), not medium-gray borders.** Borders are barely
   there; separation comes from spacing and the border being *present but quiet*.
7. **Shadow is almost absent, and the one place it appears (primary CTA) is tinted with
   the accent, not generic black.** This makes the one shadow feel intentional rather
   than decorative.
8. **Microcopy is specific, not marketing filler.** "60 questions in 120 minutes, $125
   USD, pass mark 720/1000, valid 12 months" — real, checkable facts, not "boost your
   skills today."
9. **The sidebar is organized by what the user is trying to do** (Study Tools / Curriculum
   / Look Up), not by content type alone — task-oriented information architecture.
10. **Density without clutter**: a lot of data per row (dot, %, title, description, count,
    arrow) but strict left-alignment and consistent column positions make it scannable,
    not noisy.

## 4. Our tokens, derived (not copied)

Deliberately different from the reference where the brief asks for it:

- **Accent hue: indigo, not terracotta.** We already use `#4338ca` (light) / `#9aa5ff`
  (dark) from the last redesign pass — distinct hue family from the reference's
  orange/coral, keeps our own identity, already AA-checked against our surfaces.
- **Warm neutral surfaces, adapted.** We adopt the *principle* (warm near-black/near-white
  rather than true black/white or cool slate) but with our own values, paired with
  indigo rather than terracotta so warm neutrals don't read as "trying to be the same
  product."
- **Serif headings / sans body**, same structural idea, different pairing: proposing
  **Newsreader is the one font actually confirmed to read well at display sizes with
  this kind of tight -1.2 to -1.8px tracking**, but to stay clearly distinct, I'd propose
  **Source Serif 4** (already named as an option in this repo's own CLAUDE.md as a body
  serif choice) for headings instead, keeping Inter for body — same two-family structure,
  different serif.
- **Radius: 4px default, not 2px.** Closer to brief 1's "engineering handbook" instinct,
  still far flatter than our current 8px, still clearly distinct from the reference's 2px.
- **Hairline borders at ~10% opacity**, adopted directly — this is a technique, not a
  brand color, safe to take as-is.
- **Max two shadow levels**, one tinted with our own accent for primary CTAs only —
  adopted as a rule, not copied value-for-value.

Proposed token values: see `docs/proposed-tokens.css` (draft, not wired into
`globals.css` yet).

## 5. What we will NOT copy

- The terracotta/peach accent hue itself.
- The exact Newsreader + Inter pairing (proposing Source Serif 4 instead, see above).
- Any text, the "Claude Certified" wordmark/logo, or brand-specific copy.
- The exact 2px radius value (we'll use 4px) or exact color hex values.

## Screenshots

Saved under this research session's scratch directory (not committed — regenerate via
the same headless-Edge CDP technique if needed for a future comparison):
`ref_home_w1440`, `ref_home_w390`, `ref_learn_w1440`, `ref_learn_w390`,
`ref_course_w1440`, `ref_course_w390`, `ref_lesson_w1440`, `ref_lesson_theme_toggled`
(light mode), `ref_lesson_w390`, next to our own `v2_styleguide` /
`v2_styleguide_light` for side-by-side comparison.
