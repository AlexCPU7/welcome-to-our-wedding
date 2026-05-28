import { wedding } from '../data/wedding';
import { getWeddingCountdownLabel } from '../utils/date';

export function Hero() {
  return (
    <>
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

      <section className="reference-hero content-section section-reveal" aria-labelledby="reference-hero-title">
        <p className="reference-hero__brand">A&M</p>
        <p className="reference-hero__script" id="reference-hero-title">
          Приглашение
          <br />
          на свадьбу
        </p>

        <div className="reference-card reference-card--main">
          <p className="reference-card__kicker">приглашение на свадьбу</p>
          <div className="reference-card__initials">
            <span>А</span>
            <em>&amp;</em>
            <span>М</span>
          </div>
          <div className="reference-card__photo">
            <span>{wedding.couple.label}</span>
          </div>
          <p className="reference-card__note">мы женимся!</p>
          <time>{wedding.date.label}</time>
          <svg className="reference-card__line" viewBox="0 0 320 76" preserveAspectRatio="none">
            <path d="M0 44 C58 10 82 82 142 42 C198 5 210 75 320 32" />
          </svg>
        </div>
      </section>

      <section className="reference-details content-section section-reveal" aria-labelledby="reference-details-title">
        <article className="reference-card reference-card--route">
          <h2 id="reference-details-title">Дорогие родные и близкие!</h2>
          <p>Будем счастливы разделить с вами день нашей свадьбы.</p>
          <div className="reference-card__mini-layout">
            <div className="reference-card__mini-calendar">
              <span>Июнь 2026</span>
              <strong>25</strong>
            </div>
            <div className="reference-card__mini-events">
              <div>
                <time>14:00</time>
                <span>Церемония в Царицыно</span>
              </div>
              <div>
                <time>17:00</time>
                <span>Встреча гостей в Lauren Parker</span>
              </div>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}
