import { useEffect } from 'react';
import { CartDrawer } from './components/CartDrawer';
import { Header } from './components/Chrome';
import { EventQuickModal } from './components/EventQuickModal';
import { Footer } from './components/Footer';
import { SearchOverlay } from './components/SearchOverlay';
import { TicketsModal } from './components/TicketsModal';
import { EventDetail } from './pages/EventDetail';
import { Events } from './pages/Events';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { matchRoute, useRoute } from './router';
import { useScrolled } from './lib/hooks';
import { useStore } from './lib/store';

export function App() {
  const { path } = useRoute();
  const route = matchRoute(path);
  const scrolled = useScrolled(40);
  const { setSearchOpen } = useStore();

  // Atajo "/" para buscar (salvo si ya se está escribiendo en un campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  const overHero = route.name === 'home' || route.name === 'event';

  return (
    <>
      <a href="#contenido" className="skip">Saltar al contenido</a>
      <Header solid={scrolled || !overHero} />
      <main id="contenido" tabIndex={-1}>
        {route.name === 'home' && <Home />}
        {route.name === 'events' && <Events />}
        {route.name === 'event' && <EventDetail slug={route.slug} />}
        {route.name === 'notfound' && <NotFound />}
      </main>
      <Footer />
      <SearchOverlay />
      <CartDrawer />
      <EventQuickModal />
      <TicketsModal />
    </>
  );
}
