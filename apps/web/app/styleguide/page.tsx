import type { Metadata } from "next";

export const metadata: Metadata = { title: "Styleguide" };

const COLOR_TOKENS = [
  "--bg", "--bg-soft", "--bg-sunk", "--fg", "--fg-soft", "--fg-faint", "--line",
  "--accent", "--accent-soft", "--ok", "--bad", "--warn",
];

/**
 * Internal design reference: not a lesson, not linked from the course nav.
 * Used to verify global typography/token fixes in isolation, and as the
 * side-by-side comparison page for the benchmark-driven redesign research.
 */
export default function StyleguidePage() {
  return (
    <div className="styleguide">
      <h1>Styleguide</h1>
      <p className="sg-note">Internal design reference. Not part of the course.</p>

      <section>
        <h2>Hyphen / numeric spacing test</h2>
        <p className="sg-test-para">
          An 8-bit image stores one byte per-pixel, so values run from 0 to 255. The sRGB standard is
          IEC 61966-2-1:1999. A 1920×1080 frame at 30 fps needs about 1.2 GB/s uncompressed. See also
          multi-scale, non-maximum suppression, and the three-channel BGR order.
        </p>
        <p className="sg-note">
          Every hyphen above should sit tight against its neighbouring characters, with no extra gap
          (e.g. "8-bit" not "8 - bit"). <code className="tabular-nums">tabular-nums</code> is scoped to
          numeric UI only (lesson numbers, nav, progress) via the <code>.tabular-nums</code> utility class,
          never applied to body prose.
        </p>
      </section>

      <section>
        <h2>Type scale</h2>
        <div className="sg-type-row">
          <span className="sg-type-label">H1</span>
          <h1 style={{ margin: 0 }}>The quick brown fox jumps over the lazy dog</h1>
        </div>
        <div className="sg-type-row">
          <span className="sg-type-label">H2</span>
          <h2 style={{ margin: 0, padding: 0, border: 0 }}>The quick brown fox jumps over the lazy dog</h2>
        </div>
        <div className="sg-type-row">
          <span className="sg-type-label">H3</span>
          <h3 style={{ margin: 0 }}>The quick brown fox jumps over the lazy dog</h3>
        </div>
        <div className="sg-type-row">
          <span className="sg-type-label">Body</span>
          <span>The quick brown fox jumps over the lazy dog</span>
        </div>
      </section>

      <section>
        <h2>Color tokens</h2>
        <div className="sg-swatches">
          {COLOR_TOKENS.map((name) => (
            <div className="sg-swatch" key={name}>
              <div className="sg-swatch-color" style={{ background: `var(${name})` }} />
              <code>{name}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
