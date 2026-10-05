/** One colour pixel's three numbers, and the two colours they mean under BGR and RGB order. */
export function ColorPixel({ values }: { values: [number, number, number] }) {
  const [a, b, c] = values;
  return (
    <figure className="vis cpx">
      <code className="cpx-array">[{values.join(", ")}]</code>
      <div className="cpx-options">
        <div className="cpx-opt">
          <span className="cpx-swatch" style={{ background: `rgb(${c},${b},${a})` }} />
          <span>
            Read as <strong>B, G, R</strong> (OpenCV): blue {a}, green {b}, red {c}
          </span>
        </div>
        <div className="cpx-opt">
          <span className="cpx-swatch" style={{ background: `rgb(${a},${b},${c})` }} />
          <span>
            Read as <strong>R, G, B</strong>: red {a}, green {b}, blue {c}
          </span>
        </div>
      </div>
      <figcaption>Same three numbers, two different colours. The numbers only mean something once you know the representation.</figcaption>
    </figure>
  );
}
