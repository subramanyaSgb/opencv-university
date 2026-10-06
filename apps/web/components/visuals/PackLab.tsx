"use client";

import { useState } from "react";
import { asStored16, hex, pack, type Layout } from "@/lib/pack-ops";

const LAYOUTS: { k: Layout; name: string; note: string }[] = [
  { k: "lsb16", name: "16-bit, LSB-aligned", note: "Mono12 / 16-bit PNG or TIFF holding 0..4095. 2 bytes per pixel; the top 4 bits are always 0." },
  { k: "msb16", name: "16-bit, MSB-aligned", note: "Value × 16, so the full 16-bit range is used. Some cameras and SDKs deliver this." },
  { k: "mono12p", name: "Mono12p (packed)", note: "GenICam PFNC: 2 pixels in 3 bytes, bits filled from the lowest bit up. 25 % less data than 16-bit." },
  { k: "mono12packed", name: "Mono12Packed (GigE Vision)", note: "Older GigE Vision packing: high 8 bits of each pixel in their own byte, low 4 bits shared." },
];

/** PackLab: two 12-bit pixels and the bytes they become in common camera/file layouts. */
export function PackLab({ caption }: { caption?: string }) {
  const [a, setA] = useState(0xabc);
  const [b, setB] = useState(0x405);
  const [li, setLi] = useState(2);
  const L = LAYOUTS[li];
  const bytes = pack(L.k, a, b);
  return (
    <figure className="fig packlab">
      <div className="sc-ctl">
        <div className="ctl ctl-full">
          <span>Layout</span>
          <div className="seg seg-small" role="radiogroup" aria-label="Layout">
            {LAYOUTS.map((l, k) => <button key={l.k} type="button" role="radio" aria-checked={li === k} className={li === k ? "is-on" : ""} onClick={() => setLi(k)}>{l.name}</button>)}
          </div>
        </div>
        <label className="ctl ctl-wide">
          <span>Pixel <b className="pk-a">A</b> <output>{a} = {hex(a, 3)}</output></span>
          <input type="range" min={0} max={4095} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="Pixel A value" />
        </label>
        <label className="ctl ctl-wide">
          <span>Pixel <b className="pk-b">B</b> <output>{b} = {hex(b, 3)}</output></span>
          <input type="range" min={0} max={4095} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="Pixel B value" />
        </label>
      </div>
      <div className="pk-bytes" role="list" aria-label={`Bytes: ${bytes.map((x) => hex(x.value)).join(" ")}`}>
        {bytes.map((byte, i) => (
          <div key={i} className="pk-byte" role="listitem">
            <div className="pk-head">byte {i} <strong>{hex(byte.value)}</strong></div>
            <div className="pk-bits">
              {byte.bits.map((bit, j) => (
                <span key={j} className={bit.pixel === "A" ? "pk-bit pk-ba" : bit.pixel === "B" ? "pk-bit pk-bb" : "pk-bit pk-pad"} title={bit.pixel ? `pixel ${bit.pixel}, bit ${bit.bit}` : "padding (always 0)"}>
                  <b>{bit.value}</b><small>{bit.pixel ? `${bit.pixel}${bit.bit}` : "–"}</small>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ul className="ap-stats">
        <li><span>Bytes for 2 pixels</span><strong>{bytes.length}</strong><em>{bytes.length === 3 ? "1.5 bytes per pixel" : "2 bytes per pixel"}</em></li>
        {(L.k === "lsb16" || L.k === "msb16") && (
          <li><span>Pixel A loaded as 8-bit</span><strong>{asStored16(L.k, a).eightBit}</strong><em>{L.k === "lsb16" ? "imread default keeps the top 8 of 16 bits: almost black" : "the top 8 bits: a fair preview"}</em></li>
        )}
      </ul>
      <div className="pg-readout" aria-live="polite"><span>{L.note} Bits are shown from bit 7 (left) to bit 0; labels say which pixel bit they hold.</span></div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
