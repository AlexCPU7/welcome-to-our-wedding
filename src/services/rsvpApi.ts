import { RSVP_ENDPOINT } from '../data/wedding';
import {
  defaultRsvpAnswers,
  rsvpDrinkOptions,
  type DrinkOption,
  type RsvpAnswers,
  type YesNo,
} from '../types/rsvp';

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

export type RemoteRsvp = {
  guestUuid: string;
  answers: RsvpAnswers;
  updatedAt: string;
  revision: number;
};

export type SubmitRsvpResult =
  | { status: 'success'; opaque?: boolean }
  | { status: 'skipped' }
  | { status: 'error'; message: string };

export type LoadRsvpResult =
  | { status: 'success'; rsvp: RemoteRsvp | null }
  | { status: 'skipped' }
  | { status: 'error'; message: string };

const REQUEST_TIMEOUT_MS = 12000;
const IMMEDIATE_RETRY_DELAYS_MS = [0, 900, 2200];
const LEGACY_DRINK_OPTIONS: DrinkOption[] = ['beer', 'whiskey'];
const LOAD_ACTION = 'getRsvp';

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

function makeEndpointUrl(params: Record<string, string>) {
  const url = new URL(RSVP_ENDPOINT, window.location.href);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeYesNo(value: unknown): YesNo {
  return value === 'yes' || value === 'no' ? value : '';
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeRevision(value: unknown) {
  const revision = Number(value);
  return Number.isFinite(revision) && revision >= 0 ? revision : 0;
}

function normalizeDrinks(value: unknown): DrinkOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedValues = new Set<DrinkOption>([
    ...rsvpDrinkOptions.map((option) => option.value),
    ...LEGACY_DRINK_OPTIONS,
  ]);
  const uniqueValues = new Set<DrinkOption>();

  value.forEach((item) => {
    if (allowedValues.has(item as DrinkOption)) {
      uniqueValues.add(item as DrinkOption);
    }
  });

  return Array.from(uniqueValues);
}

function normalizeAnswers(value: unknown): RsvpAnswers {
  if (!isRecord(value)) {
    return { ...defaultRsvpAnswers, drinks: [] };
  }

  return {
    attendance: normalizeYesNo(value.attendance),
    ceremony: normalizeYesNo(value.ceremony),
    drinks: normalizeDrinks(value.drinks),
    allergies: normalizeString(value.allergies),
    comment: normalizeString(value.comment),
  };
}

function parseLoadRsvpPayload(payload: unknown): LoadRsvpResult {
  if (!isRecord(payload)) {
    return { status: 'error', message: 'Сервер вернул некорректный ответ' };
  }

  if (payload.ok === false) {
    return {
      status: 'error',
      message: normalizeString(payload.error) || 'Сервер не смог загрузить ответ гостя',
    };
  }

  if (!isRecord(payload.result)) {
    return { status: 'error', message: 'В ответе сервера нет данных RSVP' };
  }

  if (payload.result.status === 'not_found') {
    return { status: 'success', rsvp: null };
  }

  if (payload.result.status !== 'found') {
    return {
      status: 'error',
      message: `Неизвестный статус ответа сервера: ${String(payload.result.status ?? '')}`,
    };
  }

  const revision = normalizeRevision(payload.result.client_revision ?? payload.result.revision);
  const updatedAt =
    normalizeString(payload.result.updated_at) ||
    normalizeString(payload.result.updatedAt) ||
    new Date().toISOString();

  return {
    status: 'success',
    rsvp: {
      guestUuid: normalizeString(payload.result.guest_uuid),
      answers: normalizeAnswers(payload.result.answers),
      updatedAt,
      revision,
    },
  };
}

function loadRsvpViaJsonp(guestUuid: string): Promise<LoadRsvpResult> {
  return new Promise((resolve) => {
    const callbackName = `__weddingRsvp${Date.now()}${Math.random().toString(36).slice(2)}`;
    const callbacks = window as typeof window & Record<string, (payload: unknown) => void>;
    const script = document.createElement('script');
    let timeoutId: number | null = null;
    let settled = false;

    const cleanup = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      delete callbacks[callbackName];
      script.remove();
    };

    const settle = (result: LoadRsvpResult) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(result);
    };

    callbacks[callbackName] = (payload: unknown) => {
      settle(parseLoadRsvpPayload(payload));
    };

    script.async = true;
    script.src = makeEndpointUrl({
      action: LOAD_ACTION,
      guest_uuid: guestUuid,
      callback: callbackName,
      _: String(Date.now()),
    });
    script.onerror = () => {
      settle({ status: 'error', message: 'Не удалось загрузить сохранённый ответ гостя' });
    };

    timeoutId = window.setTimeout(() => {
      settle({ status: 'error', message: 'Превышено время ожидания загрузки ответа гостя' });
    }, REQUEST_TIMEOUT_MS);

    document.head.appendChild(script);
  });
}

async function loadRsvpViaFetch(guestUuid: string): Promise<LoadRsvpResult> {
  try {
    const response = await fetchWithTimeout(
      makeEndpointUrl({
        action: LOAD_ACTION,
        guest_uuid: guestUuid,
        _: String(Date.now()),
      }),
      {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
      },
    );

    if (!response.ok) {
      return { status: 'error', message: `Сервер вернул статус ${response.status}` };
    }

    return parseLoadRsvpPayload(await response.json());
  } catch (error) {
    return { status: 'error', message: getErrorMessage(error) };
  }
}

export async function loadRsvpFromServer(guestUuid: string): Promise<LoadRsvpResult> {
  if (!RSVP_ENDPOINT) {
    return { status: 'skipped' };
  }

  if (RSVP_ENDPOINT.includes('script.google.com')) {
    return loadRsvpViaJsonp(guestUuid);
  }

  return loadRsvpViaFetch(guestUuid);
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
