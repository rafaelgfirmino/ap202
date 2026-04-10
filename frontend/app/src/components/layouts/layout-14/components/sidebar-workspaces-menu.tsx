import { useCallback } from "react";
import { Link, useLocation } from "react-router";
import { MENU_SIDEBAR_WORKSPACES } from "@/config/layout-14.config";
import {
  AccordionMenu,
  AccordionMenuIndicator,
  AccordionMenuSub,
  AccordionMenuSubTrigger,
  AccordionMenuSubContent,
  AccordionMenuItem,
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus } from "lucide-react";
import { useCondominiumContext } from '@/contexts/condominium-context';

export function SidebarWorkspacesMenu() {
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
      selectedValue="workspace-trigger"
      matchPath={matchPath}
      type="single"
      collapsible
      defaultValue="workspace-trigger"
      className="space-y-6 px-3 py-2"
      classNames={{
        item: 'h-10 rounded-xl px-3 text-sm font-medium text-[#344054] hover:bg-[#f7f8fb] hover:text-[#111827] data-[selected=true]:bg-[#f1f3f7] data-[selected=true]:text-[#111827] [&[data-selected=true]_svg]:opacity-100',
        subTrigger: 'group px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#98a2b3] hover:bg-transparent [&_[data-slot="accordion-menu-sub-indicator"]]:hidden',
        subContent: 'ps-0',
        indicator: 'ms-auto flex items-center font-medium text-[#98a2b3]',
      }}
    >
      {MENU_SIDEBAR_WORKSPACES.map((item, index) => (
        <AccordionMenuSub key={index} value="workspaces">
          <AccordionMenuSubTrigger value="workspace-trigger">
            <span>{item.title}</span>
            <AccordionMenuIndicator>
              <Plus className="size-3.5 shrink-0 transition-transform duration-200 hidden group-data-[state=open]:block" />
              <Minus className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:hidden" />
            </AccordionMenuIndicator>
          </AccordionMenuSubTrigger>

          <AccordionMenuSubContent type="single" collapsible parentValue="workspace-trigger">
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
                    {child.badge == 'Pro' && <Badge size="sm" variant="success" appearance="light">{child.badge}</Badge>}
                  </Link>
                </AccordionMenuItem>
              );
            })}
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      ))}
    </AccordionMenu>
  );
}
