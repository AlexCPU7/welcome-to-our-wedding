export type YesNo = 'yes' | 'no' | '';

export type DrinkOption =
  | 'beer'
  | 'whiskey'
  | 'vodka'
  | 'cognac'
  | 'champagne'
  | 'white_wine'
  | 'red_wine'
  | 'no_alcohol';

export type RsvpAnswers = {
  attendance: YesNo;
  ceremony: YesNo;
  drinks: DrinkOption[];
  allergies: string;
  comment: string;
};

export type StoredRsvp = {
  guestUuid: string;
  answers: RsvpAnswers;
  pendingSync: boolean;
  updatedAt: string;
  lastSyncedAt?: string;
};

export const defaultRsvpAnswers: RsvpAnswers = {
  attendance: '',
  ceremony: '',
  drinks: [],
  allergies: '',
  comment: '',
};
