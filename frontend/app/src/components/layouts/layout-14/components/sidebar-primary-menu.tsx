import { useCallback } from "react";
import { Link, useLocation } from "react-router";
import { MENU_SIDEBAR_MAIN } from "@/config/layout-14.config";
import {
  AccordionMenu,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { useCondominiumContext } from '@/contexts/condominium-context';

export function SidebarPrimaryMenu() {
  const { pathname } = useLocation();
  const { activeCondominium } = useCondominiumContext();

  // Memoize matchPath to prevent unnecessary re-renders
  const matchPath = useCallback(
    (path: string): boolean =>
      path === pathname || (path.length > 1 && pathname.startsWith(path) && path !== '/layout-14'),
    [pathname],
  );

  return (
    <AccordionMenu
      selectedValue={pathname}
      matchPath={matchPath}
      type="multiple"
      className="space-y-6 px-3 py-4"
      classNames={{
        label: 'mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3]',
        item: 'h-10 rounded-xl px-3 text-sm font-medium text-[#344054] hover:bg-[#f7f8fb] hover:text-[#111827] data-[selected=true]:bg-[#f1f3f7] data-[selected=true]:text-[#111827] [&[data-selected=true]_svg]:opacity-100',
        group: '',
      }}
    >
      {MENU_SIDEBAR_MAIN.map((item, index) => {
        return (
          <AccordionMenuGroup key={index}>
            <AccordionMenuLabel>
              {item.title}
            </AccordionMenuLabel>
            {item.children?.map((child, index) => {
              const resolvedPath =
                child.path && activeCondominium
                  ? child.path.replace(':code', activeCondominium.code)
                  : child.path || '#';

              return (
                <AccordionMenuItem key={index} value={resolvedPath}>
                  <Link to={resolvedPath}>
                    {child.icon && <child.icon />}
                    <span>{child.title}</span>
                    {child.badge == 'Beta' && <Badge size="sm" variant="destructive" appearance="light">{child.badge}</Badge>}
                  </Link>
                </AccordionMenuItem>
              )
            })}
          </AccordionMenuGroup>
        )
      })}
    </AccordionMenu>
  );
}
