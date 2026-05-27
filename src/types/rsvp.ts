export type YesNo = 'yes' | 'no' | '';

export type DrinkOption =
  | 'beer'
  | 'whiskey'
  | 'vodka'
  | 'cognac'
  | 'champagne'
  | 'white_wine_dry'
  | 'white_wine_semidry'
  | 'white_wine_sweet'
  | 'red_wine_dry'
  | 'red_wine_semidry'
  | 'red_wine_sweet'
  | 'no_alcohol';

export type RsvpAnswers = {
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
  ceremony: '',
  drinks: [],
  allergies: '',
  comment: '',
};
