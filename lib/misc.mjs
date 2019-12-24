import {deCasteljau} from "./math.mjs";


/**
 * Return the subproperty located on an object at the designated path.
 *
 * @example
 * resolveProperty({foo: ["qux"]},  "foo[0]")    == "qux"
 * resolveProperty({foo: [0, [1]]}, "foo[1][9]") == undefined
 *
 * @param {Object} object
 *    Subject to search the property values of.
 *
 * @param {String} path
 *    A string describing an accessor chain pointing to the desired property.
 *
 * @param {Boolean} [usePrevious=false]
 *    Instead of returning `undefined` for missing/invalid properties,
 *    return the last valid value that was accessed.
 * @example resolveProperty({foo: [0, [1]]}, "foo[1][9]", true) == 1
 *
 * @return {*}
 *    Value of the referenced property, or `undefined` if the path
 *    pointed to an invalid or missing property.
 */
export function resolveProperty(object, path, usePrevious = false){
	const segments = path.replace(/\[(['"])?([^\]]+)\1\]/g, ".$2").split(/\./);
	const {length} = segments;
	let prevObject = object;
	for(let i = 0; i < length; ++i){
		const name = segments[i];
		if(undefined === prevObject || !(name in prevObject))
			return usePrevious ? prevObject : undefined;
		prevObject = prevObject[name];
		if(i >= length - 1) return prevObject;
	}
	return undefined;
}


/**
 * Recursively alphabetise enumerable properties of an object.
 *
 * @param {Object}  input - Object being alphabetised; not modified by function.
 * @param {Boolean} [strictCase=false] - Order case-sensitively (capitals first).
 * @return {Object} Copy of input with all enumerable properties alphabetised.
 */
export function alphabetiseProperties(input, strictCase = false){
	const stringTag = Object.prototype.toString.call(input);
	
	// Regular JavaScript object: enumerate properties
	if("[object Object]" === stringTag){
		let keys = Object.keys(input);
		
		keys = strictCase
			? keys.sort()
			: keys.sort((a, b) => {
				const A = a.toLowerCase();
				const B = b.toLowerCase();
				if(A < B) return -1;
				if(A > B) return 1;
				return 0;
			});
		
		const result = {};
		for(const i of keys)
			result[i] = alphabetiseProperties(input[i]);
		return result;
	}
	
	// Array: ensure properties are sorted
	else if("[object Array]" === stringTag)
		return Array.prototype.map.call(input, e => alphabetiseProperties(e));
	
	// Neither: return untouched
	return input;
}


/**
 * Retrieve a descriptor for each property available on an object.
 *
 * Both inherited and non-enumerable properties are included.
 * The usual rules of prototypal inheritance apply; redefined
 * properties replace their inherited counterparts.
 *
 * @param {Object} subject
 * @return {Map} A list of property descriptors keyed by name.
 * @example getProperties(foo) == Map{"keys" => descriptors}
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
		? [input]
		: refs.add(input) && Array.from(input);
	
	const output = [];
	for(const value of input){
		if(!value) continue;
		switch(typeof value){
			case "string":
				output.push(...value.split(/\s+/));
				break;
			case "object":
				if(refs.has(value)) continue;
				refs.add(value);
				output.push(...collectStrings(value, refs));
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
		? new RegExp(pattern)
		: pattern;
	
	const output = {};
	for(const key of Object.keys(subject).filter(k => pattern.test(k)))
		output[key] = subject[key];
	return output;
}


/**
 * Determine if the environment supports DOM APIs natively.
 * @see {@link https://ecma-international.org/ecma-262/#sec-IsHTMLDDA-internal-slot|`[[IsHTMLDDA]]`}
 * @see {@link https://mdn.io/document.all}
 * @return {Boolean}
 */
export function isNativeDOM(){
	try{
		const self = "object" === typeof globalThis
			? globalThis
			: "object" === typeof global
				? global
				: this;
		
		const {document, window} = self;
		if("object" !== typeof document || "object" !== typeof window)
			return false;
		
		const {HTMLAllCollection} = window;
		if("function" !== typeof HTMLAllCollection)
			return false;
		
		const {all} = document;
		if("undefined" === typeof all && HTMLAllCollection === all.constructor)
			return true;
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
	
	const output = {};
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
