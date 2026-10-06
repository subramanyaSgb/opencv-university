"use client";

import { useEffect, useState } from "react";
import { Seg } from "./lab-kit";

type DbEntry = { name: string; label: string; kp: number; hist: number[] };
type Query = { name: string; label: string; kp: number; hist: number[]; sims: Record<string, number> };
type Data = { vocabSize: number; db: DbEntry[]; queries: Record<string, Query> };

function HistBars({ hist, max }: { hist: number[]; max: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: "3em" }}>
      {hist.map((v, i) => (
        <div key={i} title={`word ${i}: ${v.toFixed(3)}`} style={{ width: 4, height: `${Math.max(2, (v / max) * 100)}%`, background: "#3aa0ff" }} />
      ))}
    </div>
  );
}

/** BowLab (Module 35.6): bag-of-visual-words histograms (precomputed with cv2.SIFT_create +
 *  cv2.BOWKMeansTrainer + cv2.BOWImgDescriptorExtractor on 5 database images) and retrieval ranking
 *  for a chosen query, by cosine similarity between histograms. */
export function BowLab({ caption }: { caption?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [query, setQuery] = useState<string>("sample-poster-b.png");

  useEffect(() => {
    fetch("/data/bow-data.json").then((r) => r.json()).then((j: Data) => { setData(j); setQuery(Object.keys(j.queries)[0]); }).catch(() => {});
  }, []);

  if (!data) return <p>Loading…</p>;
  const q = data.queries[query];
  const ranked = data.db.map((d) => ({ ...d, sim: q.sims[d.name] })).sort((a, b) => b.sim - a.sim);
  const maxBin = Math.max(...data.db.flatMap((d) => d.hist), ...q.hist);

  return (
    <figure className="fig lklab">
      <Seg label="Query" opts={Object.keys(data.queries).map((k) => [k, data.queries[k].label] as [string, string])} v={query} set={setQuery} />
      <p className="lk-read">Query: <b>{q.label}</b> ({q.kp} SIFT keypoints). Vocabulary: {data.vocabSize} visual words (k-means on the database's descriptors, 27.2).</p>
      <p className="lk-read">Query histogram:</p>
      <HistBars hist={q.hist} max={maxBin} />
      <div className="lk-wrap">
        <table className="lk-table">
          <thead><tr><th>Rank</th><th>Database image</th><th>Keypoints</th><th>Cosine similarity</th><th>Histogram</th></tr></thead>
          <tbody>
            {ranked.map((d, i) => (
              <tr key={d.name}>
                <td>{i + 1}</td><td style={{ textAlign: "left" }}>{d.label}</td><td>{d.kp}</td><td>{d.sim.toFixed(4)}</td>
                <td><HistBars hist={d.hist} max={maxBin} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
