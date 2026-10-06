/** Upgrade checker data for Chapter 8.10, from probing the pip wheels 4.13.0.92 and 5.0.0.93 (main and contrib). */
export type Status = "ok" | "contrib" | "check" | "missing";
export interface Feature { key: string; label: string; v4: Status; v5: Status; v5contrib: Status; note: string }

export const FEATURES: Feature[] = [
  { key: "core", label: "imread, cvtColor, GaussianBlur, threshold, findContours", v4: "ok", v5: "ok", v5contrib: "ok", note: "Core image processing keeps its Python names." },
  { key: "aruco", label: "ArUco markers (cv2.aruco)", v4: "ok", v5: "ok", v5contrib: "ok", note: "Still in objdetect." },
  { key: "calib", label: "calibrateCamera, solvePnP, findHomography, StereoSGBM", v4: "ok", v5: "ok", v5contrib: "ok", note: "Same Python names; in C++ calib3d is split into calib, geometry and stereo modules (new headers)." },
  { key: "feat", label: "SIFT, ORB, BFMatcher", v4: "ok", v5: "ok", v5contrib: "ok", note: "Same Python names; the C++ module features2d is now called features." },
  { key: "ml", label: "cv2.ml (SVM, k-NN, decision trees)", v4: "ok", v5: "contrib", v5contrib: "ok", note: "ml moved to opencv_contrib in 5.0: install opencv-contrib-python." },
  { key: "gapi", label: "G-API (cv2.gapi, GComputation)", v4: "ok", v5: "contrib", v5contrib: "ok", note: "gapi moved to opencv_contrib in 5.0." },
  { key: "cascade", label: "CascadeClassifier (Haar), HOGDescriptor", v4: "ok", v5: "contrib", v5contrib: "ok", note: "Moved to contrib (xobjdetect) in 5.0; DNN detectors are the recommended replacement." },
  { key: "dnn", label: "cv2.dnn.readNet + forward on the CPU", v4: "ok", v5: "check", v5contrib: "check", note: "Works; 5.0 adds an engine argument and uses the new engine by default (ENGINE_AUTO falls back to the classic one). Re-validate outputs." },
  { key: "dnncuda", label: "cv2.dnn with CUDA or OpenCL targets", v4: "ok", v5: "check", v5contrib: "check", note: "The new 5.0 engine is CPU-only; GPU backends use the classic engine (engine=cv2.dnn.ENGINE_CLASSIC)." },
  { key: "umat", label: "cv2.UMat / OpenCL", v4: "ok", v5: "ok", v5contrib: "ok", note: "Present in both." },
  { key: "cpp", label: "C++ code built with C++11 or C++14", v4: "ok", v5: "check", v5contrib: "check", note: "OpenCV 5 requires C++17; update the compiler flags." },
];

export function status(f: Feature, target: "4.13" | "5.0", contrib: boolean): Status {
  if (target === "4.13") return f.v4;
  return contrib ? f.v5contrib : f.v5;
}

export function summary(keys: string[], target: "4.13" | "5.0", contrib: boolean) {
  const fs = FEATURES.filter((f) => keys.includes(f.key));
  const count = (s: Status) => fs.filter((f) => status(f, target, contrib) === s).length;
  return { ok: count("ok"), contrib: count("contrib"), check: count("check"), missing: count("missing") };
}
