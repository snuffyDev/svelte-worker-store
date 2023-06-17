# svelte-worker-store

:zap: Turbocharge your app with multithreaded Svelte Stores.

> What is this?

`svelte-worker-store` is a small set of Svelte stores that enable you to use Web Workers to process things off the main thread.

Based on another library of mine ([nanothreads](https://www.npmjs.com/package/nanothreads)), `svelte-worker-store` is a tiny wrapper around an already tiny library.

## Features

- Simple and easy to use :100:
- Handle resource-heavy workloads without blocking your app! :sunglasses:
- Tiny bundle size :shipit:

## Installation

```bash
  npm install svelte-worker-store
  pnpm install svelte-worker-store
```

## Usage/Examples

Create a 'channel'

```svelte
<script>
	import { channel } from "svelte-worker-store";

	const add = (a, b) => a + b;

	// Creates a store with a single worker
	// and limits concurrent calls to 2.
	const store = channel(add, 2);

	const handleClick = () => store.send(1, 3);
</script>

<p>Output: {$store}</p>
<button on:click={handleClick}>Add numbers</button>
```

// TODO: more examples
