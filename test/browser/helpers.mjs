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
 * Clear the contents of a <canvas> element or drawing context.
 *
 * Defaults to the last (most recently-added) canvas in the DOM.
 *
 * @param {CanvasRenderingContext2D|HTMLCanvasElement} [subject]
 * @return {void}
 * @internal
 */
export function clearCanvas(subject = null){
	if(!subject)
		[subject] = [...document.getElementsByTagName("canvas")].reverse();
	if(subject instanceof HTMLCanvasElement)
		subject = subject.getContext("2d");
	if(!subject)
		throw new ReferenceError("Nothing to clear");
	const {width, height} = subject.canvas;
	subject.clearRect(0, 0, width, height);
}


/**
 * Ensure a webfont is loaded and rendered.
 *
 * @example await loadFont("Cambria");
 * @param {String} family
 * @return {Promise<void>}
 * @internal
 */
export async function loadFont(family){
	const text = document.createElement("span");
	text.style.font = `32px ${family}`;
	text.textContent = "A";
	document.body.appendChild(text);
	await document.fonts.ready;
	document.body.removeChild(text);
}


/**
 * Assert the colour of a single pixel.
 *
 * @throws {AssertionError}
 * @param {CanvasRenderingContext2D} context
 * @param {Number} x
 * @param {Number} y
 * @param {Number} colour
 * @return {void}
 */
export function matchPixel(context, x, y, colour){
	const {width, height} = context.canvas;
	x = x > 0 && x < 1 ? Math.round(width  * x) : ~~x;
	y = y > 0 && y < 1 ? Math.round(height * y) : ~~y;
	expect(x).to.be.within(0, width);
	expect(y).to.be.within(0, height);
	const expected = new Uint8ClampedArray([
		(colour >> 24) & 255,
		(colour >> 16) & 255,
		(colour >> 8)  & 255,
		(colour >> 0)  & 255,
	]);
	const actual = context.getImageData(x, y, 1, 1).data;
	const toHex  = x => "0x" + x.toString(16).padStart(8, "0").toUpperCase();
	const msg    = `Expected pixel @ [${x}, ${y}] to equal ${toHex(colour)}`;
	expect(actual, msg).to.eql(expected);
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
	for(const style of document.styleSheets)
		if(style.ownerNode instanceof HTMLStyleElement)
			style.ownerNode.remove();
}
