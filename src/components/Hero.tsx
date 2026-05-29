import { wedding } from '../data/wedding';
import { getWeddingCountdownLabel } from '../utils/date';

export function Hero() {
  return (
    <section className="hero section-reveal" aria-labelledby="hero-title">
      <div className="hero__standard">
        <div className="hero__monogram" aria-hidden="true">A&amp;M</div>
        <p className="eyebrow">Свадебное приглашение</p>
        <h1 id="hero-title" className="hero__title">
          {wedding.couple.groom}
          <span>&amp;</span>
          {wedding.couple.bride}
        </h1>
        <p className="hero__date">
          {wedding.date.label} · {wedding.date.weekday}
        </p>
        <p className="hero__lead">
          Мы будем счастливы разделить с вами этот особенный день.
        </p>
        <div className="hero__meta" aria-label={getWeddingCountdownLabel(wedding.date.iso)}>
          {getWeddingCountdownLabel(wedding.date.iso)}
        </div>
      </div>
    </section>
  );
}
