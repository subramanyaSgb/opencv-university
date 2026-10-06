"use client";

import { useState } from "react";
import { explain, FILES, FLAGS, TABLE, type File, type Flag } from "@/lib/imread-table";

/** ImreadLab: four kinds of files × six imread flags → shape, dtype, max (measured on OpenCV 4.13.0). */
export function ImreadLab({ caption }: { caption?: string }) {
  const [file, setFile] = useState<File>("gray16.png");
  const [flag, setFlag] = useState<Flag>("IMREAD_COLOR (default)");
  const [shape, dtype, max] = TABLE[file][flag];
  return (
    <figure className="fig imreadlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full"><span>File</span>
          <div className="seg seg-small" role="radiogroup" aria-label="File">
            {(Object.keys(FILES) as File[]).map((f) => <button key={f} type="button" role="radio" aria-checked={file === f} className={file === f ? "is-on" : ""} onClick={() => setFile(f)}>{FILES[f]}</button>)}
          </div>
        </div>
        <div className="ctl ctl-full"><span>Flag</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Flag">
            {FLAGS.map((f) => <button key={f} type="button" role="radio" aria-checked={flag === f} className={flag === f ? "is-on" : ""} onClick={() => setFlag(f)}>{f}</button>)}
          </div>
        </div>
      </div>
      <code className="ip-cmd">img = cv2.imread("{file}"{flag === "IMREAD_COLOR (default)" ? "" : `, cv2.${flag.startsWith("COLOR |") ? "IMREAD_COLOR | cv2.IMREAD_IGNORE_ORIENTATION" : flag}`})</code>
      <ul className="ap-stats">
        <li><span>img.shape</span><strong>({shape.join(", ")})</strong><em>{shape.length === 3 ? `${shape[2]} channels` : "1 channel (2-D)"}</em></li>
        <li><span>img.dtype</span><strong>{dtype}</strong><em>img.max() = {max}</em></li>
      </ul>
      <div className="pg-readout" aria-live="polite"><span>{explain(file, flag)}</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
