import { SidebarSecondary } from "./sidebar-secondary";

export function Sidebar() {
  return (
    <aside
      id="layout-14-sidebar"
      className="fixed start-0 top-(--header-height) bottom-0 z-20 flex overflow-hidden border-e border-[#eceff4] bg-white transition-all duration-300 w-(--sidebar-width) in-data-[sidebar-open=false]:w-0"
    >
      <SidebarSecondary />
    </aside>
  );
}
