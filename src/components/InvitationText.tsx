export function InvitationText() {
  return (
    <section className="content-section section-reveal" aria-labelledby="invitation-title">
      <div className="section-kicker">Приглашение</div>
      <h2 id="invitation-title">Дорогие гости!</h2>
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
              <path d="M75 99 C58 79 39 65 29 44 C23 31 35 20 51 20 C63 20 72 27 75 34 C80 26 89 20 100 20 C116 20 128 33 122 49 C114 70 92 84 75 99 Z" />
            </svg>
            <span>25</span>
          </strong>
          <span>26</span>
        </div>
      </div>
      <div className="prose centered invitation-prose">
        <p>
          Мы будем счастливы разделить с Вами радость неповторимого для нас дня -дня нашей свадьбы!
          Приглашаем присоединиться к нашему празднику и украсить его своим присутствием 25 июня!
        </p>
        <p>
          Основной сбор гостей состоится в ресторане Lauren Parker в 17:00. Для тех, кто хочет
          присутствовать на свадебной церемонии, мы будем ждать вас в Оперном доме музея-заповедника
          «Царицыно» к 14:00.
        </p>
      </div>
      <div className="pearl-polaroids" aria-label="Места для будущих фотографий пары">
        <figure className="pearl-polaroid pearl-polaroid--left">
          <div className="pearl-polaroid__placeholder" aria-hidden="true">
            <span>Фото пары</span>
          </div>
          <figcaption>ждём вас</figcaption>
        </figure>
        <figure className="pearl-polaroid pearl-polaroid--right">
          <div className="pearl-polaroid__placeholder" aria-hidden="true">
            <span>Фото момента</span>
          </div>
          <figcaption>25.06</figcaption>
        </figure>
      </div>
    </section>
  );
}
