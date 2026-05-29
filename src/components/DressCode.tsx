import { wedding } from '../data/wedding';

export function DressCode() {
  return (
    <section className="content-section section-reveal" aria-labelledby="dress-title">
      <div className="section-kicker">Дресс-код</div>
      <h2 id="dress-title">Цветовая палитра дресс-код нашей свадьбы</h2>
      <div className="dress-code-reference">
        <div className="dress-code-divider" aria-hidden="true" />

        <div className="palette palette--fabric" aria-label="Палитра дресс-кода">
          {wedding.dressCode.colors.map((color) => (
            <figure className="palette__item" key={color.label}>
              <span
                aria-hidden="true"
                className="palette__swatch"
                style={{ backgroundColor: color.hex }}
                title={color.label}
              />
              <figcaption>{color.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
