# OpenCV University

Internal training platform for image processing and computer vision with OpenCV.
Spec: `OPENCV_UNIVERSITY_SPEC.md`. Working rules and pinned versions: `CLAUDE.md`.

## Run it (Windows, macOS or Linux)

Needs **Node.js 22 LTS** (https://nodejs.org).

```
cd opencv-university
git init -b main     # first time only
npm install
npm run dev
```

Open http://localhost:3000 and choose **1.1 What is image processing?**
(direct link: http://localhost:3000/learn/part-a/01-introduction/1.1-what-is-image-processing).
Stop the server with Ctrl+C.

## Put it on GitHub and Vercel

1. On github.com, create an **empty** repository (for example `opencv-university`, Private). Do not add a README or .gitignore.
2. Double-click `push-to-github.bat` and paste the repository URL when asked. Run it again after every change; it commits and pushes.
3. On vercel.com: **Add New → Project → Import** the repository, then set:
   - **Root Directory:** `apps/web`
   - Framework preset: Next.js (detected automatically). Leave build and install commands at their defaults.
   - Node.js version: 22.x (Project Settings → Build and Deployment, if it is not picked up automatically).
4. Deploy. Every later push redeploys automatically.

## Checks

```
npm run check                 # content linter + unit tests + production build
python scripts/verify_chapter_code.py content/part-a/01-introduction/1.1-what-is-image-processing.mdx
```

The Python check needs `pip install opencv-python==4.13.0.92` (Python 3.11+).

## Status

Phase 0: scaffold, chapter template, PixelGrid, ImageCompare, Quiz, Chapter 1.1. Awaiting owner review.
