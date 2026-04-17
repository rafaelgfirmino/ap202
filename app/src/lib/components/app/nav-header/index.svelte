<script lang="ts">
 import * as NavigationMenu from "$lib/components/ui/navigation-menu/index.js";
 import * as Tooltip from "$lib/components/ui/tooltip/index.js";
 import { cn } from "$lib/utils.js";
 import { navigationMenuTriggerStyle } from "$lib/components/ui/navigation-menu/navigation-menu-trigger.svelte";
 import type { Component } from "svelte";
 import type { HTMLAttributes } from "svelte/elements";
 import BlocksIcon from "@lucide/svelte/icons/blocks";
 import FileTextIcon from "@lucide/svelte/icons/file-text";
 import SquareStackIcon from "@lucide/svelte/icons/square-stack";
 import HousePlusIcon from "@lucide/svelte/icons/house-plus";
 import { IsMobile } from "$lib/components/hooks/is-mobole.svelte";
 
 const isMobile = new IsMobile();
 
 const components: {
  title: string;
  href: string;
  content?: string;
  icon: Component;
 }[] = [
  {
   title: "Nova Unidade",
   href: "/docs/components/alert-dialog",
   content: "Crie uma nova unidade para o seu projeto",
   icon: HousePlusIcon
  },
  {
   title: "Novo Bloco",
   href: "/docs/components/hover-card",
   icon: SquareStackIcon
  },
  {
   title: "Rateio",
   href: "/docs/components/progress",
   icon: FileTextIcon
  },
  {
   title: "Scroll-area",
   href: "/docs/components/scroll-area",
   icon: FileTextIcon
  },
  {
   title: "Tabs",
   href: "/docs/components/tabs",
   icon: FileTextIcon
  },
  {
   title: "Tooltip",
   href: "/docs/components/tooltip",
   icon: FileTextIcon
  }
 ];
 
 type ListItemProps = HTMLAttributes<HTMLAnchorElement> & {
  title: string;
  href: string;
  content?: string;
  icon: Component;
 };
</script>
 
{#snippet ListItem({
 title,
 href,
 content,
 icon,
 class: className,
 ...restProps
}: ListItemProps)}
 <li>
 <NavigationMenu.Link>
   {#snippet child()}
    <a
     id={`nav-header-link-${title.toLowerCase().replaceAll(" ", "-")}`}
     {href}
     class={cn(
      "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none",
      className
     )}
     {...restProps}
    >
     <div class="flex items-start gap-3">
      <svelte:component this={icon} class="text-muted-foreground mt-0.5 size-4 shrink-0" />
      <div class="space-y-1">
       <div class="text-sm leading-none font-medium">{title}</div>
       {#if content}
        <p class="text-muted-foreground line-clamp-2 text-sm leading-snug">
         {content}
        </p>
       {/if}
      </div>
     </div>
    </a>
   {/snippet}
  </NavigationMenu.Link>
 </li>
{/snippet}

<NavigationMenu.Root viewport={isMobile.current}>
 <NavigationMenu.List class="flex-wrap">
  <NavigationMenu.Item>
   <NavigationMenu.Trigger>Condomínio</NavigationMenu.Trigger>
   <NavigationMenu.Content>
    <ul
     id="nav-header-components-menu"
     class="grid w-[300px] gap-2 p-2 sm:w-[400px] md:w-[500px] md:grid-cols-2 lg:w-[600px]"
    >
     {#each components as component, i (i)}
      {@render ListItem({
       href: component.href,
       title: component.title,
       content: component.content,
       icon: component.icon
             })}
     {/each}
    </ul>
   </NavigationMenu.Content>
  </NavigationMenu.Item>
 
  <NavigationMenu.Item>
   <NavigationMenu.Link>
    {#snippet child()}
     <a id="nav-header-docs-link" href="/docs" class={navigationMenuTriggerStyle()}>
      Docs
     </a>
    {/snippet}
   </NavigationMenu.Link>
  </NavigationMenu.Item>

   <NavigationMenu.Item class="hidden md:block">
      <NavigationMenu.Trigger>With Icon</NavigationMenu.Trigger>
 
      <NavigationMenu.Content>
        <ul class="grid w-[200px] gap-4 p-2">
          <li>
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger id="nav-header-backlog-tooltip-trigger">
                  {#snippet child({ props })}
                    <NavigationMenu.Link
                      id="nav-header-backlog-link"
                      href="##"
                      class="flex-row items-center gap-2"
                      aria-label="Abrir backlog do condomínio"
                      {...props}
                    >
                      <BlocksIcon />
                      Backlog
                    </NavigationMenu.Link>
                  {/snippet}
                </Tooltip.Trigger>

                <Tooltip.Content
                  id="nav-header-backlog-tooltip-content"
                  side="bottom"
                  sideOffset={8}
                >
                  Cria uma nova unidade para o condomínio selecionado. Você pode criar quantas unidades quiser e editá-las posteriormente desdeque não tenham sido utilizadas em lançamentos ou rateios.
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
 
            <NavigationMenu.Link href="##" class="flex-row items-center gap-2">
              <BlocksIcon />
              To Do
            </NavigationMenu.Link>
 
            <NavigationMenu.Link href="##" class="flex-row items-center gap-2">
            
              <BlocksIcon />
              Done
            </NavigationMenu.Link>
          </li>
        </ul>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
 </NavigationMenu.List>
</NavigationMenu.Root>
