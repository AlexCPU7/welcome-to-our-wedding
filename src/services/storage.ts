import { defaultRsvpAnswers, type RsvpAnswers, type StoredRsvp } from '../types/rsvp';

const STORAGE_PREFIX = 'alexey-marina-wedding:rsvp';

const makeStorageKey = (guestUuid: string) => `${STORAGE_PREFIX}:${guestUuid}`;

type SaveRsvpOptions = {
  pendingSync?: boolean;
  lastSyncedAt?: string;
  revision?: number;
  updatedAt?: string;
};

function normalizeStoredRevision(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeDrinkValues(drinks: unknown): RsvpAnswers['drinks'] {
  if (!Array.isArray(drinks)) {
    return [];
  }

  return drinks
    .map((drink) => (drink === 'will_not_drink_alcohol' ? 'no_alcohol' : drink))
    .filter((drink): drink is RsvpAnswers['drinks'][number] => typeof drink === 'string');
}

export function loadStoredRsvp(guestUuid: string): StoredRsvp | null {
  try {
    const rawValue = window.localStorage.getItem(makeStorageKey(guestUuid));

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as StoredRsvp;

    return {
      guestUuid,
      answers: {
        ...defaultRsvpAnswers,
        ...parsed.answers,
        drinks: normalizeDrinkValues(parsed.answers?.drinks),
      },
      pendingSync: Boolean(parsed.pendingSync),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      revision: normalizeStoredRevision(parsed.revision),
      lastSyncedAt: parsed.lastSyncedAt,
    };
  } catch {
    return null;
  }
}

export function loadRsvpAnswers(guestUuid: string): RsvpAnswers {
  return loadStoredRsvp(guestUuid)?.answers ?? defaultRsvpAnswers;
}

export function saveRsvpLocally(
  guestUuid: string,
  answers: RsvpAnswers,
  options?: SaveRsvpOptions,
) {
  const previous = loadStoredRsvp(guestUuid);
  const revision = options?.revision ?? (previous?.revision ?? 0) + 1;
  const storedValue: StoredRsvp = {
    guestUuid,
    answers,
    pendingSync: options?.pendingSync ?? previous?.pendingSync ?? true,
    updatedAt: options?.updatedAt ?? new Date().toISOString(),
    revision,
    lastSyncedAt: options?.lastSyncedAt ?? previous?.lastSyncedAt,
  };

  window.localStorage.setItem(makeStorageKey(guestUuid), JSON.stringify(storedValue));
  return storedValue;
}

export function markRsvpSynced(
  guestUuid: string,
  answers: RsvpAnswers,
  revision: number,
  updatedAt: string,
) {
  const current = loadStoredRsvp(guestUuid);

  if (!current || current.revision !== revision) {
    return current;
  }

  return saveRsvpLocally(guestUuid, answers, {
    pendingSync: false,
    lastSyncedAt: new Date().toISOString(),
    revision,
    updatedAt,
  });
}
