<script context="module" lang="ts">
</script>

<script lang="ts">
	import Canvas from "../../_components/Canvas.svelte";
	import UrlFunc from "./juliaSet.js?worker&url";
	import { channel, pooled } from "$lib/index";
	import { generateJuliaSet } from "./juliaSet";
	console.log(UrlFunc);
	// UrlFunc
	const pooledStore = pooled<[width: number, height: number], Promise<Blob>>(
		UrlFunc,
		{
			count: 4,
			maxConcurrency: 2,
		},
	);

	let image: HTMLImageElement[] = [];

	let mode: "sws" | "main" = "sws";
	let running = false;

	const makeMainThreadImage = async () => {
		// reset image sources
		image.forEach((i) => {
			URL.revokeObjectURL(i.src);
			i.src = "";
		});

		running = true;
		for (let idx = 0; idx < image.length; idx++) {
			generateJuliaSet(3000, 3000)
				.then((r) => URL.createObjectURL(r))
				.then((v) => {
					image[idx].src = v;
				})
				.finally(() => {
					if (idx === image.length - 1) {
						running = false;
					}
				});
		}

		running = false;
	};

	const makeImage = async () => {
		running = true;

		image.forEach((i) => {
			URL.revokeObjectURL(i.src);
			i.src = "";
		});

		for (let idx = 0; idx < image.length; idx++) {
			pooledStore
				.send(3000, 3000)
				.then(async (r) => URL.createObjectURL(await r))
				.then((v) => {
					image[idx].src = v;
				})
				.finally(() => {
					if (idx === image.length - 1) {
						running = false;
					}
				});
		}

		if (image) {
		}
	};
</script>

<h1 class="h1 font-medium leading-none font-heading-token mt-4 mb-4">
	Julia Set
</h1>
<p class="text-sm mb-0">
	This demo executes the Julia Set fractal algorithm on 4 worker threads
	simultaneously, creating a total of 4 different images that will be displayed
	below on the left.
</p>
<p class="text-sm mb-0">
	On the right is an interactive canvas that you can draw on while the images
	generate (if you can draw on the canvas, the main thread is not being
	blocked.)
</p>
<br />
<p class="text-sm mb-2">Click on "Generate Fractals" to get started!</p>

<div
	class="grid grid-rows-2 gap-8 p-2 sm:grid-cols-2 sm:grid-rows-1 sm:gap-16 mt-8 border border-solid border-surface-400 border-opacity-30 rounded-xl sm:p-8"
>
	<div class="flex flex-col justify-start">
		<div class="block mb-4">
			<p class="mb-4">Execution Context:</p>
			<div class="grid mt-4 grid-cols-2">
				<button
					disabled={running}
					class="btn {mode === 'sws'
						? 'variant-filled-surface'
						: 'variant-soft'}"
					on:click={() => {
						image.forEach((i) => {
							URL.revokeObjectURL(i.src);
							i.src = "";
						});
						mode = "sws";
					}}>Worker store (sws)</button
				>
				<button
					disabled={running}
					class="btn {mode === 'main'
						? 'variant-filled-primary'
						: 'variant-soft'}"
					on:click={() => {
						image.forEach((i) => {
							URL.revokeObjectURL(i.src);
							i.src = "";
						});
						mode = "main";
					}}>Main thread</button
				>
			</div>
		</div>
		<div class="gallery grid grid-rows-2 grid-cols-2">
			{#each Array(4) as _, i}
				<img width="480" height="480" bind:this={image[i]} />
			{/each}
		</div>
	</div>
	<div class="block">
		<p class="font-semibold flex pt-12 relative">Drawing Canvas</p>
		<div class="flex flex-col mt-7">
			<Canvas />
		</div>
	</div>
</div>
<div class="flex p-2 justify-center">
	<button
		type="button"
		disabled={running}
		class="btn variant-filled-primary center"
		on:click={async () =>
			mode === "sws" ? makeImage() : makeMainThreadImage()}
	>
		{running ? "Generating..." : "Generate Fractals"}
	</button>
</div>

<style lang="postcss">
	button {
		@apply bg-secondary-400;
	}
	p {
		@apply leading-tight my-0 text-base text-opacity-70 text-neutral-50;
	}
</style>
