import { useState } from 'react';
import { Outlet } from '@/lib/router-compat.jsx';
import Header from './Header.jsx';
import Drawer from './Drawer.jsx';
import BottomNav from './BottomNav.jsx';
import Footer from './Footer.jsx';
import ScrollToTop from './ScrollToTop.jsx';
import useBackClose from '../hooks/useBackClose.js';

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [panel, setPanel] = useState(null);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPanel(null);
  };

  useBackClose(drawerOpen, () => {
    if (panel) {
      setPanel(null);
      return true;
    }
    closeDrawer();
    return false;
  });

  return (
    <>
      <ScrollToTop />
      <Header onMenuClick={() => setDrawerOpen(true)} />
      <Drawer open={drawerOpen} onClose={closeDrawer} panel={panel} setPanel={setPanel} />
      <main>
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
