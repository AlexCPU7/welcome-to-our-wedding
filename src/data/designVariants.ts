export type DesignVariantId = 'pearl';

export type DesignVariant = {
  id: DesignVariantId;
  label: string;
  shortLabel: string;
  description: string;
};

export const designVariants: DesignVariant[] = [
  {
    id: 'pearl',
    label: 'Pearl editorial',
    shortLabel: 'Pearl',
    description: 'Светлый вытянутый макет с жемчужинами, тонкой типографикой и polaroid-фотографиями.',
  },
];

export const defaultDesignVariant: DesignVariantId = 'pearl';

export function isDesignVariant(value: string | null): value is DesignVariantId {
  return designVariants.some((variant) => variant.id === value);
}
