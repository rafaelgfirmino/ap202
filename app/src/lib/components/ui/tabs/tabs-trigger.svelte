<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"inline-flex items-center justify-center rounded-xl border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-background/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground",
		className
	)}
	{...restProps}
/>
