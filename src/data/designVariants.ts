export type DesignVariantId = 'pearl' | 'limoncello';

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
  {
    id: 'limoncello',
    label: 'Limoncello Italy',
    shortLabel: 'Italy',
    description: 'Кремовый итальянский макет с акварельными лимонами, синей типографикой и рукописными акцентами.',
  },
];

export const defaultDesignVariant: DesignVariantId = 'limoncello';

export function isDesignVariant(value: string | null): value is DesignVariantId {
  return designVariants.some((variant) => variant.id === value);
}
