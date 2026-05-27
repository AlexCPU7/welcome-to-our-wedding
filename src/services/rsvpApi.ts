import { RSVP_ENDPOINT } from '../data/wedding';
import type { RsvpAnswers } from '../types/rsvp';

type SubmitRsvpPayload = {
  guestUuid: string;
  answers: RsvpAnswers;
};

export type SubmitRsvpResult =
  | { status: 'success'; opaque?: boolean }
  | { status: 'skipped' }
  | { status: 'error'; message: string };

export async function submitRsvp({ guestUuid, answers }: SubmitRsvpPayload): Promise<SubmitRsvpResult> {
  if (!RSVP_ENDPOINT) {
    return { status: 'skipped' };
  }

  const payload = {
    guest_uuid: guestUuid,
    ceremony: answers.ceremony,
    drinks: answers.drinks,
    allergies: answers.allergies,
    comment: answers.comment,
    updated_at: new Date().toISOString(),
    source: 'github-pages',
  };

  const isGoogleAppsScript = RSVP_ENDPOINT.includes('script.google.com');

  try {
    const response = await fetch(RSVP_ENDPOINT, {
      method: 'POST',
      mode: isGoogleAppsScript ? 'no-cors' : 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (isGoogleAppsScript || response.ok) {
      return { status: 'success', opaque: isGoogleAppsScript };
    }

    return {
      status: 'error',
      message: `Сервер вернул статус ${response.status}`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Неизвестная ошибка отправки',
    };
  }
}
