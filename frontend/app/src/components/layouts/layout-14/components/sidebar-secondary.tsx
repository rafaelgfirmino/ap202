import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarWorkspacesMenu } from "./sidebar-workspaces-menu";
import { SidebarPrimaryMenu } from "./sidebar-primary-menu";
import { SidebarSearch } from "./sidebar-search";
import { useCondominiumContext } from '@/contexts/condominium-context';
import { ChevronsUpDown } from 'lucide-react';

export function SidebarSecondary() {
  const { activeCondominium } = useCondominiumContext();

  return (
    <div id="layout-14-sidebar-secondary" className="flex h-full w-(--sidebar-width) shrink-0 flex-col bg-white">
      <ScrollArea id="layout-14-sidebar-scroll" className="min-h-0 flex-1">
        <SidebarSearch />
        <SidebarPrimaryMenu />
        <Separator id="layout-14-sidebar-separator-primary" className="mx-4 my-2 bg-[#eef1f5]" />
        <SidebarWorkspacesMenu />
      </ScrollArea>

      <div id="layout-14-sidebar-footer" className="border-t border-[#eceff4] p-3">
        <button
          id="layout-14-sidebar-workspace-button"
          type="button"
          className="flex w-full items-center justify-between rounded-xl bg-[#f8fafc] px-3 py-2.5 text-left transition-colors hover:bg-[#f1f5f9]"
        >
          <div id="layout-14-sidebar-workspace-content" className="min-w-0">
            <div id="layout-14-sidebar-workspace-label" className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#98a2b3]">
              Workspace
            </div>
            <div id="layout-14-sidebar-workspace-name" className="truncate text-sm font-medium text-[#111827]">
              {activeCondominium?.name ?? 'Selecionar condomínio'}
            </div>
          </div>
          <ChevronsUpDown id="layout-14-sidebar-workspace-icon" className="size-4 text-[#98a2b3]" />
        </button>
      </div>
    </div>
  );
}
