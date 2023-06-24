<script lang="ts">
	import { TableOfContents } from "@skeletonlabs/skeleton";
</script>

<div class="toc" />

<div>
	<slot />
	<TableOfContents
		class="bg-surface-700 p-3 py-8 w-full sm:w-[unset]"
		rounded={"rounded-token"}
		scrollParent="main"
		active={"text-red"}
		target="#toc-target"
	/>
</div>

<style>
	div {
		all: inherit;
		display: grid;
		grid-template-columns: 3fr 1fr;
		gap: 4rem;
		min-height: 100%;
	}

	@media screen and (max-width: 596px) {
		div {
			display: flex;
			flex-direction: column-reverse;
			gap: 2rem;
		}
	}
</style>
