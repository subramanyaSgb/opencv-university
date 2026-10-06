// Pure chapter checks used by scripts/lint-content.mjs (spec Sections 3 and 7).

// Chapter shape (owner decision, 5 Oct 2026; supersedes spec Section 3):
//   # n.m Title + <Definition>
//   ## 1. … ## N. …          numbered lesson sections (the teaching flow)
//   ## What you should remember …   optional, unnumbered summary
//   ## Mini exercise …        optional
//   then the fixed reference tail below, in this order.
export const TAIL_SECTIONS = [
  "Code",
  "OpenCV API notes",
  "Where it fails",
  "⚠️ Common mistakes",
  "🔍 Go deeper",
  "✅ Check yourself",
  "Exercises",
  "References",
];

const LESSON = /^(\d+)\. \S/;
const MINI = /^Mini exercise/;
const REMEMBER = /^What you should remember/;
const FIGURES = /<(PixelGrid|ImageCompare|BitBuilder|IndexExplorer|RgbMixer|TaskSorter|NeighborhoodLab|ScaleCalc|PinholeLab|FocusLab|LensFov|ApertureLab|FovPlanner|SensorLab|MotionLab|BayerLab|IspLab|ShutterLab|LineScanLab|SamplingLab|QuantLab|ChannelLab|CoordLab|AliasLab|ConnectivityLab|SizeCalc|CompressLab|DctLab|PackLab|GopLab|BitPlaneLab|MatrixLab|TransformLab|HomographyLab|GaussLab|DerivLab|FitLab|PcaLab|BayesLab|ArrayLab|SliceLab|OverflowLab|BroadcastLab|ImshowLab|InstallPicker|ImreadLab|ColorOrderLab|CaptureLab|DrawLab|TunerLab|BudgetLab|MatLab|BindingLab|GpuLab|BlobLab|GraphLab|JsMemLab|VersionLab|AcuityLab|WeberLab|ContrastLab|CvdLab|ColormapLab|ChromaLab|HsvLab|DeltaELab|YccLab|GrayLab|WbLab|InRangeLab|CurveLab|HistLab|BackProjLab|ThreshLab|MaskLab|ArithLab|BlendLab|DiffLab|PipeLab|IllumLab|OcrLab|LetterboxLab|AugLab|WarpLab|RectifyLab|InterpLab|PolarLab|ConvLab|SepLab|IntegralLab|DenoiseLab|RestoreLab|PyramidLab|RegisterLab|EdgeLab|MorphLab|ContourLab|LabelLab|HoughLab|SegmentLab|ActiveContourLab|ShapeLab|FourierLab|BasisLab|MatchLab|FeatureLab|DescLab|LbpLab|GlcmLab|HogLab|HaarLab|HashLab|BowLab|FeatureSpaceLab|GaussNbLab|KnnLab|SvmLab|TreeLab|BoostLab|PcaReduceLab|ClusterLab|WindowLab|CascadeLab|HogSvmLab|NmsLab|FaceDetectLab|FaceRecLab|ArucoLab|CharSegLab|OcrEngineLab|QrLab|FpsLab|RtspLab|BackendLab|HwDecodeLab|LatencyBudgetLab|SyncLab|StabilizeLab|BlobCountLab|BgSubLab|FlowLab|CamShiftLab|KalmanLab|ParticleLab|CountLab|CameraMatrixLab|DistortionLab|CalibLab|PnPLab|PixelToMMLab|BirdsEyeLab|HandEyeLab)\b/;

/** Remove fenced code blocks so headings inside code are ignored. */
export function stripFences(src) {
  return src.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, "");
}

/** Split the chapter into { h1, preamble, sections: [{ title, body }] }. */
export function parseChapter(src) {
  const text = stripFences(src);
  const lines = text.split("\n");
  let h1 = null;
  let preamble = [];
  const sections = [];
  let current = null;
  for (const line of lines) {
    const m1 = /^# (?!#)(.+)$/.exec(line);
    const m2 = /^## (?!#)(.+)$/.exec(line);
    if (m1) {
      if (h1 !== null) return { error: "more than one level-1 heading" };
      h1 = m1[1].trim();
    } else if (m2) {
      current = { title: m2[1].trim(), body: "" };
      sections.push(current);
    } else if (current) {
      current.body += line + "\n";
    } else if (h1 !== null) {
      preamble.push(line);
    }
  }
  return { h1, preamble: preamble.join("\n"), sections };
}

/** Return a list of { level: "error" | "warning", message }. */
export function lintChapter(src) {
  const issues = [];
  const err = (message) => issues.push({ level: "error", message });
  const warn = (message) => issues.push({ level: "warning", message });

  if (!/export const meta\s*=/.test(src)) err("missing `export const meta`");
  else for (const key of ["title", "number", "objectives", "minutes"]) {
    if (!new RegExp(`\\b${key}\\s*:`).test(src)) err(`meta is missing \`${key}\``);
  }

  const parsed = parseChapter(src);
  if (parsed.error) { err(parsed.error); return issues; }
  const { h1, preamble, sections } = parsed;

  // 1. Title and one-line definition
  if (!h1) err("missing title (`# n.m Title`)");
  else if (!/^\d+\.\d+ \S/.test(h1)) err(`title must start with the chapter number: "${h1}"`);
  if (!/<Definition\b/.test(preamble)) err("section 1: `<Definition>` must come right after the title");

  // Lesson: numbered 1..N, consecutive, before the tail
  const titles = sections.map((s) => s.title);
  let i = 0;
  let expected = 1;
  while (i < titles.length && LESSON.test(titles[i])) {
    const n = Number(LESSON.exec(titles[i])[1]);
    if (n !== expected) err(`lesson section "${titles[i]}" should be numbered ${expected}`);
    expected = n + 1;
    i++;
  }
  if (i === 0) err("no lesson sections: start with `## 1. …`");
  const lessonBody = sections.slice(0, i).map((s) => s.body).join("\n");
  if (i < titles.length && REMEMBER.test(titles[i])) i++;
  if (i < titles.length && MINI.test(titles[i])) i++;

  // Reference tail: exact titles, exact order
  const tail = titles.slice(i);
  const missing = TAIL_SECTIONS.filter((t) => !tail.includes(t));
  const extra = tail.filter((t) => !TAIL_SECTIONS.includes(t));
  for (const t of missing) err(`missing section "## ${t}"`);
  for (const t of extra) err(`unexpected level-2 section "## ${t}" (lesson sections must be numbered and come first)`);
  if (!missing.length && !extra.length && tail.join("|") !== TAIL_SECTIONS.join("|")) {
    err(`reference sections out of order: ${tail.join(" → ")}`);
  }

  const body = (t) => sections.find((s) => s.title === t)?.body ?? "";
  if (!FIGURES.test(lessonBody)) err("the lesson needs at least one interactive figure (PixelGrid, ImageCompare, BitBuilder or IndexExplorer)");
  if (!/<Flow\b/.test(lessonBody) && !/→|↓/.test(lessonBody)) err("the lesson needs a flow diagram (<Flow> or arrows)");
  // Code blocks are stripped from section bodies, so read the Code section from the raw source.
  const cStart = src.search(/^## Code\s*$/m);
  const cEnd = src.search(/^## OpenCV API notes\s*$/m);
  const code = cStart >= 0 && cEnd > cStart ? src.slice(cStart, cEnd) : "";
  if (!/import numpy/.test(code) || !/import cv2/.test(code)) err("Code must show NumPy first, then OpenCV");
  else if (code.indexOf("import numpy") > code.indexOf("import cv2")) err("Code: NumPy version must come before the OpenCV call");
  if (!/<GoDeeper\b/.test(body("🔍 Go deeper"))) err("Go deeper body must be inside `<GoDeeper>`");
  const quiz = body("✅ Check yourself");
  if (!/<Quiz\b/.test(quiz)) err("Check yourself needs a `<Quiz>`");
  const qCount = (quiz.match(/\bquestion\s*:/g) || []).length;
  if (qCount < 3 || qCount > 6) err(`Check yourself needs 3 to 6 questions (found ${qCount})`);
  const ex = body("Exercises");
  const solutions = (ex.match(/<Solution\b/g) || []).length;
  if (solutions < 2 || solutions > 4) err(`Exercises needs 2 to 4 exercises with <Solution> (found ${solutions})`);
  if (!/^### .*\(coding\)/m.test(ex)) err("Exercises needs at least one exercise titled with `(coding)`");
  const refs = (body("References").match(/^\s*(\d+\.|[-*]) /gm) || []).length;
  if (refs < 2) err("References needs at least 2 entries");

  const todos = (src.match(/TODO: verify/g) || []).length;
  if (todos) warn(`${todos} item(s) marked TODO: verify (needs human review)`);
  return issues;
}
