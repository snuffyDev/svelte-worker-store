<script>
	import JuliaSetThumbnail from "./_components/assets/julia-set.png";
</script>

<div class="header mb-8">
	<h1 class="h1 mb-2 mt-8 font-semibold">svelte-worker-store</h1>
	<p class="mb-4"><em class="ml-1">stores go brrrrrr</em></p>
	<hr class="mt-6" />
</div>
<p>
	<code>svelte-worker-store</code> is a set of highly performant Web Worker-based
	Svelte stores.
</p>
<p>
	Svelte Apps that do resource-intensive tasks (e.g., image manipulation, code
	transpilation, number crunching, etc.) can potentially benefit from this
	library greatly in performance as well as reducing the complexity of your
	code.
</p>
<p class="mt-4">
	Check it out on <a
		class="anchor"
		href="https://github.com/snuffyDev/svelte-worker-store">GitHub</a
	>
	or on the
	<a class="anchor" href="https://www.npmjs.com/package/svelte-worker-store"
		>NPM Registry</a
	>.
</p>
<h2 class="h2 mt-14 mb-4">Demos</h2>
<div class="grid grid-cols-3">
	<div class="card p-1 pt-0 card-hover block relative">
		<a href="/demos/julia-set" class="absolute inset-0"
			><span class="sr-only">julia set</span></a
		>
		<div class="card-header mt-0 mb-2">
			<p class="text-lg font-heading-token leading-tight">4x Julia Set</p>
		</div>
		<section class="p-0">
			<img src={JuliaSetThumbnail} alt="4 times julia set demo" />
		</section>
	</div>
</div>
