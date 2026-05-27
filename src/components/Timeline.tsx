import { wedding } from '../data/wedding';

const events = wedding.schedule;

function CalendarRoute() {
  return (
    <div className="calendar-route" aria-label="Календарный маршрут свадебного дня">
      <div className="calendar-route__month">Июнь 2026</div>
      <div className="calendar-route__week" aria-label="Неделя свадьбы">
        <div>
          <span>ПН</span>
          <strong>22</strong>
        </div>
        <div>
          <span>ВТ</span>
          <strong>23</strong>
        </div>
        <div>
          <span>СР</span>
          <strong>24</strong>
        </div>
        <div className="is-wedding-day">
          <span>ЧТ</span>
          <strong>25</strong>
        </div>
        <div>
          <span>ПТ</span>
          <strong>26</strong>
        </div>
      </div>

      <div className="calendar-route__path" aria-hidden="true">
        <svg viewBox="0 0 260 560" preserveAspectRatio="none">
          <path
            d="M132 12 C128 86 70 118 84 188 C102 278 190 260 178 350 C166 434 90 432 114 548"
            fill="none"
          />
        </svg>
        <span className="calendar-route__heart calendar-route__heart--top">25</span>
        <span className="calendar-route__heart calendar-route__heart--middle">25</span>
        <span className="calendar-route__dot" />
      </div>

      <article className="calendar-route__event calendar-route__event--ceremony">
        <time>14:00</time>
        <h3>Сбор гостей</h3>
        <p>Перед свадебной церемонией в Царицыно</p>
      </article>

      <article className="calendar-route__event calendar-route__event--ceremony-start">
        <time>14:30</time>
        <h3>Церемония</h3>
        <p>Начало свадебной церемонии</p>
      </article>

      <article className="calendar-route__event calendar-route__event--banquet">
        <time>17:00</time>
        <h3>Банкет</h3>
        <p>Начало банкета в Lauren Parker</p>
      </article>

      <article className="calendar-route__event calendar-route__event--finish">
        <time>23:00</time>
        <h3>Завершение</h3>
        <p>Завершение свадебного вечера</p>
      </article>
    </div>
  );
}

export function Timeline() {
  return (
    <section className="content-section section-reveal" aria-labelledby="timeline-title">
      <div className="section-kicker">План дня</div>
      <h2 id="timeline-title">Тайминг</h2>
      <CalendarRoute />
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
