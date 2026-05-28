const MS_IN_DAY = 1000 * 60 * 60 * 24;

function pluralizeDays(value: number) {
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней';
  }

  if (lastDigit === 1) {
    return 'день';
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }

  return 'дней';
}

export function getWeddingCountdownLabel(dateIso: string) {
  const today = new Date();
  const target = new Date(dateIso);
  const diff = Math.ceil((target.getTime() - today.getTime()) / MS_IN_DAY);

  if (diff > 0) {
    return `До свадьбы ${diff} ${pluralizeDays(diff)}`;
  }

  if (diff === 0) {
    return 'Сегодня наш день';
  }

  return 'Спасибо, что были с нами';
}

function padTimeUnit(value: number) {
  return String(Math.max(0, value)).padStart(2, '0');
}

export function getWeddingCountdownParts(dateIso: string) {
  const now = new Date();
  const target = new Date(dateIso);
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days),
    hours: padTimeUnit(hours),
    minutes: padTimeUnit(minutes),
    seconds: padTimeUnit(seconds),
  };
}
