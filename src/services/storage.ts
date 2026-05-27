import { defaultRsvpAnswers, type RsvpAnswers, type StoredRsvp } from '../types/rsvp';

const STORAGE_PREFIX = 'alexey-marina-wedding:rsvp';

const makeStorageKey = (guestUuid: string) => `${STORAGE_PREFIX}:${guestUuid}`;

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
      },
      pendingSync: Boolean(parsed.pendingSync),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
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
  options?: { pendingSync?: boolean; lastSyncedAt?: string },
) {
  const previous = loadStoredRsvp(guestUuid);
  const storedValue: StoredRsvp = {
    guestUuid,
    answers,
    pendingSync: options?.pendingSync ?? previous?.pendingSync ?? true,
    updatedAt: new Date().toISOString(),
    lastSyncedAt: options?.lastSyncedAt ?? previous?.lastSyncedAt,
  };

  window.localStorage.setItem(makeStorageKey(guestUuid), JSON.stringify(storedValue));
  return storedValue;
}

export function markRsvpSynced(guestUuid: string, answers: RsvpAnswers) {
  return saveRsvpLocally(guestUuid, answers, {
    pendingSync: false,
    lastSyncedAt: new Date().toISOString(),
  });
}
