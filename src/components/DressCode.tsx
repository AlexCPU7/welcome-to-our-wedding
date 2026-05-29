import { wedding } from '../data/wedding';

export function DressCode() {
  return (
    <section className="content-section section-reveal" aria-labelledby="dress-title">
      <div className="section-kicker">Дресс-код</div>
      <h2 id="dress-title">Дресс-код</h2>
      <p className="dress-code-lead body-copy">
        Чтобы сохранить стиль и атмосферу мероприятия, мы будем рады, если вы поддержите цветовую гамму нашей свадьбы
      </p>
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

        <div className="dress-code-note prose">
          <p className="body-copy">Для нас главное — Ваше присутствие!</p>
        </div>
      </div>
    </section>
  );
}
