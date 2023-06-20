/* eslint-disable @typescript-eslint/ban-ts-comment */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment

import { workerInit } from "../../../lib/index";

/**
 * @param {number} value
 * @param {number} start1
 * @param {number} stop1
 * @param {number} start2
 * @param {number} stop2
 */
function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

class Complex {
    /**
	 * @param {number} real
	 * @param {number} imaginary
	 */
    constructor(real, imaginary) {
        this.real = real;
        this.imaginary = imaginary;
    }
    /**
	 * @param {Complex} other
	 */
    add(other) {
        return new Complex(this.real + other.real, this.imaginary + other.imaginary);
    }
    /**
	 * @param {Complex} other
	 */
    multiply(other) {
        return new Complex(this.real * other.real - this.imaginary * other.imaginary, this.real * other.imaginary + this.imaginary * other.real);
    }
    magnitude() {
        return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
    }
}

const MAX_ITERATIONS = 10000;
const c = new Complex(-0.8, 0.156); // for Julia set

// Color palette
const palette = [
    [66, 30, 15],
    [25, 7, 26],
    [9, 1, 47],
    [4, 4, 73],
    [0, 7, 100],
    [12, 44, 138],
    [24, 82, 177],
    [57, 125, 209],
    [134, 181, 229],
    [211, 236, 248],
    [241, 233, 191],
    [248, 201, 95],
    [255, 170, 0],
    [204, 128, 0],
    [153, 87, 0],
    [106, 52, 3]
];

/**
 * @param {number} width
 * @param {number} height
 * @param {number} x
 * @param {number} y
 */
function juliaSet(width, height, x, y) {
    let zx = map(x, 0, width, -1.5, 1.5);
    let zy = map(y, 0, height, -1.5, 1.5);
    let z = new Complex(zx, zy);
    let iterations = 0;

    while (iterations < MAX_ITERATIONS && z.magnitude() < 2.0) {
        z = z.multiply(z).add(c);
        iterations++;
    }

    if (iterations < MAX_ITERATIONS) {
        let log_zn = Math.log(z.real * z.real + z.imaginary * z.imaginary) / 2;
        let nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        iterations = iterations + 1 - nu;
    }

    return iterations;
}

/**
 * @param {number} width
 * @param {number} height
 */
export async function generateJuliaSet(width, height) {
	const canvas = new OffscreenCanvas(width, height);
	const context = canvas.getContext("2d");
	// @ts-ignore
	width = ~~width;
	// @ts-ignore
	height = ~~height;
	// @ts-ignore
	canvas.width = width;
	canvas.height = height;
	// @ts-ignore
	const imageData = context.createImageData(width, height);

	const data = imageData.data;
   for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let value = juliaSet(width, height, x, y);
            let color = palette[Math.floor(value) % palette.length]; // color from the palette

            let pix = (x + y * width) * 4;
            data[pix + 0] = color[0];
            data[pix + 1] = color[1];
            data[pix + 2] = color[2];
            data[pix + 3] = 255; // fully opaque
        }
    }


	context?.putImageData(imageData, 0, 0);
	return await canvas.convertToBlob();
}

// eslint-disable-next-line no-undef
workerInit(globalThis, async (/** @type {[width: number, height: number]} args */ ...args  ) => await generateJuliaSet(...args));
export {};
