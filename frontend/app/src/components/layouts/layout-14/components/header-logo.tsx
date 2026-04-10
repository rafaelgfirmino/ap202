import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, PanelRight } from 'lucide-react';
import { useLayout } from './context';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarSecondary } from './sidebar-secondary';
import { toAbsoluteUrl } from '@/lib/helpers';

export function HeaderLogo() {
  const { pathname } = useLocation();
  const { isMobile, sidebarToggle } = useLayout();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Close sheet when route changes
  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  return (
    <div id="layout-14-header-logo-root" className="flex items-center gap-2 border-e border-border lg:w-(--sidebar-width)">
      <div className="flex items-center w-full">
        <div id="layout-14-header-logo-mark" className="flex h-(--header-height) shrink-0 items-center justify-center bg-muted px-4">
          <Link id="layout-14-header-logo-link" to="/layout-14" className="p-1.5">
            <img
              id="layout-14-header-logo-image"
              src={toAbsoluteUrl('/media/app/logo.png')}
              className="h-[24px] w-auto"
              alt="Thunder AI Logo"
            />
          </Link>
        </div>

        {isMobile && (
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" mode="icon" size="sm" className="ms-5.5">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              className="p-0 gap-0 w-[280px] lg:w-(--sidebar-width)"
              side="left"
              close={false}
            >
              <SheetHeader className="p-0 space-y-0" />
              <SheetBody className="flex grow p-0">
                <SidebarSecondary />
              </SheetBody>
            </SheetContent>
          </Sheet>
        )}

        <div id="layout-14-header-logo-actions" className="flex w-full grow items-center justify-end px-4">
          <Button
            id="layout-14-header-sidebar-toggle"
            mode="icon"
            variant="ghost"
            onClick={sidebarToggle}
            className="hidden lg:inline-flex text-muted-foreground hover:text-foreground"
          >
            <PanelRight className="-rotate-180 in-data-[sidebar-open=false]:rotate-0 opacity-100" />
          </Button>
        </div>
      </div>
    </div>
  );
}
