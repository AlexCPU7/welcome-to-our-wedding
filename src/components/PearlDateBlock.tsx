import { useEffect, useState } from 'react';
import { wedding } from '../data/wedding';
import { getWeddingCountdownParts } from '../utils/date';

export function PearlDateBlock() {
  return (
    <section className="pearl-date-section section-reveal" aria-label="Дата свадьбы">
      <div className="pearl-happy">
        <h2>Мы счастливы</h2>
        <p>разделить с Вами радость неповторимого для нас дня — дня нашей свадьбы!</p>
        <div className="pearl-date-mark" aria-label="25 июня 2026 года">
          <span>25.06</span>
          <em>июня</em>
          <strong>2026</strong>
        </div>
      </div>
    </section>
  );
}

export function PearlCountdownBlock() {
  const [countdown, setCountdown] = useState(() => getWeddingCountdownParts(wedding.date.iso));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getWeddingCountdownParts(wedding.date.iso));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="pearl-countdown-section section-reveal" aria-label="Обратный отсчёт до свадьбы">
      <div className="pearl-countdown">
        <h2>До свадьбы</h2>
        <p>осталось совсем немного времени</p>
        <div className="pearl-countdown__timer" aria-label="Обратный отсчёт до свадьбы">
          <span>
            <strong>{countdown.days}</strong>
            <em>дней</em>
          </span>
          <span>
            <strong>{countdown.hours}</strong>
            <em>часов</em>
          </span>
          <span>
            <strong>{countdown.minutes}</strong>
            <em>минут</em>
          </span>
          <span>
            <strong>{countdown.seconds}</strong>
            <em>секунд</em>
          </span>
        </div>
      </div>
    </section>
  );
}
