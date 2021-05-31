/**
 * Measure the arctangent between two points.
 *
 * An "arctangent" is the angle required for one point to face another.
 *
 * @example angleTo([0, 0], [60, 90]) == 123.69
 * @param {Point} a
 * @param {Point} b
 * @return {Number}
 */
export function angleTo(a, b){
	return (Math.atan2(b[1] - a[1], a[0] - b[0])) * 180 / Math.PI;
}


/**
 * Count the number of bytes needed to store a value.
 *
 * @example byteCount(0x0FFFF) == 2;
 * @example byteCount(0x10000) == 3;
 * @param {Number} value - A positive integer
 * @param {Number} [byteSize=8] - Number of bits per byte
 * @return {Number}
 */
export function byteCount(value, byteSize = 8){
	return Math.max(1, Math.ceil(Math.log2(Math.abs(value) + 1) / byteSize));
}


/**
 * Clamp a value to ensure it falls between a designated range.
 *
 * @example clamp(100, 32) == 32
 * @param {Number} input
 * @param {Number} [min=0]
 * @param {Number} [max=1]
 * @return {Number}
 */
export function clamp(input, min, max){
	[min, max] = null == min ? [0, 1] : null == max ? [0, min] : [min, max];
	return Math.min(Math.max(input, min), max);
}


/**
 * Apply De Casteljau's algorithm to an array of points to ascertain the final midpoint.
 *
 * This formula is the basis of drawing [Bézier curves]{@link http://www.malinc.se/m/DeCasteljauAndBezier.php}.
 *
 * @param {Point[]} points - An array of points, each expressed as an array of two numbers
 * @param {Number} [position=0.5] - A multiplier indicating the current distance along the curve.
 * @return {Point[]} An array of 3 points: in-tangent, midpoint, and out-tangent.
 *
 * @example
 * <caption>
 *    Retrieve the midpoint of a roughly 100×50-sized semicircle: <br/>
 *    <svg width="101" height="50"><title>◠</title><path fill="none" stroke="#000" d="M 0,50 C 0 -15, 100 -15, 100, 50"/></svg>
 * </caption>
 * deCasteljau([
 *    [0,    50], // Left vertex
 *    [0,   -15], // Left vertex's out-tangent ("handle")
 *    [100, -15], // Right vertex's in-tangent
 *    [100,  50], // Right vertex
 * ]) == [
 *    [50, 1.25], // Midpoint's in-tangent
 *    [25, 1.25], // Midpoint
 *    [75, 1.25], // Midpoint's out-tangent
 * ];
 */
export function deCasteljau(points, position = 0.5){
	let a, b, midpoints = [];
	
	while(points.length > 1){
		const num = points.length - 1;
		for(let i = 0; i < num; ++i){
			a = points[i];
			b = points[i+1];
			midpoints.push([
				a[0] + ((b[0] - a[0]) * position),
				a[1] + ((b[1] - a[1]) * position),
			]);
		}
		points = midpoints;
		midpoints = [];
	}

	return [points[0], a, b];
}


/**
 * Convert degrees to radians.
 *
 * @example degToRad(180) == Math.PI
 * @param {Number} value
 * @return {Number}
 */
export function degToRad(value){
	return value * Math.PI / 180;
}


/**
 * Measure the distance between two points.
 *
 * @example distance([30, 0], [0, 40]) == 50
 * @param {Point} a
 * @param {Point} b
 * @return {Number}
 */
export function distance(a, b){
	return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
}


/**
 * Convert a number to normalised scientific notation.
 *
 * @see {@link https://en.wikipedia.org/wiki/Normalized_number}
 * @example normalise(19.9875) == [1.99875, 1]; // 1.99875 × 10¹
 * @example normalise(0.00244) == [2.44, -3];   //    2.44 × 10⁻³
 * @param {Number} value
 * @return {Number[]}
 */
export function normalise(value){
	if(!+value || !isFinite(value)) return [+value, 0];
	let sign = 1;
	if(value < 0){
		value = -value;
		sign = -1;
	}
	let p = 0, n = value;
	if(n >= 10)    while(n >= 10) n = value / 10 ** ++p;
	else if(n < 1) while(n < 1)   n = value * 10 ** -(--p);
	const expo = p;
	
	n = value; p = 0;
	while(~~n !== n && p < 16) n = value * 10 ** ++p;
	value = n / 10 ** (p - -expo);
	return [value * sign, expo];
}


/**
 * Convert radians to degrees.
 *
 * @example radToDeg(Math.PI) == 180
 * @param {Number} value
 * @return {Number}
 */
export function radToDeg(value){
	return value * 180 / Math.PI;
}


/**
 * Generate a random integer within a range.
 *
 * @example random(2, 50) == 23
 * @param {Number} [min=0]
 * @param {Number} max
 * @return {Number}
 */
export function random(min, max){
	if(null == max) [min, max] = [0, min];
	return Math.round(min + ((max - min) * Math.random()));
}


/**
 * Round off a decimal, using the number furthest from zero when tied.
 *
 * @see {@link https://en.wikipedia.org/wiki/Rounding#Round_half_away_from_zero}
 * @example roundTiesToAway(+23.5) == +24;
 * @example roundTiesToAway(-23.5) == -24;
 * @param {Number} input
 * @return {Number}
 */
export function roundTiesToAway(input){
	if(!isFinite(input)) return input;
	const sgn = input < 0 ? (input = -input, -1) : 1;
	const int = input - input % 1;
	return (input < int + 0.5 ? int : int + 1) * sgn;
}


/**
 * Round off a decimal, using the nearest even integer in the event of a tie.
 *
 * @see {@link https://en.wikipedia.org/wiki/Rounding#Round_half_to_even}
 * @example roundTiesToEven(23.5) == 24;
 * @example roundTiesToEven(24.5) == 24;
 * @param {Number} input
 * @return {Number}
 */
export function roundTiesToEven(input){
	if(!isFinite(input)) return input;
	const sgn = input < 0 ? (input = -input, -1) : 1;
	const int = input - input % 1;
	return (input < int + 0.5)
		? int * sgn
		: (int + !!(input > int + 0.5 || int % 2)) * sgn;
}


/**
 * Round off a decimal in the direction of negative infinity.
 *
 * @example roundTowardNegative(+23.75) == +23;
 * @example roundTowardNegative(-23.75) == -24;
 * @param {Number} input
 * @return {Number}
 */
export function roundTowardNegative(input){
	if(!isFinite(input)) return input;
	const int = ~~input;
	return input < 0 && int !== input ? int - 1 : int;
}


/**
 * Round off a decimal in the direction of positive infinity.
 *
 * @example roundTowardPositive(+23.75) == +24;
 * @example roundTowardPositive(-23.75) == -23;
 * @param {Number} input
 * @return {Number}
 */
export function roundTowardPositive(input){
	if(!isFinite(input)) return input;
	const int = ~~input;
	return input > 0 && int !== input ? int + 1 : int;
}


/**
 * Add a list of values together.
 *
 * @example sum(1, 2) == 3;
 * @param {...(Number|BigInt)} values
 * @return {Number}
 */
export function sum(...values){
	let result = 0;
	const {length} = values;
	for(let i = 0; i < length; ++i)
		result += Number(values[i]);
	return result;
}


/**
 * Pair of floats representing Cartesian coordinates.
 * @typedef  {Number[]} Point
 * @property {Number} x
 * @property {Number} y
 */
