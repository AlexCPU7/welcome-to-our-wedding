import { useEffect, useState } from 'react';
import { DesignSwitcher } from './components/DesignSwitcher';
import { DressCode } from './components/DressCode';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { InvitationText } from './components/InvitationText';
import { Locations } from './components/Locations';
import { PearlCountdownBlock, PearlDateBlock } from './components/PearlDateBlock';
import { RsvpForm } from './components/RsvpForm';
import { Timeline } from './components/Timeline';
import { Wishes } from './components/Wishes';
import { defaultDesignVariant, isDesignVariant, type DesignVariantId } from './data/designVariants';
import { getGuestUuid } from './services/guest';

const DESIGN_STORAGE_KEY = 'alexey-marina-wedding:design-variant';

function getInitialDesignVariant(): DesignVariantId {
  const params = new URLSearchParams(window.location.search);
  const designFromUrl = params.get('design');

  if (isDesignVariant(designFromUrl)) {
    window.localStorage.setItem(DESIGN_STORAGE_KEY, designFromUrl);
    return designFromUrl;
  }

  const savedDesign = window.localStorage.getItem(DESIGN_STORAGE_KEY);

  if (isDesignVariant(savedDesign)) {
    return savedDesign;
  }

  return defaultDesignVariant;
}

function App() {
  const guest = getGuestUuid();
  const [design, setDesign] = useState<DesignVariantId>(getInitialDesignVariant);

  useEffect(() => {
    document.documentElement.dataset.design = design;
    window.localStorage.setItem(DESIGN_STORAGE_KEY, design);

    const url = new URL(window.location.href);
    url.searchParams.set('design', design);
    window.history.replaceState({}, '', url);
  }, [design]);

  return (
    <>
      <DesignSwitcher selected={design} onSelect={setDesign} />
      <main className="page-shell" data-design={design}>
        <Hero />
        <PearlDateBlock />
        <InvitationText />
        <PearlCountdownBlock />
        <Timeline />
        <Locations />
        <DressCode />
        <Wishes />
        <RsvpForm guest={guest} />
        <Footer />
      </main>
    </>
  );
}

export default App;
