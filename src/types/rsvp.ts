export type YesNo = 'yes' | 'no' | '';

export const rsvpDrinkOptions = [
  { value: 'cognac', label: 'Коньяк', payloadKey: 'drink_cognac' },
  { value: 'vodka', label: 'Водка', payloadKey: 'drink_vodka' },
  { value: 'white_wine', label: 'Белое вино', payloadKey: 'drink_white_wine' },
  { value: 'red_wine', label: 'Красное вино', payloadKey: 'drink_red_wine' },
  { value: 'champagne', label: 'Шампанское', payloadKey: 'drink_champagne' },
  { value: 'no_alcohol', label: 'Не пью алкоголь', payloadKey: 'drink_no_alcohol' },
] as const;

export const noAlcoholDrinkOptions = ['no_alcohol'] as const;

export type ActiveDrinkOption = (typeof rsvpDrinkOptions)[number]['value'];
export type LegacyDrinkOption = 'beer' | 'whiskey' | 'will_not_drink_alcohol';
export type DrinkOption = ActiveDrinkOption | LegacyDrinkOption;

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
  revision: number;
  lastSyncedAt?: string;
};

export const defaultRsvpAnswers: RsvpAnswers = {
  attendance: '',
  ceremony: '',
  drinks: [],
  allergies: '',
  comment: '',
};
