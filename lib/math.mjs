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
 * Measure the distance between two points.
 *
 * @example distance([30, 0], [0, 40]) == 50
 * @param {Point} a
 * @param {Point} b
 * @return {Number}
 */
export function distance(a, b){
	return Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
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
 * Pair of floats representing Cartesian coordinates.
 * @typedef  {Number[]} Point
 * @property {Number} x
 * @property {Number} y
 */
