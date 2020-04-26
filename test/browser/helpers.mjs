/**
 * @file Helper functions for manipulating the DOM during browser-based tests.
 */

/**
 * Create and attach an HTML <canvas/> element.
 *
 * @example addCanvas(50).drawRect(0, 0, 50, 50);
 * @param {Number} [width=100]
 * @param {Number} [height=width]
 * @return {CanvasRenderingContext2D}
 * @internal
 */
export function addCanvas(width = 100, height = width){
	const canvas  = document.createElement("canvas");
	canvas.width  = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	canvas.style.display = "block";
	context.imageSmoothingEnabled = false;
	document.body.appendChild(canvas);
	return context;
}


/**
 * Compare two lists of RGBA values for equality.
 *
 * @throws {AssertionError}
 * @param {Uint8ClampedArray} expected
 * @param {Uint8ClampedArray} actual
 * @param {Number} width
 * @return {void}
 * @internal
 */
export function matchPixels(actual, expected, width){
	if("function" === typeof ImageData && actual instanceof ImageData)
		actual = actual.data;
	expect(actual).to.have.lengthOf(expected.length);
	const merge = ([r, g, b, a]) => (r << 24 | g << 16 | b << 8 | a) >>> 0;
	const toHex = colour => `#${colour.toString(16).padStart(8, "0").toUpperCase()}`;
	for(let i = 0; i < expected.length; i += 4){
		const x = (Math.floor(i / 4) % width) >>> 0;
		const y = (Math.floor(i / 4) / width) >>> 0;
		const a = merge(actual.slice(i, i + 4));
		const e = merge(expected.slice(i, i + 4));
		const msg = `Expected pixel @ [${x}, ${y}] to equal ${toHex(e)}, got ${toHex(a)}`;
		expect(a, msg).to.equal(e);
	}
}


/**
 * Remove elements from the <body> added during tests.
 * @return {void}
 * @internal
 */
export function resetDOM(){
	const mocha = document.getElementById("mocha");
	for(const node of [...document.body.childNodes])
		if(node !== mocha)
			node.remove();
}
