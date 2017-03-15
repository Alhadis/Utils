"use strict";


/**
 * Synthesise case-insensitivity for a regexp string.
 *
 * JavaScript doesn't support scoped modifiers like (?i),
 * so this function attempts to approximate the closest thing.
 *
 * @param {String} input - Case-insensitive text
 * @param {Boolean} fuzz - Apply {@link fuzzyRegExp} to input
 * @uses {@link fuzzyRegExp}
 * @return {String}
 */
function caseKludge(input, fuzz = false){
	let output = input.split("").map((s, index, array) => {
		if(/[A-Z]/.test(s)){
			const output = "[" + s + s.toLowerCase() + "]";
			const prev   = array[index - 1];
			if(fuzz && prev && /[a-z]/.test(prev))
				return "[\\W_\\S]*" + output;
			return output;
		}
		if(/[a-z]/.test(s))     return "[" + s.toUpperCase() + s + "]";
		if(!fuzz)               return s.replace(/([/\\^$*+?{}\[\]().|])/g, "\\$1");
		if("0" === s)           return "[0Oo]";
		if(/[\W_ \t]?/.test(s)) return "[\\W_ \\t]?";
		return s;
	}).join("");
	
	if(fuzz)
		output = output.replace(/\[Oo\]/g, "[0Oo]");
	return output.replace(/(\[\w{2,3}\])(\1+)/g, (match, first, rest) => {
		return first + "{" + ((rest.length / first.length) + 1) + "}"
	});
}


/**
 * Match an iterable's patterns against a string.
 *
 * @private Used by the {@link PatternMap} and {@link PatternSet} classes.
 * @param {String} input
 * @param {Boolean} [matchAll=false]
 * @param {...RegExp} [patterns]
 * @return {Array|null}
 */
function execPatternList(input, matchAll = false, ...patterns){
	if(!input) return null;
	
	input = input.toString();
	
	if(matchAll){
		const matches = [];
		for(const pattern of patterns){
			const match = input.match(pattern);
			if(null !== match)
				matches.push([pattern, match]);
		}
		return matches;
	}
	
	else{
		for(const pattern of patterns){
			const match = input.match(pattern);
			if(null !== match)
				return [pattern, match];
		}
		return null;
	}
}


/**
 * Turn capturing groups in an expression into non-capturing groups.
 *
 * @example forceNonCapturing(/([A-Z]+)/) == /(?:[A-Z]+)/
 * @param {RegExp} pattern
 * @return {RegExp}
 */
function forceNonCapturing(pattern){
	const source = pattern.source
		.split(/\((?!\?[=<!])/)
		.map((segment, index, array) => {
			if(!index) return segment;
			return !/^(?:[^\\]|\\.)*\\$/.test(array[index - 1])
				? segment.replace(/^(?:\?:)?/, "(?:")
				: segment.replace(/^/, "(");
		})
		.join("");
	return new RegExp(source, pattern.flags);
}


/**
 * Generate a regex to match a string, bypassing intermediate punctuation.
 *
 * E.g., "CoffeeScript" matches "coffee-script", "cOfFeE sCRiPT" or even
 * "C0FFEE.SCRIPT". Useful when words have multiple possible spellings.
 *
 * @param {String} input - A string, such as "reStructuredText" or "dBASE"
 * @param {Function} format - Desired output format (String or RegExp)
 * @return {String|RegExp}
 */
function fuzzyRegExp(input, format = RegExp){
	if("[object String]" !== Object.prototype.toString.call(input))
		return input;
	
	const output = input
		.replace(/([A-Z])([A-Z]+)/g, (a, b, c) => b + c.toLowerCase())
		.split(/\B(?=[A-Z])|[-\s]/g)
		.map(i => i.replace(/([/\\^$*+?{}\[\]().|])/g, "\\$1?"))
		.join("[\\W_ \\t]?")
		.replace(/[0Oo]/g, "[0o]");
	
	// Author's requested the regex source, return a string
	if(String === format)
		return output;
	
	// Otherwise, crank the fuzz
	return new RegExp(output, "i");
}


/**
 * Generate a RegEx from its string-based representation.
 *
 * Useful for "deserialising" a regex from JSON. Optional flags can be given
 * to override trailing modifiers found in the source, if any.
 *
 * @example "/\\S+/i"       -> /\S+/i
 * @example "\\d+\\.\\d+$"  -> /\d+\.\d+$/
 * @param  {String} src
 * @param  {String} flags
 * @return {RegExp} regex
 */
function regexFromString(src, flags){
	src = (src || "").toString();
	if(!src) return null;
	
	const matchEnd = src.match(/\/([gimuy]*)$/);
	
	/** Input is a "complete" regular expression */
	if(matchEnd && /^\//.test(src))
		return new RegExp(
			src.replace(/^\/|\/([gimuy]*)$/gi, ""),
			flags != null ? flags : matchEnd[1]
		);
	
	return new RegExp(src, flags);
}


/**
 * Escape special regex characters within a string.
 *
 * @example "file.js" -> "file\\.js"
 * @param {String} input
 * @return {String}
 */
function escapeRegExp(input){
	return input.replace(/([/\\^$*+?{}\[\]().|])/g, "\\$1");
}
