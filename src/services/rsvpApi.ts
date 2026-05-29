import { RSVP_ENDPOINT } from '../data/wedding';
import { rsvpDrinkOptions, type RsvpAnswers } from '../types/rsvp';

type SubmitRsvpPayload = {
  guestUuid: string;
  answers: RsvpAnswers;
  updatedAt: string;
  revision: number;
};

type RsvpRequestPayload = {
  guest_uuid: string;
  attendance: RsvpAnswers['attendance'];
  attendance_label: string;
  ceremony: RsvpAnswers['ceremony'];
  ceremony_label: string;
  allergies: string;
  comment: string;
  updated_at: string;
  client_revision: number;
  request_id: string;
  source: 'github-pages';
  drinks: RsvpAnswers['drinks'];
  [key: `drink_${string}`]: 0 | 1;
};

export type SubmitRsvpResult =
  | { status: 'success'; opaque?: boolean }
  | { status: 'skipped' }
  | { status: 'error'; message: string };

const REQUEST_TIMEOUT_MS = 12000;
const IMMEDIATE_RETRY_DELAYS_MS = [0, 900, 2200];

const attendanceLabels: Record<RsvpAnswers['attendance'], string> = {
  yes: 'Да, буду',
  no: 'К сожалению, не смогу',
  '': '',
};

const yesNoLabels: Record<RsvpAnswers['ceremony'], string> = {
  yes: 'Да',
  no: 'Нет',
  '': '',
};

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function makeRequestPayload({
  guestUuid,
  answers,
  updatedAt,
  revision,
}: SubmitRsvpPayload): RsvpRequestPayload {
  const drinkFlags = Object.fromEntries(
    rsvpDrinkOptions.map((option) => [
      option.payloadKey,
      answers.drinks.includes(option.value) ? 1 : 0,
    ]),
  ) as Record<`drink_${string}`, 0 | 1>;

  return {
    guest_uuid: guestUuid,
    attendance: answers.attendance,
    attendance_label: attendanceLabels[answers.attendance],
    ceremony: answers.ceremony,
    ceremony_label: yesNoLabels[answers.ceremony],
    allergies: answers.allergies.trim(),
    comment: answers.comment.trim(),
    updated_at: updatedAt,
    client_revision: revision,
    request_id: `${guestUuid}:${revision}`,
    source: 'github-pages',
    drinks: answers.drinks,
    ...drinkFlags,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Превышено время ожидания ответа';
  }

  return error instanceof Error ? error.message : 'Неизвестная ошибка отправки';
}

export async function submitRsvp(payload: SubmitRsvpPayload): Promise<SubmitRsvpResult> {
  if (!RSVP_ENDPOINT) {
    return { status: 'skipped' };
  }

  const requestPayload = makeRequestPayload(payload);
  const body = JSON.stringify(requestPayload);
  const isGoogleAppsScript = RSVP_ENDPOINT.includes('script.google.com');
  let lastErrorMessage = '';

  for (let attemptIndex = 0; attemptIndex < IMMEDIATE_RETRY_DELAYS_MS.length; attemptIndex += 1) {
    const retryDelay = IMMEDIATE_RETRY_DELAYS_MS[attemptIndex];

    if (retryDelay > 0) {
      await delay(retryDelay);
    }

    try {
      const response = await fetchWithTimeout(RSVP_ENDPOINT, {
        method: 'POST',
        mode: isGoogleAppsScript ? 'no-cors' : 'cors',
        redirect: 'follow',
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body,
      });

      if (isGoogleAppsScript || response.ok) {
        return { status: 'success', opaque: isGoogleAppsScript };
      }

      lastErrorMessage = `Сервер вернул статус ${response.status}`;
    } catch (error) {
      lastErrorMessage = getErrorMessage(error);
    }
  }

  return {
    status: 'error',
    message: lastErrorMessage || 'Не удалось отправить ответ',
  };
}

export function sendRsvpBeacon(payload: SubmitRsvpPayload) {
  if (!RSVP_ENDPOINT || typeof navigator.sendBeacon !== 'function') {
    return false;
  }

  const requestPayload = makeRequestPayload(payload);
  const body = JSON.stringify(requestPayload);
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });

  return navigator.sendBeacon(RSVP_ENDPOINT, blob);
}
