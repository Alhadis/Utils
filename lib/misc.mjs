import {deCasteljau} from "./math.mjs";


/**
 * Merge sequential ranges of numbers or characters.
 *
 * @example collapseRanges([1, 4, 5, 6, 9, 10])  == [1, [4, 6], [9, 10]];
 * @example collapseRanges(["A", "B", "C", "X"]) == [["A", "C"], "X"];
 * @param  {Array.<Number|String>|String} input
 * @return {Array.<Number|String|Number[]>}
 */
export function collapseRanges(input){
	input = [...input].flatMap(x => "string" === typeof x ? [...x] : x);
	input = [...new Set(input)].sort((a, b, A, B) => (
		(A = typeof a, B = typeof b),
		A < B ? -1 : A > B ? 1 : a < b ? -1 : 1
	));
	const ranges = [];
	const {length} = input;
	for(let range = 0, i = 0; i < length; ++i){
		const curr = input[i];
		const next = input[i + 1];
		const type = typeof curr;
		if(type === typeof next && (
			"number" === type && next === curr + 1 ||
			"string" === type && next.codePointAt(0) === curr.codePointAt(0) + 1
		)) ++range;
		else if(range)
			ranges.push([input[i - range], curr]), range = 0;
		else ranges.push(curr);
	}
	return ranges;
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
 * Return the index of the first matching subsequence.
 *
 * @example <caption>Locating a pair of contiguous numbers</caption>
 *    const bytes = [0, 10, 11, 12, 20, 11];
 *    findSeq(bytes, [11, 12]) === 2;
 *    findSeq(bytes, [11, 12], 3) === -1;
 *    bytes.push(12);
 *    findSeq(bytes, [11, 12], 3) === 5;
 *
 * @example <caption>Deep-equality using a comparator</caption>
 *    import {isDeepStrictEqual as deepEql} from "util";
 *    const input = [[0, 0], [1, 1], [2, 2], [0, 0]];
 *    findSeq(input, [[1, 1], [2, 2]], 0, deepEql) === 1;
 *
 * @param {Array|TypedArray|String} haystack
 * @param {Array|TypedArray|String} needle
 * @param {Number} [offset=0]
 * @param {Comparator} [cmp]
 * @throws {RangeError} Offset must be a finite number
 * @return {Number}
 */
export function findSeq(haystack, needle, offset = 0, cmp = null){
	if("string" === typeof haystack) haystack = [...haystack];
	if("string" === typeof needle)   needle   = [...needle];
	if(!isFinite(offset))
		throw new RangeError("Offset must be finite");

	// Simplify checking for NaN values
	if(null === cmp && (Number.isNaN(needle) || needle.includes(NaN)))
		cmp = (a, b) => a === b || Number.isNaN(a) && Number.isNaN(b);

	// Avoid rigmarole for single-entry sequences
	const len1 = needle.length;
	if(1 === len1)
		return null === cmp
			? haystack.indexOf(needle[0], offset)
			: haystack.findIndex((x, i) => i >= offset && cmp(x, needle[0]));
	
	// Sanitise non-sensical arguments
	const len2 = haystack.length;
	if(offset >= len2 || len1 > len2 || offset + len1 > len2)
		return -1;
	offset = offset < 0 ? len2 - Math.abs(offset) : Number(offset);
	
	// Search loop
	loop: while(-1 !== (offset = null === cmp
		? haystack.indexOf(needle[0], offset)
		: haystack.findIndex((x, i) => i >= offset && cmp(x, needle[0]))
	)) for(let i = 1; i < len1; ++i){
		const a = haystack[offset + i];
		const b = needle[i];
		if(null === cmp ? a !== b : !cmp(a, b)){
			++offset;
			continue loop;
		}
		if(i >= len1 - 1)
			return offset;
	}
	return -1;
}

/**
 * Predicate that determines whether two values are considered equal.
 * @callback Comparator
 * @param {*} a
 * @param {*} b
 * @return {Boolean}
 */


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
 * Return the hexadecimal representation of one or more values.
 *
 * @example hex(0x2F, 0x5A) == "2F 5A";
 * @example hex("\x35\xAF") == "35 AF";
 * @example hex(1, NaN, 76) == "01 -- 4C";
 * @param {...*} args
 * @return {String}
 */
export function hex(...args){
	return args.map(arg => {
		if(arg instanceof Number)       arg += 0;
		else if(arg instanceof String)  arg += "";
		else if(arg instanceof Boolean) arg = !!arg.valueOf();
		switch(typeof arg){
			case "number":
				if(Number.isNaN(arg)) break; // Fall-through
			case "bigint":
				const [abs, sign] = arg < ("bigint" === typeof arg ? 0n : 0) ? [-arg, "-"] : [arg, ""];
				return sign + abs.toString(16).toUpperCase().padStart(2, "0");
			case "string":
				return [...arg].map(x => hex(x.codePointAt(0))).join(" ");
			case "boolean":
				return arg ? "01" : "00";
			case "object":
				if(arg instanceof ArrayBuffer)
					arg = new Uint8Array(arg);
				if(arg && Symbol.iterator in arg)
					return [...arg].map(x => hex(x)).join(" ");
		}
		return "--";
	}).join(" ");
}


/**
 * Return true when running in a browser environment.
 *
 * @see {@link https://ecma-international.org/ecma-262/#sec-IsHTMLDDA-internal-slot|`[[IsHTMLDDA]]`}
 * @see {@link https://mdn.io/document.all}
 * @return {Boolean}
 */
export function isBrowser(){
	/*@cc_on @if(@_jscript_version>4)return true;@end @*/
	try{
		const {all} = document;
		return "undefined" === typeof all && null === all();
	} catch(e){}
	return false;
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
 * Return true when running on a little-endian processor.
 *
 * @see {@link chromium/src/v8/test/mjsunit/nans.js}
 * @return {Boolean}
 */
export function isLittleEndian(){
	return 0xAFDE === new Uint16Array(new Uint8Array([0xDE, 0xAF]).buffer)[0];
}


/**
 * Return true if the given NaN value contains a sign-bit.
 *
 * NOTE: This function observes implementation-defined behaviour;
 * results are not guaranteed to be consistent between platforms.
 * 
 * @example isNegativeNaN(-NaN) === true;
 * @example isNegativeNaN(NaN) === false;
 * @param {Number} value
 * @return {Boolean}
 */
export function isNegativeNaN(value){
	if(!Number.isNaN(value)) return false;
	const view = new DataView(new ArrayBuffer(8));
	view.setFloat64(0, value);
	return 0xFF === view.getUint8(0);
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
 * Return true if the given value is a {@link String}.
 *
 * @param {*} input
 * @return {Boolean}
 */
export function isString(input){
	return "string" === typeof input || input instanceof String;
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
 * Compare two SemVer-compliant version strings.
 *
 * Nullish or invalid version strings are treated as
 * if "v0.0.0" were given; no syntax error is raised.
 *
 * @example semver("1.0.0", "2.0.0") === -1;
 * @example semver("2.0.0", "1.0.0") === 1;
 * @example semver("1.0.0", "1.0.0") === 0;
 * @param {String} a
 * @param {String} b
 * @return {SortResult}
 */
export function semver(a, b){
	// Regular expression sourced from https://semver.org/spec/v2.0.0.html
	const regex = /^[v=\s]*(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
	a = `${a}`.trim().match(regex);
	b = `${b}`.trim().match(regex);
	if(null == a && null == b) return 0;
	else if(null == a)         return -1;
	else if(null == b)         return 1;
	[a, b] = [a, b].map(match => ({
		major: parseInt(match[1], 10),
		minor: parseInt(match[2], 10),
		patch: parseInt(match[3], 10),
		preRelease: match[4]?.split(".").map(id =>
			/^\d+$/.test(id) ? parseInt(id, 10) : id),
		buildMetadata: match[5],
	}));
	if(a.major < b.major) return -1; if(a.major > b.major) return 1;
	if(a.minor < b.minor) return -1; if(a.minor > b.minor) return 1;
	if(a.patch < b.patch) return -1; if(a.patch > b.patch) return 1;
	[a, b] = [a.preRelease, b = b.preRelease];
	if(!a && !b) return 0;
	if(!a && b)  return 1;
	if(!b && a)  return -1;
	const max = Math.max(a.length, b.length);
	for(let i = 0; i < max; ++i){
		if(null == a[i]) return 1;
		if(null == b[i]) return -1;
		if(typeof a[i] === typeof b[i]){
			if(a[i] < b[i]) return -1;
			if(a[i] > b[i]) return 1;
			continue;
		}
		if("number" === typeof a[i] && "string" === typeof b[i]) return 1;
		if("number" === typeof b[i] && "string" === typeof a[i]) return -1;
	}
	return 0;
}

/**
 * Value returned from a sorting comparator.
 * @typedef  {Number} SortResult
 * @property {Number} [EQUAL_TO     =  0] Both arguments are equal.
 * @property {Number} [LESS_THAN    = -1] First argument precedes the second.
 * @property {Number} [GREATER_THAN =  1] First argument succeeds the second.
 */


/**
 * Order a list of strings for a RegExp capturing group.
 *
 * Results are sorted by codepoint, à la {@link Array.prototype.sort}.
 * In the event of a tie, longer strings are ordered before shorter ones.
 *
 * @example sortForRegExp(["ab", "a", "abc"]) == ["abc", "ab", "a"];
 * @param {String|Array} input
 * @param {Boolean} [caseInsensitive=false]
 * @return {Array}
 */
export function sortForRegExp(input, caseInsensitive = false){
	if(!Array.isArray(input))
		input = String(input).split("\n").filter(Boolean);
	return input.sort((a, b) => {
		if(caseInsensitive){
			a = a.toLowerCase();
			b = b.toLowerCase();
		}
		if(0 === b.indexOf(a)) return  1;
		if(0 === a.indexOf(b)) return -1;
		return a < b ? -1 : a > b;
	});
}


/**
 * Compare two strings numerically and case-insensitively.
 *
 * Analogous to the `-fin` switches of the sort(1) utility, except
 * numbers after non-numeric segments are also compared.
 *
 * @example ["foo128", "foo8"].sort(sortn) == ["foo8", "foo128"];
 * @see String.prototype.sort
 * @param {String} a
 * @param {String} b
 * @return {Number}
 */
export function sortn(a, b){
	[a, b] = [a, b].map(x => String(x).match(/\d+|\D*/g).filter(Boolean).map(x => x.trim().toLowerCase()));
	for(let A, B, i = 0, l = Math.max(a.length, b.length); i < l; ++i){
		if(null == a[i]) return -1;
		if(null == b[i]) return 1;
		if(/\d/.test(a[i]) && /\d/.test(b[i])){
			A = +a[i];
			B = +b[i];
			if(A < B) return -1;
			if(A > B) return 1;
			continue;
		}
		const c = a[i].localeCompare(b[i]);
		if(0 !== c) return c;
	}
	return 0;
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
