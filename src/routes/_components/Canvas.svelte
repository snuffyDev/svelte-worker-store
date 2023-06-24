<script>
	import { onMount } from "svelte";
	import { cubicInOut } from "svelte/easing";

	/**
	 * @type {HTMLCanvasElement}
	 */
	let canvas;
	/**
	 * @type {CanvasRenderingContext2D | null}
	 */
	let context;
	let drawing;
	let startPos = {};
	let currentPos = {};
	let isDrawing = false;
	let frame;
	const debounce = (
		/** @type {TimerHandler} */ cb,
		/** @type {number | undefined} */ duration,
	) => {
		/**
		 * @type {number | undefined}
		 */
		let timer;
		return () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(cb, duration);
		};
	};
	let size = 0;

	const resize = debounce(() => {
		if (canvas) {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
		}
	}, 300);

	onMount(() => {
		const RO = new ResizeObserver(resize);
		if (canvas) {
			RO.observe(canvas);
			context = canvas.getContext("2d");
			if (context) {
				context.lineWidth = 10;
				canvas.width = canvas.clientWidth;
				canvas.height = canvas.clientHeight;
			}
		}
		return () => {
			if (canvas) {
				RO.disconnect();
			}
		};
	});

	function draw({ offsetX: x1, offsetY: y1 }) {
		if (!canvas) return;

		if (!isDrawing) return;

		currentPos = { x: x1, y: y1 };
	}

	function start({ offsetX: x, offsetY: y }) {
		isDrawing = true;
		let start = 0;
		context.lineCap = "round";
		context.lineWidth = 10;
		startPos = { x, y };
		frame = requestAnimationFrame(function run(now) {
			if (!isDrawing) return;
			if (!start) start = now;
			const elapsed = now - start;
			if (elapsed > 16) {
				const { x, y } = startPos;
				const { x: x1, y: y1 } = currentPos;

				if (context) {
					context.beginPath();
					context.moveTo(x, y);

					context.lineTo(x1, y1);
					context.closePath();
					context.stroke();
					startPos = { x: x1, y: y1 };
				}
			}
			frame = requestAnimationFrame(run);
		});
	}
	function end() {
		isDrawing = false;
		startPos = {};
		currentPos = {};
		if (frame) cancelAnimationFrame(frame);
	}
</script>

<svelte:window on:resize={resize} on:mouseup={end} />
<!-- your markup here -->
<canvas
	bind:this={canvas}
	on:mousemove={draw}
	on:mousedown={start}
	class="mb-4"
/>
<button
	type="button"
	class="btn hover:variant-soft bg-error-700 self-end"
	on:click={() => {
		if (context) {
			context.clearRect(0, 0, canvas.width, canvas.height);
		}
	}}>Clear Drawing Canvas</button
>

<style>
	canvas {
		background-color: #eee;
		width: 100%;
		aspect-ratio: 16/9;
	}
</style>
