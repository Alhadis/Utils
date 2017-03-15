"use strict";


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
	if("[object String]" !== ({}).toString.call(input))
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
