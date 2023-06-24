import {
	writable,
	derived as internalDerived,
	type Writable,
} from "svelte/store";
import {
	InlineThread,
	Thread,
	type ThreadArgs,
	ThreadPool,
	type WorkerThreadFn,
} from "nanothreads";

export { workerInit } from "nanothreads";

type Unsubscriber = () => void;
type Subscriber<T> = (value: T) => Unsubscriber | void;
type WorkerScript = string | URL;

type ScriptOrHandler<Arguments = void, T = void> = Arguments extends void
	? WorkerScript
	: WorkerThreadFn<Arguments, T>;

export type {
	ThreadArgs as ExecutorArgs,
	ScriptOrHandler as WorkerOrExecutor,
	WorkerScript,
};

const SETTER = Symbol("[[Setter]]");

/**
 * A basic store which updates it's value based on the returned output from the provided Handler,
 *
 * @template Arguments - The types of arguments the worker function receives.
 * @template Result - The type of result returned by the worker function.
 * @param {ScriptOrHandler<Arguments, Result>} workerOrExecutor - Worker script or handler function.
 * @param {number} [max=1] - The maximum number of concurrent tasks. Defaults to 1.
 *
 * @example
 * ```typescript
 * const myChannel = channel<[a: number, b: number], number>((a, b) => a + b);
 *
 * myChannel.send(1, 2);
 *
 * $: console.log($myChannel) // output: 3
 * ```
 */
export const channel = <Arguments extends never[], Result = void>(
	workerOrExecutor: ScriptOrHandler<Arguments, Result> | string | URL,
	max = 1,
) => {
	let value: Result;
	let state: "open" | "closed" = "open";

	const isInlineWorker = typeof workerOrExecutor === "function";

	const WorkerConstructor = isInlineWorker ? InlineThread : Thread;

	const thread = new WorkerConstructor<Arguments, Result>(
		workerOrExecutor as never,
		{
			maxConcurrency: max,
			type: "module",
		},
	);

	/**
	 * Subscribes to the channel to receive results from the worker.
	 * @param {Subscriber<Result>} callback - The function to call when new results are available.
	 */
	const subscribe = (callback: Subscriber<Result>): Unsubscriber => {
		if (state === "closed")
			throw Error("Cannot subscribe to a disposed worker store.");

		const unsubscribe = (
			thread.onMessage.bind(thread) as (typeof thread)["onMessage"]
		)((result) => {
			value = result;
			callback(value);
		});

		callback(value);
		return () => unsubscribe();
	};

	/**
	 * Sends data to the worker thread.
	 * @param {...value: Arguments} - The data to send to the worker.
	 * @returns {Promise<Result>} - A promise that resolves with the result from the worker.
	 */
	const send = (...args: Arguments) => {
		if (state === "closed")
			throw Error("Cannot call 'send' on a disposed worker store.");
		return thread.send(args);
	};

	/**
	 * Set value and inform subscribers.
	 * @alias
	 * @see {@linkplain send}
	 */
	const set = (...value: Arguments) => send(...value);

	return {
		subscribe,
		set,
		send,
		/** @internal */
		[SETTER]: (to: never) => {
			value = to;
		},
		/**
		 * Terminates the worker thread permanently
		 */
		dispose() {
			state = "closed";

			return thread.terminate();
		},
	} as const;
};

/**
 * Creates a channel that sends the output a store and applies an aggregation function over its input value;
 *
 * @template Arguments
 * @template Result
 * @param store = the store to derive from
 * @param workerOrExecutor - a URL, string, or inline function
 * @param [initial_value] - default value
 */
export const derived = <Arguments extends never[], Result = unknown>(
	store: Writable<Arguments>,
	workerOrExecutor: string | URL | ScriptOrHandler<Arguments, Result>,
	initial_value?: Result,
) => {
	const subscribers = new Set<Subscriber<Result>>();
	const makeChannel = () => channel<Arguments, Result>(workerOrExecutor, 1);

	let wrappedStore: ReturnType<typeof makeChannel> | null = makeChannel();
	let currentValue: Result = initial_value as Result;

	let state: "closed" | "open" = "open";

	const _internal_ = internalDerived<typeof store, Result>(
		store,
		(args, set) => {
			const isArray = Array.isArray(args);
			const normalizedArgs = isArray ? args : ([args] as Arguments);
			if (wrappedStore)
				wrappedStore.send(...normalizedArgs).then((value) => {
					currentValue = value;
					set(currentValue);
				});
		},
		initial_value,
	);

	/**
	 * Terminates the worker thread
	 */
	const dispose = () => {
		state = "closed";
		if (wrappedStore) wrappedStore.dispose();
		subscribers.forEach((cb) => cb(currentValue));
		subscribers.clear();
	};

	return {
		subscribe: (...args: Parameters<(typeof _internal_)["subscribe"]>) => {
			if (state === "closed")
				throw Error("Cannot subscribe to a disposed worker store.");

			if (!wrappedStore) wrappedStore = makeChannel();

			const unsub = _internal_["subscribe"](...args);
			subscribers.add(unsub);
			args[0](initial_value as never);
			return () => {
				subscribers.delete(unsub);
				if (subscribers.size === 0) {
					dispose();
				}
			};
		},
		dispose,
	} as const;
};

class ThreadPoolStore<Arguments, Result> extends ThreadPool<Arguments, Result> {
	private store = writable<Record<number, Result>>({});
	#handlers: Set<Unsubscriber> = new Set([]);
	constructor(
		...args: ConstructorParameters<typeof ThreadPool<Arguments, Result>>
	) {
		super(...args);

		const updater = (threadId: number, value: Result) =>
			this.store.update(($store) => {
				return {
					...$store,
					[threadId]: value,
				} as Record<number, Result>;
			});

		for (const thread of this.threads) {
			const callback = (value: Result) => updater(thread.id, value);
			const subscriber = thread.onMessage.bind(thread)(callback as never);
			this.#handlers.add(subscriber);
		}
	}
	async terminate(): Promise<void> {
		this.#handlers.forEach((s) => s());
		this.#handlers.clear();
		await super.terminate();
	}
	public get subscribe() {
		return this.store.subscribe;
	}
}

/**
 * Returns a communication channel to a ThreadPool which runs your handler on the first avaiable worker thread.
 *
 * @template Arguments - The types of arguments the worker function will receive.
 * @template Result - The value returned by the worker function.
 * @param {ScriptOrHandler<Arguments, Result> | URL} workerOrExecutor - URL or path string to a worker script or an inline handler function.
 * @param {Object} options - Configuration options for the worker pool.
 * @param {number} options.count - The number of worker threads to create.
 * @param {number} options.maxConcurrency - The maximum number of concurrent tasks per worker. Defaults to 1.
 *
 * @example
 * ```typescript
 * const myPool = pooled<[a: number, b: number], number>((a, b) => {
 * 	 return a + b;
 * }, { count: 4, maxConcurrency: 2 });
 *
 * // await the result if you want the pool values to be returned from `send`
 * await myPool.send(1, 2); // output: { "0": 3  }
 *
 * // or just use auto-subscriptions
 * myPool.send(1, 2);
 *
 * $: value = $myPool; // output: { "0": 3  }
 *
 * ```
 */
export const pooled = <Arguments = never[], Result = void>(
	workerOrExecutor: string | ScriptOrHandler<Arguments, Result> | URL,
	{ count = 1, maxConcurrency = 1 }: { count: number; maxConcurrency: number },
) => {
	const task: string | ScriptOrHandler<Arguments, Result> =
		workerOrExecutor as never;

	const pool = new ThreadPoolStore<Arguments, Result>({
		task,
		count,
		maxConcurrency,
		type: "module",
	});

	return {
		/**
		 * Sends data to the worker threads.
		 * @returns {typeof pool['exec']} - The function to call to send data to the worker threads.
		 */
		send: pool.exec.bind(pool),
		subscribe: pool.subscribe,
		dispose: pool.terminate.bind(pool),
	};
};
