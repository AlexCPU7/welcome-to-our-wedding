import { useEffect } from 'react';
import { DressCode } from './components/DressCode';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { InvitationText } from './components/InvitationText';
import { Locations } from './components/Locations';
import { PearlCountdownBlock, PearlDateBlock } from './components/PearlDateBlock';
import { RsvpForm } from './components/RsvpForm';
import { Timeline } from './components/Timeline';
import { Wishes } from './components/Wishes';
import { defaultDesignVariant } from './data/designVariants';
import { getGuestUuid } from './services/guest';

function App() {
  const guest = getGuestUuid();
  const design = defaultDesignVariant;

  useEffect(() => {
    document.documentElement.dataset.design = design;

    const url = new URL(window.location.href);

    if (url.searchParams.has('design')) {
      url.searchParams.delete('design');
      window.history.replaceState({}, '', url);
    }
  }, [design]);

  return (
    <>
      {/* DesignSwitcher is intentionally disabled: Italy is now the primary public design. */}
      {/* <DesignSwitcher selected={design} onSelect={setDesign} /> */}
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
