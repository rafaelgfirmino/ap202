import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronsUpDown, Building2, Menu, PanelRight } from 'lucide-react';
import { useLayout } from './context';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarPrimary } from './sidebar-primary';
import { SidebarSecondary } from './sidebar-secondary';
import { toAbsoluteUrl } from '@/lib/helpers';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useCondominiumContext } from '@/contexts/condominium-context';

export function HeaderLogo() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isMobile, sidebarToggle } = useLayout();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { condominiums, activeCondominium, selectCondominium } = useCondominiumContext();

  // Close sheet when route changes
  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  return (
    <div className="flex border-e border-border items-center gap-2 lg:w-(--sidebar-width)">
      {/* Brand */}
      <div className="flex items-center w-full">
        {/* Logo */}
        <div className="flex items-center justify-center shrink-0 border-e border-border w-(--sidebar-collapsed-width) h-(--header-height) bg-muted">
          <Link to="/layout-14">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo-gray.svg')}
              className="dark:hidden min-h-[30px]"
              alt="Thunder AI Logo"
            />
            <img
              src={toAbsoluteUrl('/media/app/mini-logo-gray-dark.svg')}
              className="hidden dark:block min-h-[30px]"
              alt="Thunder AI Logo"
            />
          </Link>
        </div>

        {/* Mobile sidebar toggle */}
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
                <SidebarPrimary />
                <SidebarSecondary />
              </SheetBody>
            </SheetContent>
          </Sheet>
        )}

        {/* Sidebar header */}
        <div className="flex w-full grow items-center justify-between px-5 gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="inline-flex text-muted-foreground hover:text-foreground px-1.5 -ms-1.5"
              >
                <div className={cn('size-6 flex items-center justify-center rounded-md bg-primary text-primary-foreground')}>
                  <Building2 className="size-4" />
                </div>

                <span className="text-mono text-sm font-medium hidden lg:block">
                  {activeCondominium?.name ?? 'Selecionar condomínio'}
                </span>
                <ChevronsUpDown className="opacity-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              side="bottom"
              align="end"
              sideOffset={10}
              alignOffset={-80}
            >
              {condominiums.map((condominium) => (
                <DropdownMenuItem
                  key={condominium.code}
                  onClick={() => {
                    selectCondominium(condominium.code);
                    navigate(`/condominiums/${condominium.code}`);
                  }}
                  data-active={activeCondominium?.code === condominium.code}
                >
                  <div className={cn('size-6 rounded-md flex items-center justify-center bg-primary text-primary-foreground')}>
                    <Building2 className="size-4" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-mono text-sm font-medium">{condominium.name}</span>
                    <span className="text-xs text-muted-foreground">{condominium.code}</span>
                  </div>
                  {activeCondominium?.code === condominium.code && (
                    <Check className="ms-auto size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sidebar toggle */}
          <Button
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
