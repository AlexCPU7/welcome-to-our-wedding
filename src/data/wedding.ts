export const RSVP_ENDPOINT = import.meta.env.VITE_RSVP_ENDPOINT?.trim() ?? '';

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

const makeMapLinks = (query: string) => ({
  yandex: `https://yandex.ru/maps/?text=${encodeURIComponent(query)}`,
  twoGis: `https://2gis.ru/moscow/search/${encodeURIComponent(query)}`,
  google: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
});

export const wedding = {
  couple: {
    groom: 'Алексей',
    bride: 'Марина',
    label: 'Алексей & Марина',
  },
  date: {
    iso: '2026-06-25T00:00:00+03:00',
    label: '25 июня 2026',
    weekday: 'четверг',
  },
  ceremony: {
    time: '14:00',
    title: 'Сбор гостей на свадебную церемонию',
    place: 'Музей-заповедник «Царицыно», Оперный дом',
    address: 'Москва, Дольская ул., 1, стр. 5',
    note: 'Будем ждать гостей, которые хотят присутствовать на церемонии.',
    photo: publicAsset('images/opera-house.png'),
    photoFallback: publicAsset('images/tsaritsyno-location.svg'),
    photoAlt: 'Музей-заповедник «Царицыно», Оперный дом',
    maps: makeMapLinks('Музей-заповедник Царицыно Оперный дом Москва Дольская улица 1 стр 5'),
  },
  banquet: {
    time: '17:00',
    title: 'Начало банкета',
    place: 'Ресторан Lauren Parker',
    address: 'Москва, ул. Станиславского, 15',
    note: 'Основной праздничный вечер в ресторане.',
    photo: publicAsset('images/lauren-parker.png'),
    photoFallback: publicAsset('images/lauren-parker-location.svg'),
    photoAlt: 'Ресторан Lauren Parker',
    maps: makeMapLinks('Lauren Parker Москва улица Станиславского 15'),
  },
  schedule: [
    {
      time: '14:00',
      title: 'Сбор гостей на свадебную церемонию',
      place: 'Музей-заповедник «Царицыно», Оперный дом',
      note: 'Встречаем гостей перед началом церемонии.',
    },
    {
      time: '14:30',
      title: 'Начало свадебной церемонии',
      place: 'Музей-заповедник «Царицыно», Оперный дом',
      note: 'Торжественная церемония в Оперном доме.',
    },
    {
      time: '17:00',
      title: 'Сбор гостей, фуршет, welcome-встреча',
      place: 'Ресторан Lauren Parker',
      note: 'Встречаемся в ресторане, общаемся и настраиваемся на вечер.',
    },
    {
      time: '17:30',
      title: 'Торжественная церемония',
      place: 'Ресторан Lauren Parker',
      note: 'Торжественный момент праздничного вечера.',
    },
    {
      time: '18:30',
      title: 'Банкет',
      place: 'Ресторан Lauren Parker',
      note: 'Праздничный ужин и вечер с близкими.',
    },
    {
      time: '23:00',
      title: 'Завершение банкета',
      place: 'Ресторан Lauren Parker',
      note: 'Тёплое завершение свадебного вечера.',
    },
  ],
  dressCode: {
    colors: [
      { label: 'Шампань', hex: '#b49a88' },
      { label: 'Капучино', hex: '#684e3d' },
      { label: 'Шоколад', hex: '#543523' },
      { label: 'Нежно-розовый', hex: '#f5e4e2' },
      { label: 'Пудровый', hex: '#c69593' },
      { label: 'Пыльная роза', hex: '#a48086' },
      { label: 'Лиловый', hex: '#937884' },
      { label: 'Небесно-голубой', hex: '#a2bcd0' },
      { label: 'Серо-голубой', hex: '#8189a0' },
      { label: 'Жемчужно-серый', hex: '#a09a90' },
      { label: 'Оливковый', hex: '#959a75' },
      { label: 'Шалфей', hex: '#68705a' },
    ],
  },
};
