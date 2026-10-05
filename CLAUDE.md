# CLAUDE.md: rules for working on OpenCV University

Source of truth: `OPENCV_UNIVERSITY_SPEC.md`. Read it before any task. This file is the short form of Sections 2, 3, 7 and 8.

## Pinned versions

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22 LTS (tested 22.22.0) | `.nvmrc`; `engines` >=22.12 <23 |
| npm | 10.9.x | workspaces; root lockfile |
| Next.js | 16.3.8 | App Router, Turbopack |
| React / React DOM | 19.3.0 | |
| TypeScript | 5.9.3 | |
| @next/mdx, @mdx-js/loader, @mdx-js/react | 16.3.8, 3.1.1, 3.1.1 | MDX chapters |
| remark-gfm | 4.0.1 | tables in MDX |
| OpenCV (Python labs and chapter code) | **4.13.0** via `opencv-python==4.13.0.92` | all chapter code must run on this |
| NumPy | 2.5.x (tested 2.5.3) | |
| OpenCV.js | 4.13.0 (`https://docs.opencv.org/4.13.0/opencv.js`) | Phase 1; TODO: verify build URL when integrating |
| OpenCV docs to cite | `https://docs.opencv.org/4.13.0/` | match the pinned version |

Do not change a version without asking.

## Commands

```
npm install            # once
npm run dev            # http://localhost:3000
npm run lint:content   # every chapter follows the chapter shape below
npm test               # unit tests (node:test)
npm run check          # lint + tests + production build: run before handing back
npm run images         # regenerate sample images (needs opencv-python 4.13.0.92)
python scripts/verify_chapter_code.py <chapter.mdx>   # run chapter code, compare with printed Output blocks
```

## Repo map

- `content/<part>/<NN-module>/module.json` + `<n.m-slug>.mdx`: chapters. `content/course.json`: parts and module order.
- `content/_templates/chapter.mdx`: copy this to start a chapter.
- `apps/web`: Next.js app. Figures in `components/figures`, chapter template parts in `components/chapter`, pure logic in `lib` (unit-tested).
- `scripts/`: content index builder (also copies `assets/images` to `public/images`) and content linter.
- `assets/images/`: sample images; every one listed in `SOURCES.md` with source and licence.
- `services/api` (Phase 2), `services/labs` (Phase 3): placeholders.

## Writing style (every chapter)

Simple first, then deep. Professional tone.

1. Open with a one-line definition: "X = plain-language meaning".
2. A plain analogy before any technical term.
3. A flow diagram (`<Flow>`) from input to output.
4. Real numbers: show actual pixel values before and after.
5. One idea per paragraph. Short sentences. Explain jargon immediately.
6. A step-by-step worked example on a tiny image (3×3 or 5×5) the reader can do by hand.
7. Code only after understanding: NumPy from scratch first, then the OpenCV call.
8. Maths, edge cases and theory go in Go deeper, so beginners can stop.
9. Every claim about an algorithm, standard or paper is correct and cited.
10. Emoji only as markers: ⚠️ common mistakes, 🔍 Go deeper, ✅ Check yourself.

## Chapter shape (owner decision, 5 Oct 2026; supersedes spec Section 3; the linter enforces it)

Reference chapter: `content/part-a/01-introduction/1.1-what-is-image-processing.mdx`.

1. `# n.m Title` then `<Definition term="X">…</Definition>`
2. **Lesson**: `## 1. …`, `## 2. …` numbered consecutively. The teaching flow, simple first: analogy, pictures, real pixel numbers, a worked example, industrial context. At least one interactive figure.
3. Optional unnumbered `## What you should remember …` summary, then optional `## Mini exercise` with answers inside `<Solution>`
4. **Reference tail**, these headings exactly, in this order:
   - `## Code`: NumPy from scratch, then OpenCV; explain every parameter; paste real output
   - `## OpenCV API notes`: signature, parameters, dtype/channels, output, defaults, speed tips
   - `## Where it fails`: limits and what to use instead
   - `## ⚠️ Common mistakes`
   - `## 🔍 Go deeper`: body inside `<GoDeeper>`
   - `## ✅ Check yourself`: `<Quiz>` with 3 to 6 questions and explanations
   - `## Exercises`: 2 to 4, at least one `(coding)`; each answer inside `<Solution>`
   - `## References`: textbooks, papers, OpenCV docs (pinned version)

**Visuals, not text art.** Draw with components, never ASCII boxes:
`Flow` (pipelines; tones world/data/process/result), `PixelMatrix` (shaded number grids), `MatrixTransform` (before → rule → after), `IndexedGrid` (grid with row/column labels, coords, highlights, out-of-bounds), `CoordAxes` (image x/y frame with points), `SizeDiagram` (width × height), `Equation` (labelled calculation), `ShapeTuple` (annotated `image.shape`), `PixelValue` (gray value or B,G,R), `ChannelStack`, `IntensityScale`, `BitBuilder`, `PixelMath` (one value, several operations), `ColorPixel`, `RoiSketch`, `RodBundle`, `Glossary`, `SwatchRow` (gray/colour swatches), `ColorMix` + `AdditiveMix` (light mixing), `BitBar`, `ColorGrid`, `ChannelOrder` + `ChannelSwap` (RGB/BGR boxes, indices), `WeightBars`, `VsTable` (two-column comparison), `Nested` (boxes in boxes), `SceneSketch`, `DotGrid`, `Arrow` (connector between stacked figures), `Footprint` (point / neighbourhood / global footprint), `MiniHistogram`, `KernelGrid`, `DimSketch` (part with dimension arrows), `Conveyor` (`part` prop), `CrackSketch`, `DetectSketch` (boxes with labels), `TrackSketch`, `LabelPlate`, `LightPath` (source → object → eye/camera), `OpenSensor` (no optics), `PinholeDiagram`, `GateSketch`, `PerspectiveSketch`, `SensorGrid`, `CameraChain` (icon steps, world → numbers), `LensRays`, `ControllerSketch`, `FocalSketch`, `DistanceFocus`, `FovCone`, `WdSketch`, `SensorSizes`, `FocusDiagram`, `PupilSketch`, `WindowSketch`, `ApertureRow` (openings to scale), `ApertureCompare`, `DofRow` (sharp / blurred objects), `DepthObject`, `WaveSlit`, `IrisSketch`, `Columns` (+ `stack`) + `Panel`, `Chips`, `Tree`, `Takeaways` + `Takeaway`, `Callout`, plus the interactive `PixelGrid`, `ImageCompare`, `IndexExplorer`, `RgbMixer`, `TaskSorter` (`kinds` prop for custom categories), `NeighborhoodLab` `ScaleCalc` (pixels → mm) and `PinholeLab` (x = f·X/Z; `hole` prop adds the hole-size trade-off), `FocusLab` (thin lens: focus vs object distance, blur circle in px) `LensFov` (lens + sensor + WD → field of view, mm per pixel) and `ApertureLab` (f-number → light, DOF, diffraction, sweet spot). Panel tones: a (blue), b (purple), c (green), d (amber), good, warn. Short ```text blocks are fine for formulas.

Chapter `meta` export holds `title`, `number`, `objectives`, `minutes`.

## Sources

Gonzalez & Woods *Digital Image Processing* 4th ed.; Szeliski *Computer Vision* 2nd ed.; OpenCV docs 4.13.0; original papers for named algorithms; EMVA 1288 for sensors.
Never invent citations, numbers or API parameters. If unsure, write `TODO: verify`.
Check API claims by running the code on the pinned OpenCV; paste real output.

## Phases and definition of done

- Phase 0 (now): scaffold, chapter template, PixelGrid, ImageCompare, Quiz, Chapter 1.1. Owner approves 1.1 as the reference.
- Phase 1: course map, reader, search, glossary, theme toggle, mobile, OpenCV.js, all Part A.
- Phase 2+: backend (login, progress, quiz results, trainer view); one part every 2 to 3 weeks.
- Phase 3: code labs and assessments.

A chapter is done when: it follows the chapter shape (linter passes); every figure works on desktop and phone; all code runs on OpenCV 4.13.0 and output matches the text; references are real and checked; a team reviewer approved it.

## How to work

- One chapter or one component per task, then stop for review.
- Before writing a chapter, list learning objectives and an outline.
- Run `npm run check` after every change; never leave the build broken.
- Ask before adding a dependency or changing the architecture.
- Mark anything uncertain `TODO: verify`; never guess facts.
- Do not build product-only features (sign-up, billing) now.
