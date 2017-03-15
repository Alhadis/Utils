"use strict";


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
 
 * @return {*}
 *    Value of the referenced property, or `undefined` if the path
 *    pointed to an invalid or missing property.
 */
function resolveProperty(object, path, usePrevious = false){
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
function alphabetiseProperties(input, strictCase = false){
	let stringTag = Object.prototype.toString.call(input);
	
	// Regular JavaScript object: enumerate properties
	if("[object Object]" === stringTag){
		let keys = Object.keys(input);
		
		keys = strictCase ? keys.sort() : keys.sort((a, b) => {
			let A = a.toLowerCase();
			let B = b.toLowerCase();
			if(A < B) return -1;
			if(A > B) return 1;
			return 0;
		});
		
		let result = {};
		for(let i of keys)
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
 * "Flatten" a (possibly nested) list of strings into a single-level array.
 *
 * Strings are split by whitespace as separate elements of the final array.
 *
 * @param {Array|String} input
 * @return {String[]} An array of strings
 */
function collectStrings(input, refs = null){
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
function keyGrep(subject, pattern){
	pattern = "string" === typeof pattern
		? new RegExp(pattern)
		: pattern;
	
	const output = {};
	for(const key of Object.keys(subject).filter(k => pattern.test(k)))
		output[key] = subject[key];
	return output;
}


/**
 * Return true if a variable is a {@link Number} or number-like {@link String}.
 * 
 * String-checking is intentionally restricted to "basic" numeric forms only.
 * Advanced notation like hexadecimal, exponential or binary literals are ignored:
 * strings like "0b10100100", "0xE4" and "3.1536e+10" will each return `false`.
 * 
 * @param {Mixed} i - Value to inspect
 * @return {Boolean}
 */
function isNumeric(i){
	return "" !== i && +i == i && (String(i) === String(+i) || !/[^\d\.]+/.test(i));
}


/**
 * Return true if the given value is a {@link RegExp|regular expression}.
 *
 * @param {*} input
 * @return {Boolean}
 */
function isRegExp(input){
	return "[object RegExp]" === Object.prototype.toString.call(input);
}


/**
 * Return true if the given value is a {@link String}.
 *
 * @param {*} input
 * @return {Boolean}
 */
function isString(input){
	return "[object String]" === Object.prototype.toString.call(input);
}


/**
 * Parse a list of keywords into an object of boolean `true` values.
 *
 * @example parseKeywords("top left") -> {top: true, left: true}
 * @param {String|String[]} keywords - A space-delimited string or an array of strings
 * @return {Object.<String, Boolean>}
 */
parseKeywords(keywords){
	if(!Array.isArray(keywords)){
		if(!keywords) return null;
		keywords = [keywords];
	}
	
	const output = {};
	for(const k of keywords)
		k.split(/\s+/g).filter(i => i).forEach(k => output[k] = true);
	return output;
}
