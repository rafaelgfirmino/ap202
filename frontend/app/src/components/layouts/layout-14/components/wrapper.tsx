import { Outlet } from 'react-router-dom';
import { useLayout } from './context';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { HeaderBreadcrumbs } from './header-breadcrumbs';

export function Wrapper() {
  const {isMobile} = useLayout();

  return (
    <>
      <Header />
      {!isMobile && <Sidebar />}      

      <div
        id="layout-14-wrapper-content"
        className="grow overflow-y-auto pt-(--header-height-mobile) lg:pt-(--header-height) lg:ps-(--sidebar-width) lg:in-data-[sidebar-open=false]:ps-0 transition-all duration-300"
      >
        <main id="layout-14-wrapper-main" className="grow p-5" role="content">
          {isMobile && <HeaderBreadcrumbs />}
          <Outlet />
        </main>
      </div>
    </>
  );
}
