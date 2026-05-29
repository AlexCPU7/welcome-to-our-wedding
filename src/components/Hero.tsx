import { wedding } from '../data/wedding';
import { getWeddingCountdownLabel } from '../utils/date';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'long',
});

const monthFormatter = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
});

const weddingDate = new Date(wedding.date.iso);
const weddingDay = dateFormatter.formatToParts(weddingDate).find((part) => part.type === 'day')?.value ?? '25';
const weddingMonth = monthFormatter.format(weddingDate);
const weddingYear = String(weddingDate.getFullYear());
const weddingWeekday = weekdayFormatter.format(weddingDate);
const ceremonyTime = wedding.ceremony.time.replace(':', '.');

export function Hero() {
  const readableDate = `${wedding.date.label}, ${wedding.date.weekday}, ${wedding.ceremony.time}`;

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
        <div className="hero__date-italy" aria-label={readableDate}>
          <span>
            <em>{weddingWeekday}</em>
            <strong>{ceremonyTime}</strong>
          </span>
          <b>{weddingDay}</b>
          <span>
            <em>{weddingMonth}</em>
            <strong>{weddingYear}</strong>
          </span>
        </div>
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
