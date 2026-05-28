import { wedding } from '../data/wedding';

export function DressCode() {
  return (
    <section className="content-section section-reveal" aria-labelledby="dress-title">
      <div className="section-kicker">Дресс-код</div>
      <h2 id="dress-title">Светлая элегантная палитра</h2>
      <div className="dress-layout">
        <div className="prose">
          <p>
            Для нас главное - Ваше присутствие!
          </p>
          <p>
            Но мы будем рады, если в своих нарядах Вы поддержите цветовую гамму нашей свадьбы
          </p>
        </div>
        <div className="palette palette--fabric" aria-label="Палитра дресс-кода">
          {wedding.dressCode.colors.map((color) => (
            <span
              aria-label={color.label}
              className="palette__swatch"
              key={color.label}
              style={{ backgroundColor: color.hex }}
              title={color.label}
            >
              {color.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
