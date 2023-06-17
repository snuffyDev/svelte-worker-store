<script>
	import { onMount } from 'svelte';

	let canvas;
	let context;
	let drawing;
	let startPos = {};
	let isDrawing = false;
	onMount(() => {
		if (canvas) {
			context = canvas.getContext('2d');
			context.lineWidth = 3;
			canvas.width = window.innerWidth / 1.125;
			canvas.height = window.innerHeight / 2.5;
		}
	});

	function draw({ offsetX: x1, offsetY: y1 }) {
		if (!canvas) return;

		if (!isDrawing) return;

		const { x, y } = startPos;
		context.beginPath();
		context.moveTo(x, y);
		context.lineTo(x1, y1);
		context.closePath();
		context.stroke();

		startPos = { x: x1, y: y1 };
	}

	function start({ offsetX: x, offsetY: y }) {
		isDrawing = true;
		startPos = { x, y };
	}
	function end() {
		isDrawing = false;
	}
	const debounce = (cb, duration) => {
		let timer;
		return () => {
			if (timer) clearTimeout(timer);
			timer = setTimeout(cb, duration);
		};
	};

	const resize = debounce(() => {
		if (canvas) {
			canvas.width = window.innerWidth / 1.125;
			canvas.height = window.innerHeight / 2.5;
		}
	}, 300);
</script>

<svelte:window on:resize={resize} on:mouseup={end} on:mousemove={draw} />
<!-- your markup here -->
<canvas bind:this={canvas} on:mousedown={start} />

<style>
	canvas {
		background-color: #eee;
	}
</style>
