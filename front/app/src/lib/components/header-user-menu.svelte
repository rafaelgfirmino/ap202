<script lang="ts">
	import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
	import BellIcon from "@lucide/svelte/icons/bell";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	let {
		user,
	}: {
		user: {
			name: string;
			email: string;
			avatar: string;
		};
	} = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				id="header-user-menu-trigger"
				variant="ghost"
				class="h-9 gap-2 px-2"
				{...props}
			>
				<Avatar.Root class="size-8 rounded-lg">
					<Avatar.Image src={user.avatar} alt={user.name} />
					<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
				</Avatar.Root>
				<div id="header-user-menu-summary" class="hidden text-left sm:grid">
					<span id="header-user-menu-name" class="max-w-32 truncate text-sm font-medium">
						{user.name}
					</span>
					<span id="header-user-menu-email" class="max-w-32 truncate text-xs text-muted-foreground">
						{user.email}
					</span>
				</div>
				<ChevronsUpDownIcon class="size-4 opacity-60" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content
		id="header-user-menu-content"
		class="min-w-56 rounded-lg"
		side="bottom"
		align="end"
		sideOffset={6}
	>
		<DropdownMenu.Label class="p-0 font-normal">
			<div id="header-user-menu-card" class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
				<Avatar.Root class="size-8 rounded-lg">
					<Avatar.Image src={user.avatar} alt={user.name} />
					<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
				</Avatar.Root>
				<div id="header-user-menu-card-summary" class="grid flex-1 text-start text-sm leading-tight">
					<span id="header-user-menu-card-name" class="truncate font-medium">{user.name}</span>
					<span id="header-user-menu-card-email" class="truncate text-xs">{user.email}</span>
				</div>
			</div>
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.Item>
				<SparklesIcon />
				Upgrade to Pro
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.Item>
				<BadgeCheckIcon />
				Account
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				<CreditCardIcon />
				Billing
			</DropdownMenu.Item>
			<DropdownMenu.Item>
				<BellIcon />
				Notifications
			</DropdownMenu.Item>
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Item>
			<LogOutIcon />
			Log out
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
