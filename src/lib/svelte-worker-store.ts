import { writable } from "svelte/store";
import { InlineThread, Thread, type ThreadArgs, ThreadPool, type WorkerThreadFn } from "nanothreads";

export { workerInit } from "nanothreads";

type Unsubscriber = () => void;
type Subscriber<T> = (value: T) => Unsubscriber | void;
type WorkerScript = string | URL;


type ScriptOrHandler<Arguments = void, T = void> = Arguments extends void
? WorkerScript
: WorkerThreadFn<Arguments, T>;

export type { ThreadArgs as ExecutorArgs,ScriptOrHandler as WorkerOrExecutor, WorkerScript };

const SETTER = Symbol("[[Setter]]");


export const channel = <Arguments extends any[], Result>(
	workerOrExecutor: ScriptOrHandler<Arguments, Result>,
	max = 1,
) => {
	let value: Result;
	const workerType = typeof workerOrExecutor === "function" ? 'inline' : 'module'
	const workerCtor = workerType === 'inline' ? InlineThread : Thread;
	const thread = new workerCtor<Arguments, Result>(workerOrExecutor as never, {
		maxConcurrency: max,
		...(workerType === 'module' && {type: "module"}),
	});

	return {
		subscribe(callback: Subscriber<Result>): Unsubscriber {

			const unsub = (thread.onMessage.bind(thread) as typeof thread["onMessage"])((result) => {
				value = result;
				callback(value);
			});

			callback(value);

			return () => {
				unsub();
			};
		},
		[SETTER]: (to: never) => {
			value = to;
		},
		send(...value: [...args: Arguments[]]): Promise<Result> {
			return thread.send(value);
		},
	};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// const derived = <Arguments extends never[], Result>(
// 	store: Writable<Result>,
// 	workerOrExecutor: ScriptOrHandler<Arguments, Result>,
// ) => {
// 	const wrappedStore = channel<Arguments, Result>(workerOrExecutor, 1);
// 	store.subscribe((result) => {
// 		wrappedStore[SETTER](result);
// 	})();

// 	return {
// 		...wrappedStore,
// 		send(...value: Arguments extends never[] ? Arguments : [Arguments]): Promise<Result> {
// 			return wrappedStore.send(...value).then((value) => {
// 				store.set(value);
// 				return value;
// 			});
// 		},
// 	};
// }

class ThreadPoolStore<Arguments, Result> extends ThreadPool<Arguments, Result> {
	private store = writable<Record<number, Result>>({});
	#handlers: Set<Unsubscriber> = new Set([]);
	constructor(...args: ConstructorParameters<typeof ThreadPool<Arguments, Result>>) {
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

export const pooled = <Arguments  = never[], Result = void>(
	workerOrExecutor: ScriptOrHandler<Arguments, Result>,
	{ count = 1, maxConcurrency = 1 }: { count: number; maxConcurrency: number },
) => {
	const task: string | ScriptOrHandler<Arguments, Result> = workerOrExecutor as Exclude<typeof workerOrExecutor, Record<string, never>>

	const pool = new ThreadPoolStore<Arguments, Result>({ task, count, maxConcurrency });

	return {
		send: pool.exec.bind(pool),
		subscribe: pool.subscribe
	};
}

