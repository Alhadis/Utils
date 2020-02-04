import {deCasteljau} from "./math.mjs";


/**
 * Return the subproperty located on an object at the designated path.
 *
 * @example
 *    resolveProperty("foo[0]",    {foo: ["qux"]})  === "qux";
 *    resolveProperty("foo[1][9]", {foo: [0, [1]]}) === undefined;
 *
 * @param {String} path
 *    A string describing an accessor chain pointing to the desired property.
 *
 * @param {Object} object
 *    Subject to search the property values of.
 *
 * @param {Boolean} [usePrevious=false]
 *    Instead of returning `undefined` for missing/invalid properties,
 *    return the last valid value that was accessed.
 *
 * @example
 *    resolveProperty("foo.bar",   {foo: 32},       true) == {foo: 32};
 *    resolveProperty("foo[1][9]", {foo: [0, [1]]}, true) == [1];
 *
 * @return {*}
 *    Value of the referenced property, or `undefined` if the path
 *    pointed to an invalid or missing property.
 */
export function resolveProperty(path, object, usePrevious = false){
	// Spare ourselves the trouble if there's nothing to do
	if(!path || null == object) return;
	
	let i = 0;
	const escRegex = [/\\/g, /"/g, /'/g, /\./g, /\[/g, /\]/g];
	const escChars = [];
	while(escChars.length < 6){
		const char = String.fromCodePoint(i++);
		-1 === path.indexOf(char) && escChars.push(char);
	}
	// Ensure properties containing “special” characters remain intact
	const esc = input => (escRegex.forEach((regex, index) =>
		input = input.replace(regex, escChars[index])), input);
	path = path
		.replace(/"((?:[^\\"]|\\")+)"/g, (_, match) => `"${esc(match)}"`)
		.replace(/'((?:[^\\']|\\')+)'/g, (_, match) => `'${esc(match)}'`)
		.replace(/\[(?!"|')([^\]]+)\]/g, (_, match) => `[${esc(match)}]`);
	
	// Replace [array][like][accessors] with dot.separated.notation
	path = path.replace(/\[(['"])?([^\]]+)\1\]/g, ".$2").replace(/^\./, "");
	
	// Split accessor apart by dots, then restore escaped “special” characters
	const segments = path.split(/\./).map(segment => {
		segment = segment.replace(/^("|')(.*)\1$/, "$2");
		const chars = "\\\"'.[]";
		for(let i = 0; i < escChars.length; ++i){
			const regex = new RegExp(escChars[i].replace(/\W/g, "\\$&"), "g");
			segment = segment.replace(regex, chars[i]);
		}
		return segment;
	});
	
	// Now actually read the damn thing
	const {length} = segments;
	let prevObject = object;
	for(let i = 0; i < length; ++i){
		const name = segments[i];
		if(undefined === prevObject || !(name in Object(prevObject)))
			return usePrevious ? prevObject : undefined;
		prevObject = prevObject[name];
		if(i >= length - 1) return prevObject;
	}
}


/**
 * Retrieve a descriptor for every property available on an object.
 *
 * Unlike {@link Object.getOwnPropertyDescriptors}, inherited
 * properties are included unless redefined by the subject.
 *
 * @param {Object} subject
 * @return {Map.<String|Symbol, PropertyDescriptor>}
 */
export function getProperties(subject){
	let object = subject;
	const refs = new WeakSet();
	const ancestry = [subject];
	while((object = Object.getPrototypeOf(object)) && !refs.has(object))
		ancestry.push(object);
	
	const result = new Map();
	for(const obj of ancestry.reverse()){
		const names = Object.getOwnPropertyNames(obj);
		names.push(...Object.getOwnPropertySymbols(obj));
		for(const name of names){
			const desc = Object.getOwnPropertyDescriptor(obj, name);
			result.set(name, desc);
		}
	}
	
	return result;
}


/**
 * "Flatten" a (possibly nested) list of strings into a single-level array.
 *
 * Strings are split by whitespace as separate elements of the final array.
 *
 * @param {Array|String} input
 * @param {WeakSet} [refs=null]
 * @return {String[]} An array of strings
 */
export function collectStrings(input, refs = null){
	refs = refs || new WeakSet();
	input = "string" === typeof input
		? [input.trim()]
		: refs.add(input) && Array.from(input).slice();
	
	const output = [];
	for(const value of input){
		if(!value) continue;
		switch(typeof value){
			case "object":
				if(refs.has(value)) continue;
				refs.add(value);
				output.push(...collectStrings(value, refs));
				break;
			default:
				output.push(...String(value).trim().split(/\s+/));
		}
	}
	return output;
}


/**
 * Filter an object's properties using a pattern.
 *
 * @example keyGrep(require.cache, /rimraf/);
 * @param {Object} subject
 * @param {RegExp|String} pattern
 * @return {Object}
 */
export function keyGrep(subject, pattern){
	pattern = "string" === typeof pattern
		? new RegExp(pattern.replace(/\W/g, "\\$&"))
		: pattern;
	
	const output = Object.create(null);
	for(const key of Object.keys(subject).filter(k => pattern.test(k)))
		output[key] = subject[key];
	return output;
}


/**
 * Return true if an array-like object contains only 8-bit unsigned integers.
 *
 * @example isByteArray([0, 255, 128]) == true;
 * @example isByteArray([0, 1.5, -45]) == false;
 * @param {*} input
 * @return {Boolean}
 */
export function isByteArray(input){
	if(!input || "object" !== typeof input)
		return false;
	if(input instanceof Uint8Array
	|| input instanceof Uint8ClampedArray
	|| input instanceof ArrayBuffer)
		return true;
	const {length} = input;
	for(let i = 0; i < length; ++i)
		if(input[i] < 0 || input[i] > 255 || input[i] !== ~~input[i])
			return false;
	return length > 0;
}


/**
 * Determine if the environment supports DOM APIs natively.
 * @see {@link https://ecma-international.org/ecma-262/#sec-IsHTMLDDA-internal-slot|`[[IsHTMLDDA]]`}
 * @see {@link https://mdn.io/document.all}
 * @return {Boolean}
 */
export function isNativeDOM(){
	try{
		const {all} = document;
		return "undefined" === typeof all && null === all();
	} catch(e){}
	return false;
}


/**
 * Return true if the given value is a JavaScript primitive.
 *
 * @param {*} input
 * @return {Boolean}
 */
export function isPrimitive(input){
	switch(typeof input){
		case "object":
		case "function":
			return null === input;
		case "undefined":
			return undefined === input;
		default:
			return true;
	}
}


/**
 * Return true if the given value is a {@link RegExp|regular expression}.
 *
 * @param {*} input
 * @return {Boolean}
 */
export function isRegExp(input){
	return "[object RegExp]" === Object.prototype.toString.call(input);
}


/**
 * Return true if the given value is a {@link String}.
 *
 * @param {*} input
 * @return {Boolean}
 */
export function isString(input){
	return "[object String]" === Object.prototype.toString.call(input);
}


/**
 * Return true if the given value is a {@link TypedArray}.
 *
 * @param {*} input
 * @return {Boolean}
 */
export function isTypedArray(input){
	return (
		input instanceof Int8Array         ||
		input instanceof Uint8Array        ||
		input instanceof Uint8ClampedArray ||
		input instanceof Int16Array        ||
		input instanceof Uint16Array       ||
		input instanceof Int32Array        ||
		input instanceof Uint32Array       ||
		input instanceof Float32Array      ||
		input instanceof Float64Array      ||
		input instanceof BigInt64Array     ||
		input instanceof BigUint64Array
	);
}


/**
 * Parse a list of keywords into an object of boolean `true` values.
 *
 * @example parseKeywords("top left") == {top: true, left: true}
 * @param {String|String[]} keywords - A space-delimited string or an array of strings
 * @return {Object.<String, Boolean>}
 */
export function parseKeywords(keywords){
	if(!Array.isArray(keywords)){
		if(!keywords) return null;
		keywords = [keywords];
	}
	
	const output = Object.create(null);
	for(const k of keywords)
		k.split(/\s+/g).filter(i => i).forEach(k => output[k] = true);
	return output;
}


/**
 * Divide an iterable into smaller segments.
 *
 * @example partition(["A", "B", "C"], [2, 1]) == [["A", "B"], ["C"]];
 * @example partition("AAAABB".split(""), [4]) == [["A", "A", "A", "A"], ["B", "B",,,]];
 *
 * @param {String|Iterable} input
 *    A string or array-like object.
 *
 * @param {Number|Number[]} [sizes=[1]]
 *    Size(s) of each segment. Multiple sizes are repeated indefinitely until the
 *    entirety of the input has been allocated. If `input` is not a string and lacks
 *    enough elements to precisely fill the last segment, a sparse array is used.
 *
 * @return {Array<String|Array>}
 *    If called with a string, an array of substrings will be returned.
 *    Otherwise, the function will return an array of arrays.
 *
 * @throws {RangeError} At least one positive, non-zero size must be specified.
 */
export function partition(input, sizes = [1]){
	sizes = "object" !== typeof sizes ? [Number(sizes)] : sizes;
	if(Math.max(...sizes) <= 0)
		throw new RangeError("At least one positive, non-zero size is required");
	
	const isString = "string" === typeof input;
	if("object" === typeof input && input && Symbol.iterator in input && null == input.length)
		input = [...input];
	
	const results = [], {length} = input;
	for(let s = 0, i = 0; i < length;){
		const size = sizes[s++ % sizes.length], part = new Array(size);
		for(let j = 0; j < size && i < length; part[j++] = input[i++]);
		results.push(part);
	}
	return isString ? results.map(x => x.join("")) : results;
}


/**
 * Perform basic animation of an object's property.
 *
 * @uses {@link deCasteljau}
 * @example
 * // Animated scrolling
 * tween(document.documentElement, "scrollTop", scrollY + 600);
 * tween(document.documentElement, "scrollTop", scrollY - 100, {duration: 6000});
 *
 * // Faux progress meter
 * tween(element, "textContent", 100, {
 *     duration: 8000,
 *     curve:    tween.LINEAR,
 *     filter:   num => `Loading: ${num}%`
 * });
 *
 * @param   {Object} subject - Target object whose property is being animated
 * @param   {String} propertyName - Animated property's name
 * @param   {Number} endValue - Animated property's value after tween has completed
 * @param   {Object} [options={}] - Optional tweening settings
 * @param  {Point[]} [options.curve=tween.EASE] - Easing function expressed as a Bézier curve
 * @param {Function} [options.callback=null] - Callback fired after each interpolated frame
 * @param {Function} [options.filter=null] - Override value before assigning to property
 * @param   {Number} [options.duration=300] - Animation length in milliseconds
 * @param   {Number} [options.fps=60] - Animation frame rate
 * @return {Promise} Resolves once playback finishes or is cancelled
 * by calling the `stop` method defined by the returned Promise object.
 */
export function tween(subject, propertyName, endValue, options = {}){
	let stopped = false;
	return Object.assign(new Promise(resolve => {
		const {
			curve    = tween.EASE,
			callback = null,
			filter   = null,
			duration = 300,
			fps      = 60,
		} = options;
		const delay = 1 / fps * 1000;
		const from  = +subject[propertyName] || 0;
		const to    = endValue;
		const step  = (progress, iterations) => {
			if(stopped)
				return resolve();
			const midpoint = deCasteljau(curve, progress)[0][1];
			if(midpoint >= 1){
				const value = (null !== filter) ? filter(to, 1) : to;
				subject[propertyName] = value;
				if(null !== callback)
					callback(value, 1);
				return resolve();
			}
			if(progress){
				let value = from + ((to - from) * midpoint);
				if(null !== filter)
					value = filter(value, progress);
				subject[propertyName] = value;
				if(null !== callback)
					callback(value, progress);
			}
			setTimeout(() => {
				step(delay * iterations / duration, ++iterations);
			}, delay);
		};
		step(0, 0);
	}), {stop: () => stopped = true});
}

Object.assign(tween, {
	LINEAR:      [[0, 0], [1, 1]],
	EASE:        [[0, 0], [.25, .1], [.25, 1], [1, 1]],
	EASE_IN:     [[0, 0], [.42, 0],  [1, 1],   [1, 1]],
	EASE_IN_OUT: [[0, 0], [.42, 0],  [.58, 1], [1, 1]],
	EASE_OUT:    [[0, 0], [0, 0],    [.58, 1], [1, 1]],
});


/**
 * Convert a value to an unsigned integer.
 *
 * @example uint(2.4) === 2;
 * @param {*} value
 * @return {Number}
 */
export function uint(value){
	value = Math.max(+value, 0);
	return Number.isNaN(value) ? NaN : ~~value >>> 0;
}
