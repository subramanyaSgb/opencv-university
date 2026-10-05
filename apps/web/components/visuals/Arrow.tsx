/** A centred down arrow to connect stacked figures (Flow → Columns → Flow). */
export function Arrow({ label }: { label?: string }) {
  return (
    <div className="vis-arrow" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path d="M12 4v14m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && <span>{label}</span>}
    </div>
  );
}
