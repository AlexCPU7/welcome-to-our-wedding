import { designVariants, type DesignVariantId } from '../data/designVariants';

type DesignSwitcherProps = {
  selected: DesignVariantId;
  onSelect: (variant: DesignVariantId) => void;
};

export function DesignSwitcher({ selected, onSelect }: DesignSwitcherProps) {
  return (
    <aside className="design-switcher" aria-label="Варианты дизайна">
      <div className="design-switcher__header">
        <span>Варианты дизайна</span>
        <small>для выбора концепции</small>
      </div>
      <div className="design-switcher__options">
        {designVariants.map((variant) => (
          <button
            aria-pressed={selected === variant.id}
            className="design-switcher__button"
            key={variant.id}
            onClick={() => onSelect(variant.id)}
            title={variant.description}
            type="button"
          >
            {variant.shortLabel}
          </button>
        ))}
      </div>
    </aside>
  );
}
