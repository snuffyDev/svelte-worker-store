export const viteExampleCode = [
    `
// worker.js
import { toUppercase } from '$lib/utils';
import { workerInit } from 'svelte-worker-store';

workerInit(globalThis, (input) => toUppercase(input));

export {};

`,
    `
<script>
    import { channel } from 'svelte-worker-store';
    import MyWorkerURL from './worker?url';

    const store = channel(new URL(MyWorkerURL, import.meta.url));
<\/script>
`,
    `
<script>
    import { channel } from 'svelte-worker-store';
    import MyWorkerURL from './worker?worker&url';

    const store = channel(new URL(MyWorkerURL, import.meta.url));
<\/script>
`,
];