/** A colour image as three stacked channel grids (Blue, Green, Red) that combine into one image. */
export function ChannelStack({ caption }: { caption?: string }) {
  return (
    <figure className="vis chs">
      <div className="chs-row">
        <div className="chs-stack" aria-hidden="true">
          <div className="chs-plane chs-r"><span>Red channel</span></div>
          <div className="chs-plane chs-g"><span>Green channel</span></div>
          <div className="chs-plane chs-b"><span>Blue channel</span></div>
        </div>
        <svg viewBox="0 0 24 24" width="30" height="30" className="chs-arrow" aria-hidden="true">
          <path d="M4 12h14m0 0-6-6m6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="chs-combined" role="img" aria-label="Combined colour image">
          <span>Combined image</span>
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
