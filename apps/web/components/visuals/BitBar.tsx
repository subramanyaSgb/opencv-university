export interface BitGroup {
  label: string;
  bits: number;
  tone: "gray" | "r" | "g" | "b";
}

/** Bits drawn as boxes, grouped and coloured: 8 gray bits vs 8 + 8 + 8 colour bits. */
export function BitBar({ groups, total }: { groups: BitGroup[]; total?: string }) {
  return (
    <figure className="vis bitbar">
      <div className="bitbar-row">
        {groups.map((g, i) => (
          <div key={i} className="bitbar-group">
            <div className="bitbar-boxes">
              {Array.from({ length: g.bits }, (_, j) => (
                <span key={j} className={`bitbar-bit bb-${g.tone}`} />
              ))}
            </div>
            <span className="bitbar-label">{g.label}</span>
          </div>
        ))}
      </div>
      {total && <div className="bitbar-total">{total}</div>}
    </figure>
  );
}
