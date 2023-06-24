<script lang="ts">
	import type {
		Highlight as THighlight,
		HighlightSvelte as THighlightSvelte,
	} from "svelte-highlight";
	import typescript from "svelte-highlight/languages/typescript";
	import ghDark from "svelte-highlight/styles/github-dark";
	import { LineNumbers } from "svelte-highlight";

	import { onMount } from "svelte";
	import { viteExampleCode } from "./codeblocks";

	let Highlight: typeof THighlight;
	let HighlightSvelte: typeof THighlightSvelte;

	onMount(async () => {
		await import("svelte-highlight").then((mod) => {
			HighlightSvelte = mod.HighlightSvelte;
			Highlight = mod.Highlight;
		});
	});
</script>

<svelte:head>
	{@html ghDark}
</svelte:head>

<div id="toc-target">
	<h1>Documentation</h1>
	<section>
		<h2 id="installation">Installation</h2>
		<pre>
			<code>
				pnpm add -D svelte-worker-store
				npm add -D svelte-worker-store
			</code>
		</pre>
	</section>
	<hr />
	<section>
		<h2 id="setup">Concepts</h2>
		<h3 id="channels">Stores as Channels</h3>
		<p>
			This library heavily relies on the idea of "stores as channels", which
			means that <em>you</em> aren't the source of truth for your data.&nbsp;Rather,
			your code directly is.
		</p>
		<blockquote class="blockquote my-4">
			<p><em>What does that mean, exactly?</em></p>
		</blockquote>
		<p>
			Using shorthand <code>$store = 5</code> doesn't work as you'd expect (this
			library uses is as an alias for <code>.send</code>). If you call
			<code>store.set(5)</code>, the store's value does not explicitly update to
			5 (depending on your handler, of course!)
		</p>
		<br />
		<p>
			The benefits for this approach (simplicity, readability, reliability) are
			most likely will be more noticable in larger apps that handle a lot of
			data, but still want to maintain reactivity.
		</p>
		<p>
			Essentially, it's a <em>multi-producer</em> (<code>.set</code>,
			<code>.send</code>) /
			<em>single-consumer </em>(the worker) approach. This flow of data reduces
			the cognitive overhead of keeping track of how and where your store is
			used
		</p>

		<h3 id="transferables">Transferable Objects</h3>
		<p>TBD</p>
		<p class="!text-sm tracking-tighter text-opacity-70 text-white">
			For more information, please visit the <a
				class="anchor"
				href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects"
				>MDN Web Docs</a
			>
		</p>
	</section>

	<section>
		<h2 id="usage">Usage</h2>
		<h3 id="api">API</h3>
		<h4 id="api-channel">Channel</h4>
		<p>
			A basic store which updates it's value based on the returned output from
			the provided Handler
		</p>
		<svelte:component
			this={Highlight}
			language={typescript}
			let:highlighted
			code={`import { channel } from 'svelte-worker-store';

const store = channel((a, b) => { return a + b }, 2);

await store.send(1, 2) // returns 3
$store // returns 3`}
		>
			<LineNumbers {highlighted} />
		</svelte:component>
	</section>

	<hr />
	<section>
		<h2 id="vite">Vite</h2>
		<h3 id="worker-script">Using a script file</h3>
		<p>
			When using Vite with svelte-worker-store & using file-based Worker scripts
			you may encounter a problem that results in your script's imports not
			working.
		</p>
		<p>Assume we have the following Worker script <code>./worker.js</code>:</p>
		<svelte:component
			this={Highlight}
			language={typescript}
			code={viteExampleCode[0]}
			let:highlighted
		>
			<LineNumbers {highlighted} />
		</svelte:component>
		<p>
			Trying to import the URL for the script will point to the correct file,
			even in production. However it will not run the file through the build
			step.
		</p>
		<svelte:component
			this={HighlightSvelte}
			let:highlighted
			code={viteExampleCode[1]}
		>
			<LineNumbers {highlighted} />
		</svelte:component>
		<p>
			This will lead to problems since none of your imports will be transformed
			to point to the proper path once built.
		</p>
		<p>
			To fix this, you need to import the URL using <code>&worker?url</code> as the
			import query.
		</p>
		<svelte:component
			this={HighlightSvelte}
			let:highlighted
			code={viteExampleCode[2]}
		>
			<LineNumbers {highlighted} />
		</svelte:component>
		<p>
			Importing the script with <code>&worker?url</code> will run the file through
			Vite's build step, and the file will now work as expected.
		</p>
	</section>
</div>

<style lang="postcss">
	#toc-target {
		@apply bg-surface-800 p-12 py-8 tracking-normal leading-snug;
		min-height: inherit;
	}

	h2 {
		@apply text-2xl font-semibold mb-4;
	}
	p {
		@apply text-base tracking-normal leading-relaxed max-w-prose;
	}
	section {
		@apply mt-8 mb-2;
	}
	:not(pre) > code {
		@apply tracking-tighter bg-stone-800 rounded-sm px-1 text-sm py-0.5;
	}

	pre {
		@apply tracking-tighter bg-surface-600 rounded-sm px-4 border border-gray-800 text-sm py-0.5;
	}

	h3 {
		@apply mb-2;
	}
	h3 {
		@apply mt-4 mb-2 text-lg font-semibold;
	}
	h4 {
		@apply mt-4 mb-2 text-base font-semibold;
	}
	pre {
		@apply whitespace-pre-line;
	}
</style>
