<!-- src/lib/components/app-header.svelte -->
<script lang="ts">
  import { Separator } from "$lib/components/ui/separator/index.js";
  import Logo from "$lib/components/app/logo/index.svelte";
  import NavHeader from "$lib/components/app/nav-header/index.svelte";
</script>

<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
  <div class="flex h-10 items-center px-4 gap-2">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2 mr-2">
      <div class="size-20 rounded-md flex items-center justify-center">
        <Logo/>
      </div>
    </a>

    <Separator orientation="vertical" class="h-5 mr-2" />

    <NavHeader/>

    <!-- User area -->
    <div class="ml-auto flex items-center gap-1">
    sdsd
    </div>
  </div>
</header>