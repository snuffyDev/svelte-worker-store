<script>
	import "../global.css";
	import { writable } from "svelte/store";
	import { slide } from "svelte/transition";
	import Canvas from "./_components/Canvas.svelte";
	import { pooled, derived } from "$lib/svelte-worker-store";
	import pi from "./_components/pi.mjs";

	let value = 9150;
	let done = false;
	let count = 0;
	let kind = "thread";
	let mainThreadValue = "";
	export const toast = (callback) => {
		let count = 0;
		let done = false;
		return () => {
			if (count++ < 1) return;
			callback();
		};
	};

	const THREADS = 4;
	const vanillaStore = writable(4);
	const store = pooled(pi, { count: THREADS, maxConcurrency: 4 });
	const handleToast = toast(() => {
		if (!count) return;
		done = true;
		count--;

		setTimeout(() => {
			done = false;
		}, 1000);
	});
	$: $store, handleToast();
	$: console.log($store);
	const send = () => {
		count += 1;
		if (kind === "thread") for (const _ of [...Array(4)]) store.send(value);
		else mainThreadValue = pi(value);
	};

	let link = "";
	const getRandomLink = () =>
		(link =
			"https://picsum.photos/512?" + Math.random().toString(24).slice(2, 7));
</script>

<h1>Calculate Pi Digits</h1>
<button
	on:click={() => {
		kind = "thread";
	}}
	class:active={kind === "thread"}>Thread Store</button
>
<button
	on:click={() => {
		kind = "main";
	}}
	class:active={kind == "main"}>Main Thread</button
>
<p>Result:</p>
{#if $store || mainThreadValue}
	<output
		>{kind === "thread"
			? JSON.stringify($store, null, "\t")
			: mainThreadValue}</output
	>
{:else}
	<code>No input</code>
{/if}
<input type="number" bind:value />
<button on:click={send}>{count ? "Waiting..." : "Calculate"}</button>

<p>Tip: entering 4000 or higher will start to block the main thread.</p>
<h2>Get (relatively) creative!</h2>
<p>
	To show that the UI is still responsive while you wait, doodle on the canvas!
</p>
<br />
<Canvas />
{#if done}
	<div
		style="border: 1px solid var(--sk-text-2); padding: 0.5rem; margin: 1rem; max-width: 60%;font-size: 1.5rem; line-height: 1.5; border-radius: 0.25rem; position: fixed; bottom: 0; left:0; right: 0; margin-inline: auto;"
		in:slide
		out:slide={{ delay: 4000 }}
		class="alert"
	>
		Done!
	</div>
{/if}
