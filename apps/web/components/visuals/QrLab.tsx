"use client";

import { useEffect, useState } from "react";
import { useGrays, GrayView, Seg } from "./lab-kit";

type Result = { image: string; decoded: string };
type Data = { levels: string[]; fracs: number[]; results: Record<string, Record<string, Result>> };

/** QrLab (Module 38.4): real cv2.QRCodeDetector decode results on a real cv2.QRCodeEncoder QR code,
 *  at error-correction level L or H, with increasing simulated centre damage. Precomputed by
 *  scripts/gen_qr_data.py (images themselves generated in assets/images/generate_samples.py). */
export function QrLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [level, setLevel] = useState("H");
  const [frac, setFrac] = useState("20");

  useEffect(() => {
    fetch("/data/qr-data.json").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const result = data?.results[level]?.[frac];
  const g = useGrays(result ? [`/images/${result.image}`] : [])?.[0];

  if (!data || !result || !g) return <p>Loading…</p>;

  return (
    <figure className="fig lklab">
      <Seg label="Correction level" opts={data.levels.map((l) => [l, l === "L" ? "L (~7%)" : "H (~30%)"] as [string, string])} v={level} set={setLevel} />
      <Seg label="Centre damage" opts={data.fracs.map((f) => [String(f), `${f}%`] as [string, string])} v={frac} set={setFrac} />
      <GrayView d={g.d} w={g.w} h={g.h} scale={1} label={result.image} />
      <p className="lk-read">
        cv2.QRCodeDetector result: {result.decoded ? <><b>&quot;{result.decoded}&quot;</b> — decoded correctly.</> : <><b>failed to decode</b> — damage exceeded this level's correction budget.</>}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
