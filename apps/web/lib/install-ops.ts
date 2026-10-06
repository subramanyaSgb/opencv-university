// Which OpenCV Python package to install, for InstallPicker (Chapter 7.1). Unit-tested.

export type Needs = { gui: boolean; contrib: boolean; cuda: boolean; version: string };
export type Advice = { pkg: string; command: string; notes: string[] };

export function advise(n: Needs): Advice {
  const name = `opencv${n.contrib ? "-contrib" : ""}-python${n.gui ? "" : "-headless"}`;
  const notes: string[] = [];
  notes.push("Install exactly one of the four opencv-* packages in an environment; they all provide the same cv2 module and overwrite each other.");
  if (!n.gui) notes.push("Headless: no cv2.imshow / waitKey windows. Use matplotlib (6.5) or save images. Best for servers, Docker and CI.");
  if (n.gui) notes.push("Includes the HighGUI window functions (imshow, waitKey, trackbars, mouse callbacks); needs a desktop.");
  if (n.contrib) notes.push("Contrib adds extra modules (ximgproc, xfeatures2d, aruco extras, text …). Only the main modules are supported in all builds.");
  if (n.cuda) notes.push("The pip wheels are built without CUDA: cv2.cuda exists but finds 0 devices. For GPU support build OpenCV from source with CUDA (8.5) or use a vendor/conda build.");
  const pin = n.version.trim() ? `==${n.version.trim()}` : "";
  return { pkg: name, command: `pip install "${name}${pin}"`, notes };
}
