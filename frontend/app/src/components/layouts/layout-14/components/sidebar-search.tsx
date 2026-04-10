import { Input, InputWrapper } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function SidebarSearch() {
  const handleInputChange = () => {};

  return (
    <div id="layout-14-sidebar-search" className="flex shrink-0 px-4 pt-4">
      <InputWrapper id="layout-14-sidebar-search-wrapper" className="relative">
        <Input
          id="layout-14-sidebar-search-input"
          type="search"
          placeholder="Search..."
          onChange={handleInputChange}
          className="h-10 rounded-xl border-[#e8ecf2] bg-[#fbfcfe] text-sm"
        />
        <Badge
          id="layout-14-sidebar-search-shortcut"
          className="absolute end-2.5 gap-1 border-[#e7ebf1] bg-white text-[#98a2b3]"
          variant="outline"
          size="sm"
        >
          F
        </Badge>
      </InputWrapper>
    </div>
  );
}
