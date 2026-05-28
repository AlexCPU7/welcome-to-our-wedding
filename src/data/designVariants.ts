export type DesignVariantId =
  | 'premium'
  | 'botanical'
  | 'rose'
  | 'editorial'
  | 'calendar'
  | 'classic-red'
  | 'blue-polaroid'
  | 'playful-red'
  | 'pearl';

export type DesignVariant = {
  id: DesignVariantId;
  label: string;
  shortLabel: string;
  description: string;
};

export const designVariants: DesignVariant[] = [
  {
    id: 'premium',
    label: 'Premium minimal',
    shortLabel: 'Premium',
    description: 'Спокойный светлый минимализм, много воздуха, champagne и sage.',
  },
  {
    id: 'botanical',
    label: 'Botanical sage',
    shortLabel: 'Botanical',
    description: 'Ботаническое настроение, мягкий sage, натуральная бумага и тонкие линии.',
  },
  {
    id: 'rose',
    label: 'Romantic blush',
    shortLabel: 'Blush',
    description: 'Более нежный и романтичный вариант с blush, rose и тёплым ivory.',
  },
  {
    id: 'editorial',
    label: 'Editorial pearl',
    shortLabel: 'Editorial',
    description: 'Журнальная подача, графичная сетка, pearl grey и выразительная типографика.',
  },
  {
    id: 'calendar',
    label: 'Calendar story',
    shortLabel: 'Calendar',
    description: 'Календарная история дня с тонкой красной линией, сердцами и ключевыми событиями.',
  },
  {
    id: 'classic-red',
    label: 'Classic red cards',
    shortLabel: 'Classic',
    description: 'Ivory-карточки, бордовая рамка, крупные инициалы и изящная свадебная линия.',
  },
  {
    id: 'blue-polaroid',
    label: 'Blue polaroid',
    shortLabel: 'Blue',
    description: 'Голубой акварельный фон, лёгкие вертикальные карточки и polaroid-настроение.',
  },
  {
    id: 'playful-red',
    label: 'Playful hand-drawn',
    shortLabel: 'Playful',
    description: 'Красный фон, кремовые карточки, рукописные заголовки, сердечки и doodle-линии.',
  },
  {
    id: 'pearl',
    label: 'Pearl editorial',
    shortLabel: 'Pearl',
    description: 'Светлый вытянутый макет с жемчужинами, тонкой типографикой и polaroid-фотографиями.',
  },
];

export const defaultDesignVariant: DesignVariantId = 'premium';

export function isDesignVariant(value: string | null): value is DesignVariantId {
  return designVariants.some((variant) => variant.id === value);
}
