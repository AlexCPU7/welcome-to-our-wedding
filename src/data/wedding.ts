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
    title: 'Сбор гостей на свадебную регистрацию',
    place: 'Музей-заповедник «Царицыно», Оперный дом',
    address: 'Москва, Дольская ул., 1, стр. 5',
    note: 'Будем ждать гостей, которые хотят присутствовать на церемонии',
    photo: publicAsset('images/opera-house.png'),
    photoFallback: publicAsset('images/tsaritsyno-location.svg'),
    photoAlt: 'Музей-заповедник «Царицыно», Оперный дом',
    maps: makeMapLinks('Музей-заповедник Царицыно Оперный дом Москва Дольская улица 1 стр 5'),
  },
  banquet: {
    time: '16:30',
    title: 'Сбор гостей, фуршет, welcome-встреча',
    place: 'Ресторан Lauren Parker',
    address: 'Москва, ул. Станиславского, 15',
    note: 'Основной праздничный вечер в ресторане',
    photo: publicAsset('images/lauren-parker.png'),
    italyPhoto: publicAsset('images/LaurenParker.webp'),
    photoFallback: publicAsset('images/lauren-parker-location.svg'),
    photoAlt: 'Ресторан Lauren Parker',
    maps: makeMapLinks('Lauren Parker Москва улица Станиславского 15'),
  },
  schedule: [
    {
      time: '14:00',
      title: 'Сбор гостей на свадебную регистрацию',
      place: 'Музей-заповедник «Царицыно», Оперный дом',
      note: 'Встречаемся перед началом регистрацию в ЗАГС',
    },
    {
      time: '14:30',
      title: 'Начало регистрации',
      place: 'Торжественная церемония в Оперном доме',
      note: 'Этот момент станет началом нашей семьи',
    },
    {
      time: '16:30',
      title: 'Сбор гостей, фуршет, welcome-встреча',
      place: 'Встречаемся в ресторане Lauren Parker, общаемся и настраиваемся на вечер',
      note: 'Просим взять с собой хорошее настроение и свои улыбки',
    },
    {
      time: '17:00',
      title: 'Торжественная церемония',
      place: '',
      note: 'Вы станете свидетелями трогательного момента',
    },
    {
      time: '17:30',
      title: 'Банкет',
      place: '',
      note: 'Время вкусной еды, танцев и развлечений',
    },
    {
      time: '23:00',
      title: 'Завершение банкета',
      place: '',
      note: 'Но это не прощание - мы уверены, что впереди у нас ещё будет много теплых встреч, где мы обязательно соберёмся все вместе снова',
    },
  ],
  dressCode: {
    colors: [
      { label: 'Пыльный голубой', hex: '#A9BDCA' },
      { label: 'Приглушённый голубой', hex: '#A7BED6' },
      { label: 'Пастельный сине-сиреневый', hex: '#8FA4C6' },
      { label: 'Масляно-жёлтый', hex: '#F6D99A' },
      { label: 'Оливковый', hex: '#9AA06B' },
      { label: 'Шоколадный', hex: '#967C6B' },
    ],
  },
};
