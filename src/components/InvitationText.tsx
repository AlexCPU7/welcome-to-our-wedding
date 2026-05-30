import { wedding } from '../data/wedding';

const calendarDate = new Date(wedding.date.iso);
const calendarMonth = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(calendarDate);
const calendarYear = calendarDate.getFullYear();
const calendarDay = calendarDate.getDate();
const calendarDaysInMonth = new Date(calendarYear, calendarDate.getMonth() + 1, 0).getDate();
const calendarStartOffset = (new Date(calendarYear, calendarDate.getMonth(), 1).getDay() + 6) % 7;
const calendarDays = Array.from({ length: calendarDaysInMonth }, (_, index) => index + 1);
const calendarCells = [
  ...Array.from({ length: calendarStartOffset }, () => null),
  ...calendarDays,
];
const calendarWeekdays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];

function WeddingCalendar() {
  return (
    <div className="sketch-calendar" aria-label={`Дата свадьбы — ${wedding.date.label}`}>
      <div className="sketch-calendar__top">
        <span>{calendarMonth}</span>
        <span>{calendarYear}</span>
      </div>
      <div className="sketch-calendar__weekdays" aria-hidden="true">
        {calendarWeekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="sketch-calendar__dates">
        {calendarCells.map((day, index) =>
          day === null ? (
            <span className="sketch-calendar__blank" aria-hidden="true" key={`blank-${index}`} />
          ) :
          day === calendarDay ? (
            <strong key={day}>
              <svg className="sketch-calendar__heart" viewBox="0 0 150 112" aria-hidden="true">
                <path d="M75 99 C58 79 39 65 29 44 C23 31 35 20 51 20 C63 20 72 27 75 34 C80 26 89 20 100 20 C116 20 128 33 122 49 C114 70 92 84 75 99 Z" />
              </svg>
              <span>{day}</span>
            </strong>
          ) : (
            <span key={day}>{day}</span>
          ),
        )}
      </div>
    </div>
  );
}

export function InvitationText() {
  return (
    <section className="content-section section-reveal" aria-labelledby="invitation-title">
      <div className="section-kicker">Приглашение</div>
      <h2 id="invitation-title">ДОРОГИЕ РОДНЫЕ И БЛИЗКИЕ!</h2>
      <div className="prose centered invitation-prose">
        <p className="body-copy">
          В нашей жизни предстоят счастливые перемены!
        </p>
        <p className="body-copy">
          Мы приглашаем вас разделить с нами радостный день, в котором мы станем семьей! Нам будет очень ценно провести его рядом с вами и сохранить эти тёплые воспоминания вместе 💙
        </p>
        <p className="body-copy">
          Основной сбор гостей состоится в ресторане Lauren Parker в 16:30. Для тех, кто хочет
          присутствовать на свадебной церемонии, мы будем ждать вас в Оперном доме музея-заповедника
          «Царицыно» к 14:00.
        </p>
      </div>
      <WeddingCalendar />
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
