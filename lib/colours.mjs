/**
 * Convert bitmapped pixels to a stream of RGBA values.
 *
 * Input is interpreted as an array of pixel rows, ordered top-to-bottom,
 * left-to-right. Image height is determined from the number of bitmap rows.
 *
 * @example <caption>Decoding a 2×2-size image of ▚</caption>
 * bitmapToRGBA([0b10, 0b01], 2, 0xFF0000FF) == [
 *    0xFF, 0x00, 0x00, 0xFF, // Top-left
 *    0x00, 0x00, 0x00, 0x00, // Top-right
 *    0x00, 0x00, 0x00, 0x00, // Bottom-left
 *    0xFF, 0x00, 0x00, 0xFF, // Bottom-right
 * ];
 * @param {Bitmap} bitmap
 * @param {Number} [width=32]
 * @param {Number} [height=width]
 * @param {Number} [colour=0x000000FF]
 * @return {Uint8ClampedArray}
 */
export function bitmapToRGBA(bitmap, ...args){
	/** @typedef {Number|BigInt|Array<(Number|BigInt)>} Bitmap */
	
	// Resolve arguments
	if(args.length < 3)
		args.splice(1, 0, args[0]);
	const [width = 32, height = width, colour = 0x000000FF] = args;
	const cast = width > 32 ? BigInt : Number;
	if("object" !== typeof bitmap)
		bitmap = [cast(bitmap)];
	
	const rgba = new Uint8ClampedArray(width * height * 4);
	const {length} = rgba;
	for(let i = 0; i < length; i += 4){
		const x = (Math.floor(i / 4) % width) >>> 0;
		const y = (Math.floor(i / 4) / width) >>> 0;
		if(y >= bitmap.length) break;
		if(cast(bitmap[y]) >> cast(width - x - 1) & cast(1)){
			rgba[i + 0] = 255 & colour >> 24;
			rgba[i + 1] = 255 & colour >> 16;
			rgba[i + 2] = 255 & colour >> 8;
			rgba[i + 3] = 255 & colour;
		}
	}
	return rgba;
}


/**
 * @enum {Function} Methods for compositing two channels of colour data.
 * @param {Number} B - Value of foreground channel (0-255)
 * @param {Number} L - Value of background channel (0-255)
 * @return {Number} An integer within the range 0-255.
 * @see http://web.archive.org/web/20090222030436/http://nathanm.com/photoshop-blending-math/
 * @see https://en.wikipedia.org/wiki/Blend_modes
 *
 * @example <caption>Basic usage</caption>
 * let red   = BlendModes.multiply(overlay[0], backdrop[0]);
 * let green = BlendModes.multiply(overlay[1], backdrop[1]);
 * let blue  = BlendModes.multiply(overlay[2], backdrop[2]);
 * let pixel = [r, g, b];
 *
 * @example <caption>Partial blending (65% opacity)</caption>
 * let red   = BlendModes.alphaF(overlay[0], backdrop[0], BlendModes.multiply, 0.65);
 * let green = BlendModes.alphaF(overlay[1], backdrop[1], BlendModes.multiply, 0.65);
 * let blue  = BlendModes.alphaF(overlay[2], backdrop[2], BlendModes.multiply, 0.65);
 * let pixel = [r, g, b];
 */
export const BlendModes = {
	normal:       B     => B,
	lighten:     (B, L) => L > B ? L : B,
	darken:      (B, L) => L > B ? B : L,
	multiply:    (B, L) => (B * L) / 255,
	average:     (B, L) => (B + L) / 2,
	add:         (B, L) => Math.min(255, B + L),
	subtract:    (B, L) => (B + L < 255) ? 0 : (B + L - 255),
	difference:  (B, L) => Math.abs(B - L),
	negation:    (B, L) => 255 - Math.abs(255 - B - L),
	screen:      (B, L) => 255 - (((255 - B) * (255 - L)) >> 8),
	exclusion:   (B, L) => B + L - 2 * B * L / 255,
	overlay:     (B, L) => L < 128 ? (2 * B * L / 255) : (255 - 2 * (255 - B) * (255 - L) / 255),
	softLight:   (B, L) => L < 128 ? (2 * ((B >> 1) + 64)) * (L / 255) : (255 - (2 * (255 - ((B >> 1) + 64)) * (255 - L) / 255)),
	hardLight:   (B, L) => BlendModes.overlay(L, B),
	colourDodge: (B, L) => 255 === B ? B : Math.min(255, ((L << 8) / (255 - B))),
	colourBurn:  (B, L) => 0 === B ? B : Math.max(0, (255 - ((255 - L) << 8) / B)),
	linearDodge: (B, L) => BlendModes.add(B, L),
	linearBurn:  (B, L) => BlendModes.subtract(B, L),
	linearLight: (B, L) => B < 128 ? BlendModes.linearBurn(2 * B, L) : BlendModes.linearDodge(2 * (B - 128), L),
	vividLight:  (B, L) => B < 128 ? BlendModes.colourBurn(2 * B, L) : BlendModes.colourDodge((2 * (B - 128)), L),
	pinLight:    (B, L) => B < 128 ? BlendModes.darken(2 * B, L)     : BlendModes.lighten(2 * (B - 128), L),
	hardMix:     (B, L) => BlendModes.vividLight(B, L) < 128 ? 0 : 255,
	reflect:     (B, L) => 255 === L ? L : Math.min(255, (B * B / (255 - L))),
	glow:        (B, L) => BlendModes.reflect(L, B),
	phoenix:     (B, L) => Math.min(B, L) - Math.max(B, L) + 255,
	alpha:       (B, L, O) => O * B + (1 - O) * L,
	alphaF:      (B, L, F, O) => BlendModes.alpha(F(B, L), L, O),
};


/**
 * Naïvely convert a CMYK colour value to CMY.
 *
 * @example cmykToCMY([0, 0.35, 0.35, 0]) == [0, 0.35, 0.35];
 * @param  {CMYKColour} input
 * @return {CMYColour}
 */
export function cmykToCMY([c, m, y, k]){
	return [
		c * (1 - k) + k,
		m * (1 - k) + k,
		y * (1 - k) + k,
	];
}


/**
 * Naïvely convert a CMYK colour to RGB.
 *
 * @example cmykToRGB([0.24, 0.52, 0.94, 0]) == [24, 52, 94];
 * @param  {CMYKColour} input
 * @return {RGBColour}
 */
export function cmykToRGB([c, m, y, k]){
	return [
		255 * (1 - c) * (1 - k),
		255 * (1 - m) * (1 - k),
		255 * (1 - y) * (1 - k),
	];
}


/**
 * Naïvely convert a CMY colour value to CMYK.
 *
 * @example cmyToCMYK([0, 0.35, 0.35]) == [0, 0.35, 0.35, 0];
 * @param  {CMYColour} input
 * @return {CMYKColour}
 */
export function cmyToCMYK([c, m, y]){
	const k = Math.min(c, m, y);
	return [
		(c - k) / (1 - k) || 0,
		(m - k) / (1 - k) || 0,
		(y - k) / (1 - k) || 0,
		k,
	];
}


/**
 * Naïvely convert a CMY colour value to RGB.
 *
 * @example cmyToRGB([0, 0.35, 0.35]) == [255, 165.75, 165.75];
 * @param  {CMYColour} input
 * @return {RGBColour}
 */
export function cmyToRGB([c, m, y]){
	return [
		255 * (1 - c),
		255 * (1 - m),
		255 * (1 - y),
	];
}


/**
 * Split a hexadecimal colour into individual RGB components.
 *
 * @example hexToRGB(0xBBFFDD) == [0xBB, 0xFF, 0xDD];
 * @example hexToRGB("5A3BC4") == [0x5A, 0x3B, 0xC4];
 * @param  {String|Number} input
 * @return {RGBColour}
 */
export function hexToRGB(input){
	if("string" === typeof input)
		input = parseInt(input.replace(/^0x|#/i, ""), 16);
	return [
		(input & 0xFF0000) >> 16,
		(input & 0x00FF00) >> 8,
		(input & 0x0000FF) >> 0,
	];
}


/**
 * Convert an HSL colour value to HSV.
 *
 * @example hslToHSV([210, 0.6, 0.24]) == [210, 0.75, 0.375];
 * @param  {HSLColour} input
 * @return {HSVColour}
 */
export function hslToHSV([h, s, l]){
	const v = l + s * Math.min(l, 1 - l);
	s = 0 === v ? 0 : 2 - 2 * l / v;
	return [h % 360, s, v];
}


/**
 * Convert an HSL colour value to RGB.
 *
 * @example hslToRGB([240, 0.25, 0.62]) == [53, 53, 72];
 * @param  {HSLColour} input
 * @return {RGBColour}
 */
export function hslToRGB([h, s, l]){
	const a = s * Math.min(l, 1 - l);
	return [0, 8, 4].map(n => {
		const k = (n + (h / 30)) % 12;
		return (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255;
	});
}


/**
 * Convert an HSV colour value to HSL.
 *
 * @example hsvToHSL([210, 0.75, 0.375]) == [210, 0.6, 0.24];
 * @param  {HSVColour} input
 * @return {HSLColour}
 */
export function hsvToHSL([h, s, v]){
	const l = v - (v * s / 2);
	s = (0 === l || 1 === l) ? 0 : (v - l) / Math.min(l, 1 - l);
	return [h % 360, s, l];
}


/**
 * Convert an HSV colour value to RGB.
 *
 * @example hsvToRGB([60, 1, 0.75]) == [191.25, 191.25, 0];
 * @param  {HSVColour} input
 * @return {RGBColour}
 */
export function hsvToRGB([h, s, v]){
	return [5, 3, 1].map(n => {
		const k = (n + (h / 60)) % 6;
		return (v - v * s * Math.max(Math.min(k, 4 - k, 1), 0)) * 255;
	});
}


/**
 * Naïvely convert an RGB colour value to CMY.
 *
 * @example rgbToCMY([255, 165.75, 165.75]) == [0, 0.35, 0.35];
 * @param  {RGBColour} input
 * @return {CMYColour}
 */
export function rgbToCMY([r, g, b]){
	return [
		1 - (r / 255),
		1 - (g / 255),
		1 - (b / 255),
	];
}


/**
 * Naïvely convert an RGB colour to CMYK.
 *
 * @example rgbToCMYK([232, 170, 255]) == [0.09, 0.33, 0, 0];
 * @param  {RGBColour} input
 * @return {CMYKColour}
 */
export function rgbToCMYK([r, g, b]){
	r /= 255;
	g /= 255;
	b /= 255;
	const k = Math.min(1 - r, 1 - g, 1 - b);
	return [
		(1 - r - k) / (1 - k) || 0,
		(1 - g - k) / (1 - k) || 0,
		(1 - b - k) / (1 - k) || 0,
		k || 0,
	];
}


/**
 * Build a hexadecimal colour from individual RGB components.
 *
 * @example rgbToHex([0xBB, 0xFF, 0xDD]) == 0xBBFFDD;
 * @example rgbToHex([0xFF, 0x05, 0x0D], true) == "#FF050D";
 * @param  {RGBColour} input
 * @param  {Boolean} [asString=false]
 * @return {String|Number}
 */
export function rgbToHex([r, g, b], asString = false){
	return asString
		? "#" + [r, g, b]
			.map(n => (n < 16 ? "0" : "") + n.toString(16))
			.join("").toUpperCase()
		: (r << 16 | g << 8 | b);
}


/**
 * Convert an RGB colour value to HSL.
 *
 * @example rgbToHSL([0, 80, 160]) == [210, 1, 0.314];
 * @param  {RGBColour} input
 * @return {HSLColour}
 */
export function rgbToHSL([r, g, b]){
	r /= 255;
	g /= 255;
	b /= 255;
	const 𝑀 = Math.max(r, g, b);
	const 𝑚 = Math.min(r, g, b);
	const δ = 𝑀 - 𝑚;
	let h;
	switch(𝑀){
		case 𝑚: h = 0; break;
		case r: h = 0 + ((g - b) / δ); break;
		case g: h = 2 + ((b - r) / δ); break;
		case b: h = 4 + ((r - g) / δ); break;
	}
	if(h < 0) h += 360;
	const l = (𝑀 + 𝑚) / 2;
	const s = (0 === 𝑀 || 1 === 𝑚) ? 0 : ((𝑀 - l) / Math.min(l, 1 - l));
	return [(60 * h) % 360, s, l];
}


/**
 * Convert an RGB colour value to HSV.
 *
 * @example rgbToHSV([0, 80, 160]) == [210, 1, 0.6275];
 * @param  {RGBColour} input
 * @return {HSVColour}
 */
export function rgbToHSV([r, g, b]){
	r /= 255;
	g /= 255;
	b /= 255;
	const 𝑀 = Math.max(r, g, b);
	const 𝑚 = Math.min(r, g, b);
	const δ = 𝑀 - 𝑚;
	let h;
	switch(𝑀){
		case 𝑚: h = 0; break;
		case r: h = 0 + ((g - b) / δ); break;
		case g: h = 2 + ((b - r) / δ); break;
		case b: h = 4 + ((r - g) / δ); break;
	}
	if(h < 0) h += 360;
	const s = 𝑀 > 0 ? (𝑀 - 𝑚) / 𝑀 : 0;
	return [(60 * h) % 360, s, 𝑀];
}


/**
 * Tuple of floats representing an unprofiled CMY colour.
 * @typedef  {Number[]} CMYColour
 * @property {Number}   [0] - Cyan    (0-1)
 * @property {Number}   [1] - Magenta (0-1)
 * @property {Number}   [2] - Yellow  (0-1)
 */

/**
 * Tuple of floats representing an unprofiled CMYK colour.
 * @typedef  {Number[]} CMYKColour
 * @property {Number}   [0] - Cyan    (0-1)
 * @property {Number}   [1] - Magenta (0-1)
 * @property {Number}   [2] - Yellow  (0-1)
 * @property {Number}   [3] - Black   (0-1)
 */

/**
 * Tuple of floats representing an HSL colour value.
 * @typedef  {Number[]} HSLColour
 * @property {Number}   [0] - Hue        (0-360)
 * @property {Number}   [1] - Saturation (0-1)
 * @property {Number}   [2] - Luminance  (0-1)
 */

/**
 * Tuple of floats representing an HSV colour value.
 * @typedef  {Number[]} HSVColour
 * @property {Number}   [0] - Hue        (0-360)
 * @property {Number}   [1] - Saturation (0-1)
 * @property {Number}   [2] - Value      (0-1)
 */

/**
 * Tuple of numbers representing an RGB colour value.
 * @typedef  {Number[]} RGBColour
 * @property {Number}   [0] - Red   (0-255)
 * @property {Number}   [1] - Green (0-255)
 * @property {Number}   [2] - Blue  (0-255)
 */
