export function InvitationText() {
  return (
    <section className="content-section section-reveal" aria-labelledby="invitation-title">
      <div className="section-kicker">Приглашение</div>
      <h2 id="invitation-title">Дорогие гости</h2>
      <div className="sketch-calendar" aria-label="Дата свадьбы — 25 июня 2026 года">
        <div className="sketch-calendar__top">
          <span>Июнь</span>
          <span>2026</span>
        </div>
        <div className="sketch-calendar__weekdays">
          <span>среда</span>
          <span>четверг</span>
          <span>пятница</span>
        </div>
        <div className="sketch-calendar__dates">
          <span>24</span>
          <strong>
            <svg className="sketch-calendar__heart" viewBox="0 0 150 112" aria-hidden="true">
              <path d="M75 99 C50 78 20 63 10 39 C2 20 13 6 32 7 C50 8 64 22 75 30 C85 22 101 7 120 10 C139 13 146 31 136 50 C125 72 96 84 75 99 Z" />
            </svg>
            <span>25</span>
          </strong>
          <span>26</span>
        </div>
      </div>
      <div className="prose centered invitation-prose">
        <p>
          Приглашаем вас разделить с нами радость нашего свадебного дня. Нам очень хочется,
          чтобы рядом были самые близкие люди — те, с кем этот день станет ещё теплее и
          счастливее.
        </p>
        <p>
          Основной сбор гостей состоится в ресторане Lauren Parker в 17:00. Для тех, кто хочет
          присутствовать на свадебной церемонии, мы будем ждать вас в Оперном доме музея-заповедника
          «Царицыно» к 14:00.
        </p>
      </div>
    </section>
  );
}
