import {
  Search,
  Coffee,
  MessageSquareCode,
  Pin,
  ClipboardList,
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, InputWrapper } from "@/components/ui/input";
import { useLayout } from "./context";
import { toAbsoluteUrl } from "@/lib/helpers";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  AvatarIndicator,
  AvatarStatus,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from "next-themes";
import { useClerk, useUser } from '@clerk/react';

export function HeaderToolbar() {
  const { isMobile } = useLayout();
  const { theme, setTheme } = useTheme();
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  
  const handleInputChange = () => {};
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const displayName = isLoaded ? user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress : undefined;
  const secondaryText = isLoaded ? user?.primaryEmailAddress?.emailAddress : undefined;
  const imageUrl = isLoaded ? user?.imageUrl : undefined;
  const initials = (displayName || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <nav className="flex items-center gap-2.5">
      <Button mode="icon" variant="outline"><Coffee /></Button>
      <Button mode="icon" variant="outline"><MessageSquareCode /></Button>
      <Button mode="icon" variant="outline"><Pin /></Button>

      {!isMobile && (
        <InputWrapper className="w-full lg:w-40">
          <Search />
          <Input type="search" placeholder="Search" onChange={handleInputChange} />
        </InputWrapper>
      )}

      {isMobile ? (
        <>
          <Button variant="outline" mode="icon"><ClipboardList /></Button>
          <Button variant="mono" mode="icon"><Plus /></Button>
        </>
      ) : (
        <>
          <Button variant="outline"><ClipboardList /> Reports</Button>
          <Button variant="mono"><Plus /> Add</Button>
        </>
      )}

      {/* User Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="cursor-pointer">
          <Avatar className="size-7">
            <AvatarImage src={imageUrl || toAbsoluteUrl('/media/avatars/300-2.png')} alt={displayName || '@user'} />
            <AvatarFallback>{initials || 'U'}</AvatarFallback>
            <AvatarIndicator className="-end-2 -top-2">
              <AvatarStatus variant="online" className="size-2.5" />
            </AvatarIndicator>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" side="bottom" align="end" sideOffset={11}>
          {/* User Information Section */}
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar>
              <AvatarImage src={imageUrl || toAbsoluteUrl('/media/avatars/300-2.png')} alt={displayName || '@user'} />
              <AvatarFallback>{initials || 'U'}</AvatarFallback>
              <AvatarIndicator className="-end-1.5 -top-1.5">
                <AvatarStatus variant="online" className="size-2.5" />
              </AvatarIndicator>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-foreground">{displayName || 'Usuário'}</span>
              <span className="text-xs text-muted-foreground">{secondaryText || ''}</span>
            </div>
          </div>
          
          <DropdownMenuSeparator />

          {/* User Actions */}
          <DropdownMenuItem>
            <User/>
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem>
            <Settings/>
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Theme Toggle */}
          <DropdownMenuItem onClick={toggleTheme}>
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Action Items */}
          <DropdownMenuItem
            onClick={async () => {
              await signOut({ redirectUrl: '/login' });
            }}
          >
            <LogOut/>
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
