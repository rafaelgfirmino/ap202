<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn(
		"inline-flex h-auto w-fit items-center gap-2 rounded-2xl border border-border bg-muted/30 p-1",
		className
	)}
	{...restProps}
/>
