import * as utils from "../index.mjs";
import {addCanvas, clearCanvas, loadFont, matchPixel, matchPixels, setupHooks} from "./browser/helpers.mjs";

// Skip suite unless running in a browser
utils.isBrowser() && describe("Canvas-drawing functions", () => {
	setupHooks();
	
	describe("drawHTML()", () => {
		const {drawHTML} = utils;
		
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
			matchPixels(ctx.getImageData(0, 0, w, h).data, rgba, w);
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
			const ctx     = addCanvas(size);
			ctx.lineWidth = 3;
			matchPixel(ctx, 0.50, 0.50, 0x00000000);
			matchPixel(ctx, 0.75, 0.25, 0x00000000);
			matchPixel(ctx, 0.25, 0.75, 0x00000000);
			
			ctx.strokeStyle = "#f00";
			ctx.fillStyle   = "#00f";
			drawPolygon(ctx, [[0, 0], [size, 0], [size, size]]);
			ctx.fill();
			ctx.stroke();
			matchPixel(ctx, 0.50, 0.50, 0xFF0000FF);
			matchPixel(ctx, 0.75, 0.25, 0x0000FFFF);
			matchPixel(ctx, 0.25, 0.75, 0x00000000);
		});
	});
	
	describe("drawTextArea()", () => {
		const {drawTextArea} = utils;
		before(() => loadFont("canvas-test"));
		
		function assertGlyph(ctx, char, fontSize, colour, column = 0, row = 0){
			let antipodes;
			switch(char){
				default: throw new TypeError(`Unsupported character: ${char}`);
				case "-": antipodes = [[
					0.50, 0.25, //   ┃ ← Vertical stem
					0.50, 0.50, //   ┃
					0.50, 0.75, //   ┃ ← Left-turned hook
					0.25, 0.75, //━━━┛ ←──┘
				], [
					0.25, 0.25, // Top-left
					0.75, 0.25, // Top-right
					0.75, 0.50, // Centre-right
					0.75, 0.75, // Bottom-right
					0.25, 0.50, // Centre-left
				]]; break;
				case "A": antipodes = [[0.25, 0.75], [0.75, 0.25]]; break; // ◣
				case "a": antipodes = [[0.75, 0.25], [0.25, 0.75]]; break; // ◥
				case "B": antipodes = [[0.25, 0.50], [0.75, 0.50]]; break; // ▌
				case "b": antipodes = [[0.75, 0.50], [0.25, 0.50]]; break; // ▐
				case "C": antipodes = [[0.50, 0.25], [0.50, 0.75]]; break; // ▀
				case "c": antipodes = [[0.50, 0.75], [0.50, 0.25]]; break; // ▄
				case "D": antipodes = [[0.50, 0.50], [
					0.15, 0.15, // Top-left
					0.85, 0.15, // Top-right         ◆
					0.85, 0.85, // Bottom-right
					0.15, 0.85, // Bottom-left
				]]; break;
				case "d": antipodes = [[
					0.15, 0.15, // Top-left
					0.85, 0.15, // Top-right        ◤ ◥
					0.85, 0.85, // Bottom-right     ◣ ◢
					0.15, 0.85, // Bottom-left
				], [0.50, 0.50]];
			}
			const {width} = ctx.measureText(char);
			antipodes.forEach((set, index) => {
				const {length} = set;
				const fill = index ? 0x00000000 : colour;
				for(let i = 0; i < length; i += 2){
					const x = width * column + fontSize * set[i];
					const y = width * row    + fontSize * set[i + 1];
					matchPixel(ctx, x, y, fill);
				}
			});
		}
		
		describe("Drawing", () => {
			it("draws single characters", async () => {
				const fontSize = 32;
				const areaSize = fontSize * 2;
				const ctx      = addCanvas(areaSize);
				ctx.font       = `${fontSize}px canvas-test`;
				ctx.fillStyle  = "#f00";
				
				// Sanity checks
				const empty = new Uint8ClampedArray(areaSize * areaSize * 4);
				matchPixels(ctx.getImageData(0, 0, areaSize, areaSize), empty);
				expect(ctx.measureText(" ").width).to.equal(ctx.measureText("A").width);
				drawTextArea(ctx, " ");
				expect(ctx.getImageData(0, 0, areaSize, areaSize), empty);
				
				for(const char of "AaBbCcDd-"){
					drawTextArea(ctx, char);
					assertGlyph(ctx, char, fontSize, 0xFF0000FF);
					clearCanvas(ctx);
				}
			});
			
			it("draws multiple characters", async () => {
				const fontSize = 32;
				const areaSize = 256;
				const fill     = 0x00FF00FF;
				const ctx      = addCanvas(areaSize);
				ctx.font       = `${fontSize}px canvas-test`;
				ctx.fillStyle  = "#0f0";
				
				drawTextArea(ctx, "ABCD");
				assertGlyph(ctx, "A", fontSize, fill, 0);
				assertGlyph(ctx, "B", fontSize, fill, 1);
				assertGlyph(ctx, "C", fontSize, fill, 2);
				assertGlyph(ctx, "D", fontSize, fill, 3);
				
				// More sanity checks
				expect(() => assertGlyph(ctx, "a", fontSize, fill, 0)).to.throw();
				expect(() => assertGlyph(ctx, "b", fontSize, fill, 1)).to.throw();
				expect(() => assertGlyph(ctx, "c", fontSize, fill, 2)).to.throw();
				expect(() => assertGlyph(ctx, "d", fontSize, fill, 3)).to.throw();
				
				clearCanvas(ctx);
				drawTextArea(ctx, "DCBA");
				assertGlyph(ctx, "A", fontSize, fill, 3);
				assertGlyph(ctx, "B", fontSize, fill, 2);
				assertGlyph(ctx, "C", fontSize, fill, 1);
				assertGlyph(ctx, "D", fontSize, fill, 0);
			});
			
			it("draws multiple lines", async () => {
				const fontSize = 32;
				const areaSize = 256;
				const fill     = 0x0000FFFF;
				const ctx      = addCanvas(areaSize);
				ctx.font       = `${fontSize}px canvas-test`;
				ctx.fillStyle  = "#00f";
				
				drawTextArea(ctx, "AB\nCD");
				assertGlyph(ctx, "A", fontSize, fill, 0, 0);
				assertGlyph(ctx, "B", fontSize, fill, 1, 0);
				assertGlyph(ctx, "C", fontSize, fill, 0, 1);
				assertGlyph(ctx, "D", fontSize, fill, 1, 1);
				clearCanvas(ctx);
				
				drawTextArea(ctx, "abc\nd");
				assertGlyph(ctx, "a", fontSize, fill, 0, 0);
				assertGlyph(ctx, "b", fontSize, fill, 1, 0);
				assertGlyph(ctx, "c", fontSize, fill, 2, 0);
				assertGlyph(ctx, "d", fontSize, fill, 0, 1);
				clearCanvas(ctx);
				
				drawTextArea(ctx, "A\nBCD\nab\nc\nd");
				for(const [char, col, row] of [
					["A", 0, 0],
					["B", 0, 1], ["C", 1, 1], ["D", 2, 1],
					["a", 0, 2], ["b", 1, 2],
					["c", 0, 3],
					["d", 0, 4],
				]) assertGlyph(ctx, char, fontSize, fill, col, row);
				clearCanvas(ctx);
			});
		});
	
		describe("Line-wrapping", () => {
			it("wraps lines too long to fit", async () => {
				const fontSize = 25;
				const areaSize = fontSize * 5;
				const fill     = 0xFF0000FF;
				const ctx      = addCanvas(areaSize);
				ctx.font       = `${fontSize}px canvas-test`;
				ctx.fillStyle  = "#f00";
				
				drawTextArea(ctx, "AB a");
				assertGlyph(ctx, "A", fontSize, fill, 0, 0);
				assertGlyph(ctx, "B", fontSize, fill, 1, 0);
				assertGlyph(ctx, "a", fontSize, fill, 3, 0);
				clearCanvas(ctx);
				
				drawTextArea(ctx, "AB abc");
				assertGlyph(ctx, "A", fontSize, fill, 0, 0);
				assertGlyph(ctx, "B", fontSize, fill, 1, 0);
				assertGlyph(ctx, "a", fontSize, fill, 0, 1);
				assertGlyph(ctx, "b", fontSize, fill, 1, 1);
				assertGlyph(ctx, "c", fontSize, fill, 2, 1);
				clearCanvas(ctx);
				
				drawTextArea(ctx, "ABC ab c");
				assertGlyph(ctx, "A", fontSize, fill, 0, 0);
				assertGlyph(ctx, "B", fontSize, fill, 1, 0);
				assertGlyph(ctx, "C", fontSize, fill, 2, 0);
				assertGlyph(ctx, "a", fontSize, fill, 0, 1);
				assertGlyph(ctx, "b", fontSize, fill, 1, 1);
				assertGlyph(ctx, "c", fontSize, fill, 3, 1);
				clearCanvas(ctx);
				
				drawTextArea(ctx, "ABC ab cd");
				assertGlyph(ctx, "A", fontSize, fill, 0, 0);
				assertGlyph(ctx, "B", fontSize, fill, 1, 0);
				assertGlyph(ctx, "C", fontSize, fill, 2, 0);
				assertGlyph(ctx, "a", fontSize, fill, 0, 1);
				assertGlyph(ctx, "b", fontSize, fill, 1, 1);
				assertGlyph(ctx, "c", fontSize, fill, 0, 2);
				assertGlyph(ctx, "d", fontSize, fill, 1, 2);
				clearCanvas(ctx);
			});
			
			// FIXME: Why is this not hyphenating?
			it.skip("splits words that don't fit on one line", async () => {
				const fontSize = 25;
				const areaSize = fontSize * 4 + 5;
				const fill     = 0x7F0000FF;
				const ctx      = addCanvas(areaSize);
				ctx.font       = `${fontSize}px canvas-test`;
				ctx.fillStyle  = `#${fill.toString(16)}`;
				
				drawTextArea(ctx, "AABBCC");
				assertGlyph(ctx, "A", fontSize, fill, 0, 0); // -> AAB-
				assertGlyph(ctx, "A", fontSize, fill, 1, 0); //    BCC
				assertGlyph(ctx, "B", fontSize, fill, 2, 0);
				assertGlyph(ctx, "-", fontSize, fill, 3, 0);
				assertGlyph(ctx, "B", fontSize, fill, 0, 1);
				assertGlyph(ctx, "C", fontSize, fill, 1, 1);
				assertGlyph(ctx, "C", fontSize, fill, 2, 1);
			});
		});
	});

	describe("getCanvasFont()", () => {
		const {getCanvasFont} = utils;
		
		it("returns a context's current font-style", () => {
			const ctx = addCanvas(25);
			ctx.font  = "24px monospace";
			expect(getCanvasFont(ctx)).to.eql({
				fontFamily:  "monospace",
				fontSize:    "24px",
				fontStyle:   "normal",
				fontVariant: "normal",
				fontWeight:  "400",
				lineHeight:  "normal",
			});
		});
		
		it("isn't affected by external styling", () => {
			const style = document.createElement("style");
			document.head.appendChild(style);
			style.innerHTML = utils.deindent `
				body > :not(#mocha) div, canvas, canvas *{
					font: 10px serif !important;
				}`;
			const ctx = addCanvas(25);
			ctx.font  = "bold italic 32px sans-serif";
			expect(getCanvasFont(ctx)).to.eql({
				fontFamily:  "sans-serif",
				fontSize:    "32px",
				fontStyle:   "italic",
				fontVariant: "normal",
				fontWeight:  "700",
				lineHeight:  "normal",
			});
		});
	});
});
