import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { MENU_SIDEBAR_MAIN } from '@/config/layout-14.config';
import { useMenu } from '@/hooks/use-menu';
import { Wrapper } from './components/wrapper';
import { LayoutProvider } from './components/context';

export function Layout14() {
  const { pathname } = useLocation();
  const { getCurrentItem } = useMenu(pathname);
  const item = getCurrentItem(MENU_SIDEBAR_MAIN);

  return (
    <>
      <Helmet>
        <title>{item?.title}</title>
      </Helmet>

      <LayoutProvider
        style={{
          '--sidebar-width': '260px',
          '--sidebar-collapsed-width': '0px',
          '--sidebar-header-height': '54px',
          '--header-height': '64px',
          '--header-height-mobile': '64px',
        } as React.CSSProperties}
      >
        <Wrapper />
      </LayoutProvider>
    </>
  );
}
