<script>
	import "@skeletonlabs/skeleton/styles/skeleton.css";
	// Your selected Skeleton theme:
	import "../theme.postcss";

	// This contains the bulk of Skeletons required styles:
	import "@skeletonlabs/skeleton/styles/skeleton.css";

	// Finally, your application's global stylesheet (sometimes labeled 'app.css')
	import "../app.postcss";
	import { page } from "$app/stores";
	import { AppBar } from "@skeletonlabs/skeleton";
</script>

<svelte:head>
	<title>svelte-worker-store</title>
</svelte:head>
<AppBar background="bg-surface-500">
	<svelte:fragment slot="lead">
		{#if $page.url.pathname !== "/"}
			<a href="/" class="btn variant-ghost-surface"
				>{$page.url.pathname !== "/" ? `\u003C` : ""}
				<span class="ml-2">Back to home</span></a
			>
		{/if}
	</svelte:fragment>
	svelte-worker-store{$page.url.pathname !== "/" ? $page.url.pathname : ""}

	<svelte:fragment slot="trail">
		<a href="/#demos"> Demos </a>
		<a href="/docs"> Documentation </a>
	</svelte:fragment>
</AppBar>
<main class="px-8 pb-8 max-w-[81rem] mx-auto w-full min-h-full overflow-y-auto">
	<slot />
</main>
