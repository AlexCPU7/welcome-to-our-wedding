import { wedding } from '../data/wedding';

export function DressCode() {
  return (
    <section className="content-section section-reveal" aria-labelledby="dress-title">
      <div className="section-kicker">Дресс-код</div>
      <h2 id="dress-title">Светлая элегантная палитра</h2>
      <div className="dress-layout">
        <div className="prose">
          <p>
            Нам будет приятно, если вы поддержите спокойное настроение вечера в светлых пастельных
            оттенках. Это не строгое правило, а мягкое пожелание, чтобы фотографии и атмосфера
            получились особенно гармоничными.
          </p>
        </div>
        <div className="palette" aria-label="Палитра дресс-кода">
          {wedding.dressCode.colors.map((color) => (
            <span className={`palette__swatch palette__swatch--${color.replace(' ', '-')}`} key={color}>
              {color}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
