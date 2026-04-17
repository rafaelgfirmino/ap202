<script lang="ts">
  import { signOutUser } from "$lib/services/clerk.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import SettingsIcon from "@lucide/svelte/icons/settings";
  import LogOutIcon from "@lucide/svelte/icons/log-out";

  /**
   * Dados exibidos na area do usuario no header.
   * Estes valores podem ser sobrescritos quando o componente for integrado com dados reais.
   */
  let {
    userName = "Usuário",
    userEmail = "usuario@ap202.local",
    userInitials = "US"
  }: {
    userName?: string;
    userEmail?: string;
    userInitials?: string;
  } = $props();

  function navigateTo(path: string) {
    window.location.href = path;
  }

  function handleLogout() {
    void signOutUser();
  }
</script>

<DropdownMenu.Root >
  <DropdownMenu.Trigger id="user-area-trigger" class="cursor-pointer">
      <Avatar.Root id="user-area-avatar" size="lg" class="border">
        <Avatar.Fallback id="user-area-avatar-fallback" class="bg-linear-to-r from-green-500 to-blue-500 text-white">
          {userInitials}
        </Avatar.Fallback>
      </Avatar.Root>
  </DropdownMenu.Trigger>

  <DropdownMenu.Content id="user-area-menu" align="end" class="min-w-48">
    <div id="user-area-summary" class="flex items-center gap-2 px-2 py-2">
      <Avatar.Root id="user-area-summary-avatar" size="sm">
        <Avatar.Fallback id="user-area-summary-avatar-fallback" class="bg-linear-to-r from-green-500 to-blue-500 text-white">
          {userInitials}
        </Avatar.Fallback>
      </Avatar.Root>

      <div id="user-area-summary-content" class="min-w-0">
        <p id="user-area-summary-name" class="truncate text-xs font-medium">
          {userName}
        </p>
        <p id="user-area-summary-email" class="text-muted-foreground truncate text-xs">
          {userEmail}
        </p>
      </div>
    </div>

    <DropdownMenu.Separator id="user-area-separator" />

    <DropdownMenu.Item
      id="user-area-settings-item"
      onSelect={() => navigateTo("/settings")}
      textValue="Configurações"
    >
      <SettingsIcon class="size-4" />
      <span id="user-area-settings-label">Configurações</span>
    </DropdownMenu.Item>

    <DropdownMenu.Item
      id="user-area-logout-item"
      variant="destructive"
      onSelect={handleLogout}
      textValue="Logout"
    >
      <LogOutIcon class="size-4" />
      <span id="user-area-logout-label">Logout</span>
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
