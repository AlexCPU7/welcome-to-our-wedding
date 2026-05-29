const ANONYMOUS_GUEST_KEY = 'alexey-marina-wedding:anonymous-uuid';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type GuestIdentity = {
  uuid: string;
  source: 'link' | 'generated';
  isValidLinkUuid: boolean;
};

function createUuid() {
  if ('crypto' in window && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    const normalized = char === 'x' ? value : (value & 0x3) | 0x8;
    return normalized.toString(16);
  });
}

function getOrCreateAnonymousUuid() {
  const savedUuid = window.localStorage.getItem(ANONYMOUS_GUEST_KEY);

  if (savedUuid) {
    return savedUuid;
  }

  const uuid = createUuid();
  window.localStorage.setItem(ANONYMOUS_GUEST_KEY, uuid);
  return uuid;
}

export function getGuestUuid(): GuestIdentity {
  const params = new URLSearchParams(window.location.search);

  if (params.has('uuid')) {
    const uuidFromLink = params.get('uuid') ?? '';

    if (uuidFromLink !== '') {
      return {
        uuid: uuidFromLink,
        source: 'link',
        isValidLinkUuid: uuidPattern.test(uuidFromLink),
      };
    }
  }

  return {
    uuid: getOrCreateAnonymousUuid(),
    source: 'generated',
    isValidLinkUuid: false,
  };
}
