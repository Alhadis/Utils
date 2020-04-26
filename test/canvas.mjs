import * as utils from "../index.mjs";
import {addCanvas, matchPixels, resetDOM} from "./browser/helpers.mjs";

// Skip suite unless running in a browser
utils.isBrowser() && describe("Canvas-drawing functions", () => {
	describe("drawHTML()", () => {
		const {drawHTML} = utils;
		afterEach(() => resetDOM());
		
		async function testBox(ctx, colour, dx, dy, dw, dh){
			const w = ctx.canvas.width;  dx = +dx || 0; dw = +dw || w;
			const h = ctx.canvas.height; dy = +dx || 0; dh = +dh || h;
			const box = document.createElement("div");
			box.style.background = `#${colour.toString(16).padStart(6, "0")}`;
			box.style.width      = `${w}px`;
			box.style.height     = `${h}px`;
			document.body.appendChild(box);
			await drawHTML(ctx, box, dx, dy, dw, dh);
			
			// Prepare the image data
			const rgba = new Uint8ClampedArray(w * h * 4);
			for(let i = 0; i < rgba.length; i += 4){
				const x = (Math.floor(i / 4) % w) >>> 0;
				const y = (Math.floor(i / 4) / w) >>> 0;
				if((x >= dx && x < dw + dx) && (y >= dy && y < dh + dy)){
					rgba[i + 0] = (colour >>> 16) & 255;
					rgba[i + 1] = (colour >>> 8)  & 255;
					rgba[i + 2] = (colour >>> 0)  & 255;
					rgba[i + 3] = 255;
				}
			}
			matchPixels(rgba, ctx.getImageData(0, 0, w, h).data, w);
			ctx.clearRect(0, 0, w, h);
		}
		
		it("renders HTML elements", async () => {
			const ctx = addCanvas(25);
			await testBox(ctx, 0xFF0000, 0, 0, 20, 20);
			await testBox(ctx, 0x0000FF, 0, 0, 20, 7);
		});
		
		it("controls the offset of rendered subjects", async () => {
			const ctx = addCanvas(25);
			await testBox(ctx, 0xFF0000, 10, 4, 10, 16);
			await testBox(ctx, 0x0000FF, 10, 4, 10, 3);
		});
		
		// FIXME: No support for rendering CSS-loaded fonts
		it.skip("renders text-nodes", async () => {
			const ctx = addCanvas(50);
			const txt = document.createTextNode("ABC");
			const div = document.createElement("div");
			div.style.font = "50px canvas-test";
			div.appendChild(txt);
			document.body.appendChild(div);
			await drawHTML(ctx, div);
		});
	});

	describe("drawPolygon()", () => {
		const {drawPolygon} = utils;
		
		it("draws polygons from a list of points", () => {
			const ctx = addCanvas(25);
			drawPolygon(ctx, [
				[1, 1],   [1, 10],  [5, 10],  [5, 20], [10, 20],
				[10, 7],  [3, 7],   [3, 3],   [12, 3], [12, 23],
				[20, 23], [20, 16], [16, 16], [16, 1],
			], true);
			const {data} = ctx.getImageData(0, 0, 25, 25);
			matchPixels(data, utils.bitmapToRGBA([
				0b0000000000000000000000000,
				0b0111111111111111000000000,
				0b0111111111111111000000000,
				0b0110000000001111000000000,
				0b0110000000001111000000000,
				0b0110000000001111000000000,
				0b0110000000001111000000000,
				0b0111111111001111000000000,
				0b0111111111001111000000000,
				0b0111111111001111000000000,
				0b0000011111001111000000000,
				0b0000011111001111000000000,
				0b0000011111001111000000000,
				0b0000011111001111000000000,
				0b0000011111001111000000000,
				0b0000011111001111000000000,
				0b0000011111001111111100000,
				0b0000011111001111111100000,
				0b0000011111001111111100000,
				0b0000011111001111111100000,
				0b0000000000001111111100000,
				0b0000000000001111111100000,
				0b0000000000001111111100000,
				0b0000000000000000000000000,
				0b0000000000000000000000000,
			], 25));
		});
		
		it("strokes the result by default", () => {
			const size    = 40;
			const empty   = new Uint8ClampedArray(size * 4);
			const red     = empty.map((n, i) => [0xFF, 0, 0, 0xFF][i % 4]);
			const blue    = empty.map((n, i) => [0, 0, 0xFF, 0xFF][i % 4]);
			const ctx     = addCanvas(size);
			ctx.lineWidth = size / 2;
			matchPixels(ctx.getImageData(0, 0, size, 1), empty);
			
			ctx.strokeStyle = "#f00";
			drawPolygon(ctx, [[0, 0], [size, 0]]);
			matchPixels(ctx.getImageData(0, 0, size, 1), red);
			
			ctx.strokeStyle = "#00f";
			drawPolygon(ctx, [[0, 0], [size, 0]]);
			matchPixels(ctx.getImageData(0, 0, size, 1), blue);
		});
		
		it("closes the path automatically", () => {
			const size    = 40;
			const empty   = new Uint8ClampedArray(4);
			const red     = Uint8ClampedArray.from([0xFF, 0, 0, 0xFF]);
			const blue    = Uint8ClampedArray.from([0, 0, 0xFF, 0xFF]);
			const ctx     = addCanvas(size);
			ctx.lineWidth = 3;
			matchPixels(ctx.getImageData(size * 0.50, size * 0.50, 1, 1), empty);
			matchPixels(ctx.getImageData(size * 0.75, size * 0.25, 1, 1), empty);
			matchPixels(ctx.getImageData(size * 0.25, size * 0.75, 1, 1), empty);
			
			ctx.strokeStyle = "#f00";
			ctx.fillStyle   = "#00f";
			drawPolygon(ctx, [[0, 0], [size, 0], [size, size]]);
			ctx.fill();
			ctx.stroke();
			matchPixels(ctx.getImageData(size * 0.50, size * 0.50, 1, 1), red);
			matchPixels(ctx.getImageData(size * 0.75, size * 0.25, 1, 1), blue);
			matchPixels(ctx.getImageData(size * 0.25, size * 0.75, 1, 1), empty);
		});
	});
});
