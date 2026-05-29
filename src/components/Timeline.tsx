import { wedding } from '../data/wedding';

const events = wedding.schedule;

export function Timeline() {
  return (
    <section className="content-section section-reveal" aria-labelledby="timeline-title">
      <div className="section-kicker">План дня</div>
      <h2 id="timeline-title">Тайминг дня</h2>
      <div className="timeline" role="list">
        {events.map((event) => (
          <article className="timeline-card" role="listitem" key={event.time}>
            <div className="timeline-card__time">{event.time}</div>
            <div className="timeline-card__content">
              <h3>{event.title}</h3>
              <p className="timeline-card__place">{event.place}</p>
              <p>{event.note}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
