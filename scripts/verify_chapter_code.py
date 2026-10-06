"""Run every ```python block in a chapter and compare printed output with the
```text block that follows "Output:". Definition of done, item 3.

Usage (with opencv-python 4.13.0.92 installed):
    python scripts/verify_chapter_code.py content/part-a/01-introduction/1.1-what-is-image-processing.mdx

Only blocks from the "## Code" section onward are run (lesson snippets are illustrative).
Blocks run in order in one namespace (later blocks may use earlier variables),
inside a temporary folder that holds a copy of assets/images/generated/* and assets/videos/generated/*.
Blocks whose first line starts with "# Needs a desktop" (GUI windows, cameras), "# Needs a CUDA" or
"# Needs a GPU" (CUDA builds, OpenCL devices) or any other "# Needs …" marker (a model file to download) are skipped.
Blocks whose first line starts with "# Needs opencv-contrib" run only when the contrib modules are
installed (opencv-contrib-python-headless==4.13.0.92); otherwise they are skipped with a note.
"""
import contextlib
import io
import re
import shutil
import sys
import tempfile
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parent.parent


def main(chapter: str) -> int:
    src = Path(chapter).resolve().read_text(encoding="utf-8")
    m = re.search(r"^## Code\s*$", src, re.M)
    if not m:
        print("no '## Code' section found")
        return 1
    src = src[m.start():]
    blocks = list(re.finditer(r"```(\w+)\n(.*?)```", src, re.S))
    ns: dict = {}
    checked = failed = 0
    print(f"OpenCV {cv2.__version__}")
    with tempfile.TemporaryDirectory() as tmp:
        for f in (ROOT / "assets/images/generated").glob("*"):
            shutil.copy(f, tmp)
        for f in (ROOT / "assets/videos/generated").glob("*"):
            shutil.copy(f, tmp)
        with contextlib.chdir(tmp):
            for i, b in enumerate(blocks):
                if b.group(1) != "python":
                    continue
                first = b.group(2).lstrip().splitlines()[0]
                if first.startswith("# Needs ") and not first.startswith("# Needs opencv-contrib"):
                    print(f"SKIP  ({first[2:40]}) {b.group(2).strip().splitlines()[1][:50]}")
                    continue
                if b.group(2).lstrip().startswith("# Needs opencv-contrib") and not hasattr(ns.get("cv2") or __import__("cv2"), "ximgproc"):
                    print(f"SKIP  (needs opencv-contrib) {b.group(2).strip().splitlines()[1][:50]}")
                    continue
                buf = io.StringIO()
                with contextlib.redirect_stdout(buf):
                    exec(b.group(2), ns)
                nxt = blocks[i + 1] if i + 1 < len(blocks) else None
                between = src[b.end(): nxt.start()] if nxt else ""
                if not (nxt and nxt.group(1) == "text" and "Output:" in between and len(between) < 40):
                    continue
                checked += 1
                expected, got = nxt.group(2).strip(), buf.getvalue().strip()
                first = b.group(2).strip().splitlines()[0][:60]
                if expected == got:
                    print(f"OK    {first}")
                else:
                    failed += 1
                    print(f"FAIL  {first}\n--- expected\n{expected}\n--- got\n{got}")
    print(f"{checked} output block(s) checked, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))
