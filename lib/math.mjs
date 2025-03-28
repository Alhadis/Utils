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
 * Convert a number between arbitrary radices.
 *
 * @example convertBase(255, 16) == "FF";
 * @example convertBase("31", 8) == "37";
 * @param  {String|Number} value
 * @param  {Number}  [toRadix=10]
 * @param  {Number}  [fromRadix=10]
 * @param  {?String} [digits="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
 *
 * @throws {TypeError} Input must contain only digits defined in `digits` string.
 * @throws {RangeError} Radices must be positive, non-zero integers.
 *
 * @return {String|Number[]}
 *    Returns the value represented in `toRadix` using numerals drawn from `digits`.
 *    If `digits` was set to `null`, an array of integers is returned instead, each
 *    representing a separate digit.
 */
export function convertBase(value, toRadix = 10, fromRadix = 10, digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"){
	if(!((toRadix   = Number(toRadix))   > 0) || toRadix   % 1
	|| !((fromRadix = Number(fromRadix)) > 0) || fromRadix % 1)
		throw new RangeError("Radix must be a positive, non-zero integer");
	
	if("number" !== typeof value || 10 !== fromRadix){
		value = String(value);
		
		// Use case-insensitive digit-mapping when meaning is unambigious
		const haveUpper = /[A-Z]/.test(digits || "");
		const haveLower = /[a-z]/.test(digits || "");
		if(null === digits || haveUpper && !haveLower) value = value.toUpperCase();
		else if(haveLower && !haveUpper)               value = value.toLowerCase();
		
		const valueDigits = value.split("");
		let negate = false;
		switch(valueDigits[0]){
			case "-": negate = true; // Fall-through
			case "+": valueDigits.shift();
		}
		const {length} = valueDigits;
		value = 0;
		for(let i = 0; i < length;){
			const digit = valueDigits[i];
			const index = (null === digits ? "0123456789ABCDEF" : digits).indexOf(digit);
			if(!~index)
				throw new TypeError(`Invalid digit: ${digit}`);
			value += index * fromRadix ** (length - ++i);
		}
		if(negate)
			value = -value;
	}
	
	const result = [];
	const sign = value < 0 || Object.is(-0, value) ? (value = -value, "-") : "";
	digits = digits && [...digits];
	
	// Cheat for unary systems
	if(1 === toRadix)
		return null === digits
			? new Array(value).fill(sign ? -1 : 1)
			: value ? sign + (digits[1] || digits[0]).repeat(value) : "";
	
	while(value > 0){
		let digitValue = value % toRadix;
		if(null === digits)
			result.unshift(sign ? -digitValue : digitValue);
		else{
			let digitString = "";
			do{
				digitString += digits[digitValue % digits.length];
				digitValue -= digits.length;
			} while(digitValue >= 0);
			result.unshift(digitString);
		}
		value = Math.floor(value / toRadix);
	}
	return null === digits
		? result
		: sign + (result.join("") || "0");
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
 * Determine if a Gregorian year number corresponds to a leap year.
 *
 * @see {@link https://en.wikipedia.org/wiki/Leap_year#Gregorian_calendar}
 * @example isLeapYear(2000) === true;
 * @example isLeapYear(2100) === false;
 * @param {Date|Number} [year] - Year number to query; defaults to current year
 * @return {Boolean}
 */
export function isLeapYear(year = new Date()){
	year = year instanceof Date ? year.getFullYear() : Number(year);
	return isFinite(year) && !(year % 4) && !!(year % 100 || !(year % 400));
}


/**
 * Compute a value between two endpoints using linear interpolation.
 *
 * @see {@link https://en.wikipedia.org/wiki/Linear_interpolation}
 * @example lerp(0, 100, 0.5) === 50;
 * @example lerp([0, 0], [512, 256], 0.5) == [256, 128];
 * @param {Number|Iterable} a
 * @param {Number|Iterable} b
 * @param {Number} [t=0.5]
 * @return {Number|Number[]}
 */
export function lerp(a, b, t = 0.5){
	if(null === a || null === b)
		throw new TypeError("Cannot interpolate null value");
	switch(typeof a){
		case "number":
			if("number" !== typeof b) break;
			return (1 - t) * a + t * b;
		case "object":
		case "function":
			if("object" !== typeof b && "function" !== typeof b) break;
			if(!(Symbol.iterator in a && Symbol.iterator in b))
				throw new TypeError("Cannot interpolate non-iterable object");
			a = [...a], b = [...b];
			const {length} = a;
			if(length !== b.length)
				throw new TypeError("Cannot interpolate vectors of differing rank");
			const r = new Array(length);
			for(let i = 0; i < length; r[i] = (1 - t) * a[i] + t * b[i++]);
			return r;
		default:
			throw new TypeError(`Cannot interpolate ${typeof a} value`);
	}
	throw new TypeError("Cannot interpolate values of mismatching types");
}


/**
 * Compute the average of a set of numbers.
 *
 * @example mean(6, 11, 7) == 8;
 * @param {...(Number|BigInt)} values
 * @return {Number}
 */
export function mean(...values){
	let result = 0;
	const {length} = values;
	for(let i = 0; i < length; result += parseFloat(values[i++]));
	return result /= length;
}


/**
 * Retrieve the “middle” of a list of numbers.
 *
 * @example median(12, 3, 5) == 5;
 * @example median(1, 3, 4, 5) == 3.5;
 * @param {...(Number|BigInt)} values
 * @return {Number}
 */
export function median(...values){
	values = values.map(Number).sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
	const mid = values.length / 2;
	return mid % 1
		? values[Math.floor(mid)]
		: (values[mid] + values[mid - 1]) / 2;
}


/**
 * Retrieve the most frequently-occuring values in a set.
 *
 * Strings are converted to numeric values using {@linkcode parseFloat};
 * bigints whose magnitudes fall below {@link Number.MAX_VALUE} are also
 * converted to floating-point values. Identicality is determined using
 * {@link https://mdn.io/JS/Operators/Equality|loose equality comparison}.
 *
 * @see {@link https://www.mathsisfun.com/mode.html}
 * @example mode(1, 2, 3, 1) == [1];
 * @example mode(1, 2, 2n, 3, "3") == [2, 3];
 * @param {...(Number|BigInt)} values
 * @return {Array<Number|BigInt>}
 */
export function mode(...values){
	const freq = [];
	const {length} = values;
	for(let i = 0; i < length;){
		const n = values[i++];
		const f = freq.find(f => f[0] == n);
		f ? f[1]++ : freq.push([n, 1]);
	}
	// Sort frequencies in descending order
	freq.sort(([, a], [, b]) => a < b ? 1 : a > b ? -1 : 0);
	
	// Resolve mode(s)
	freq.splice(freq.findIndex(([, f]) => f < freq[0][1]));
	return freq.map(f => f[0]).sort((a, b) => a < b ? -1 : !!(a > b));
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
