"use strict";

/**
 * Align a string by padding it with leading/trailing whitespace.
 *
 * @return {String}
 * @example
 * alignText("Text",   10)            == "   Text   ";
 * alignText(" Text ", 14, 0.5, "-")  == "---- Text ----";
 * alignText("Text",   14, 0.75, "=") == "========Text===";
 *
 * @param {String} input
 *    String to align with padding.
 *
 * @param {Number} width
 *    Character width of containing textarea.
 *
 * @param {Number} [axis=0.5]
 *    Alignment axis, expressed as a multiplier between `0.0` (left-aligned)
 *    and `1.0` (right-aligned). Default is `0.5` (centred output).
 *
 * @param {String} [char=" "]
 *    Character to use as padding. Defaults to space (U+0020).
 */
function alignText(input, width, axis = 0.5, char = " "){
	const emptySpace = width - input.length;
	
	// Bail early if there's nothing to do here
	if(emptySpace < 1) return input;
	
	const left  = emptySpace * axis;
	const right = emptySpace - left;
	return char.repeat(Math.round(left)) + input + char.repeat(Math.round(right));
}


/**
 * Convert a camelCased string to its kebab-cased equivalent.
 *
 * @example camelToKebabCase("fooBar") == "foo-bar"
 * @param {String} input
 * @return {String}
 */
function camelToKebabCase(input){
	return /^([a-z]+[A-Z])+[a-z]+$/.test(input)
		? input.replace(/([a-z]+)([A-Z])/g, (_,a,B) => `${a}-${B}`).toLowerCase()
		: input;
}


/**
 * Locate the root directory shared by multiple paths.
 *
 * @param {String[]} paths - A list of filesystem paths
 * @return {String} root
 */
function findBasePath(paths){
	const POSIX = -1 !== paths[0].indexOf("/");
	let matched = [];
	
	// Spare ourselves the trouble if there's only one path.
	if(1 === paths.length){
		matched = (paths[0].replace(/[\\/]+$/, "")).split(/[\\/]/g);
		matched.pop();
	}
	else{
		const rows   = paths.map(d => d.split(/[\\/]/g));
		const width  = Math.max(...rows.map(d => d.length));
		const height = rows.length;
		let x, y;
		X: for(x = 0; x < width; ++x){
			const str = rows[0][x];
			for(let y = 1; y < height; ++y)
				if(str !== rows[y][x]) break X;
			matched.push(str);
		}
	}
	
	return matched.join(POSIX ? "/" : "\\");
}


/**
 * Format a number of bytes for human-readable output.
 *
 * @example formatBytes(3524959) == "3.36 MB"
 * @param {Number} bytes
 * @return {String} A reader-friendly representation of filesize.
 */
function formatBytes(bytes){
	let unit;
	for(unit of new Array("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"))
		if(bytes >= 1024) bytes /= 1024; else break;
	return `${Math.round(bytes * 100) / 100} ${unit}`;
}


/**
 * Return a character not contained in a string.
 *
 * @example getUnusedChar("\x00\x02") == "\x01"
 * @param {String} input
 * @return {String}
 */
function getUnusedChar(input){
	let char = "\x00";
	let code = 0;
	while(-1 !== input.indexOf(char))
		char = String.fromCodePoint(++code);
	return char;
}


/**
 * Inclusive string-splitting method.
 *
 * Identical to {@link String.prototype.split}, except
 * matched delimiters are included with the results.
 *
 * @example
 * ("A-B").split(/-/) == ["A", "B"];
 * isplit("A-B", /-/) == ["A", "-", "B"];
 * 
 * @param {String} input
 * @param {RegExp} pattern
 * @return {String[]}
 */
function isplit(input, pattern){
	const output = [];
	
	// String-type pattern: convert to RegExp
	if("string" === typeof pattern)
		pattern = new RegExp(pattern, "g");
	
	// Non-global regexp: avoid infinite recursion
	else if(!pattern.global)
		pattern = new RegExp(pattern.source, pattern.flags + "g");
	
	let start = 0, match;
	while(match = pattern.exec(input)){
		const [substring] = match;
		const {lastIndex} = pattern;
		const delimiter = input.substring(start, lastIndex - substring.length);
		output.push(delimiter, substring);
		start = lastIndex;
	}
	
	const {length} = input;
	if(start < length)
		output.push(input.substring(start, length));
	
	return output;
}


/**
 * Check if a string is a valid 16-digit credit card number.
 *
 * Non-alphanumeric separators like hyphens or spaces are ignored when determining validity.
 *
 * @example isValidCCNumber("1234-5678-N0PE-8432") == false
 * @param {String} input
 * @return {Boolean}
 */
function isValidCCNumber(input){
	return /^([^\dA-Za-z]*\d[^\dA-Za-z]*){16}$/.test(input);
}


/**
 * Convert a kebab-cased-string to a camelCasedString.
 *
 * @example kebabToCamelCase("foo-bar") == "fooBar"
 * @see {@link camelToKebabCase}
 * @param {String} input
 * @return {String}
 */
function kebabToCamelCase(input){
	return input.toLowerCase().replace(/([a-z])-+([a-z])/g, (_, a, b) => a + b.toUpperCase());
}


/**
 * Return the English ordinal suffix for a number (-st, -nd, -rd, -th).
 *
 * @example ordinalSuffix(22) == "nd"
 * @param {Number} n - A number (preferably an integer) to return the suffix for.
 * @return {String}
 */
function ordinalSuffix(n){
	return [,"st", "nd", "rd"][((n %= 100) > 10 && n < 20) ? 0 : (n % 10)] || "th";
}



/**
 * Split a URL into separate components.
 *
 * @return {ParsedURL}
 * @param {String} path - Directory path or URI (either absolute or relative)
 *
 * @example
 * parseURL("https://github.com/page.php?foo=bar&qux#top") == {
 *    protocol: "https://",
 *    path: "github.com/",
 *    filename: "login.php",
 *    query: "?foo=bar&qux",
 *    fragment: "#top",
 * };
 *
 * // Works with system filepaths too:
 * parseURL("/usr/share/man/whatis") == {
 *    protocol: "",
 *    path: "/usr/share/man/",
 *    filename: "whatis",
 *    query: "",
 *    fragment: ""
 * };
 */
function parseURL(path){
	const pattern = /^([^\/#\?]*:?\/\/)?(\/?(?:[^\/#\?]+\/)*)?([^\/#\?]+)?(?:\/(?=$))?(\?[^#]*)?(#.*)?$/;
	const matches = path.match(pattern) || [];
	return {
		protocol: matches[1] || "",
		path:     matches[2] || "",
		filename: matches[3] || "",
		query:    matches[4] || "",
		fragment: matches[5] || "",
	};
}

/**
 * An object enumerated with substrings matched by {@link parseURL}.
 * @typedef {Object.<String, String>} ParsedURL
 * @property {String} protocol - Protocol with :// appended
 * @property {String}     path - Directory path (including hostname/domain)
 * @property {String} filename - Filename/basename
 * @property {String}    query - ?query=string
 * @property {String} fragment - #Hash
 */


/**
 * Generate an ID-safe slug from a name.
 *
 * @example slug("Here's an ID string.") == "heres-an-id-string"
 * @param {String} name
 * @return {String}
 */
function slug(name){
	return (name || "").toString()
		.toLowerCase()
		.replace(/(\w)'(re)(?=\s|$)/g, "$1-are")
		.replace(/(\w)'s(?=\s|$)/g, "$1s")
		.replace(/[^\w$]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
}


/**
 * Capitalise a string using basic English title-case rules.
 *
 * @todo Write thorough specs for this; still slightly flaky.
 * @example titleCase("Lord Of The Rings") == "Lord of the Rings"
 * @param {String} input
 * @return {String}
 */
function titleCase(input){
	const _ = true;
	const lcWords = {
		a: _, an:_, and:_, but:_, for:_, in:_, nor:_,
		of:_, on:_,  or:_, the:_,  to:_, to:_, with:_,
	};
	const [firstChar, ...remainder] = input
		.toLowerCase()
		.replace(/\b(\w)(\w*)/gi, (word, firstLetter, remainder, index, input) => {
			
			// Single letter
			if(undefined === remainder) return firstLetter.toUpperCase();
		
			// Use lowercase for articles, conjunctions, prepositions, etc
			if(true === lcWords[word]) return word;
			
			// Beware of contractions
			if("'" === input[index - 1] && /\w'$/.test(input.substring(index, 0)))
				return word;
		
			return firstLetter.toUpperCase() + remainder;
		})
		.replace(/(^|\s)i(?!\w)/g, "$1I");  // Capitalise pronoun form of "I"
	return firstChar.toUpperCase() + remainder.join("");
}


/**
 * Generate a tree of values based on line indentation.
 *
 * Parent/child relationships are described by leading indentation.
 * Nodes are serialised as plain objects, each enumerated with 1-2 properties:
 *
 *    name:      Line's textual content, sans whitespace
 *    children:  An array of similarly-structured child nodes
 *
 * @param {String} input - Block of tab/newline-delimited data
 * @return {Object[]} A tree of object-nodes.
 */
function tokeniseOutline(input){
	input = input.replace(/^([ \t]*\n)*|(\n\s*)*$/g, "");
	const output = [];
	const indent = input.match(/^[\t ]+(?=\S)/);
	if(indent){
		const stripIndent = new RegExp("^" + indent[0], "gm");
		input = input.replace(stripIndent, "");
	}
	let prev, currentLevel = 0;
	for(let l of input.split(/\n+/g)){
		let level = l.match(/^\t*/)[0].length;
		let name = l.replace(/^\t+/, "");
		let node = {level, name, toJSON: function(){
			const o = Object.assign({}, this);
			delete o.parent;
			return o;
		}};
		// Indent
		if(level > currentLevel){
			node.parent = prev;
			(prev.children = prev.children || []).push(node);
			currentLevel = level;
		}
		// Outdent
		else if(level < currentLevel)
			while(prev){
				if(prev.level <= level){
					currentLevel = prev.level;
					prev.parent
						? prev.parent.children.push(node)
						: output.push(node);
					node.parent = prev.parent;
					break;
				}
				prev = prev.parent;
			}
		// New sibling
		else{
			if(level){
				prev = prev.parent;
				prev.children.push(node)
				node.parent = prev;
			}
			else output.push(node)
		}
		prev = node;
	}
	return output;
}


/**
 * Count the number of words in a string.
 *
 * @example wordCount("Bunch of odd-looking functions") == 4
 * @param {String} input
 * @param {Boolean} [ignoreHyphens=false] - Treat "foo-bar" as 2 words, not 1
 * @return {Number}
 */
function wordCount(input, ignoreHyphens = false){
	const nonWordChars = ignoreHyphens ? /\W+/g : /[^-\w_]+/g;
	const words = input
		.replace(nonWordChars, " ")
		.replace(/^\s+|\s+$/g, "")
		.split(/\s+/);
	return words[0] ? words.length : 0;
}


/**
 * Wrap a string to a specified line-length.
 *
 * Words are pushed onto the following line, unless they exceed the line's total length limit.
 *
 * @param {String} input
 *    Block of text to wrap.
 * 
 * @param {Number} [length=80]
 *    Maximum number of characters permitted on each line.
 * 
 * @return {String[]} An array of wrapped lines, preserving any newlines in the original text.
 */
function wordWrap(input, length = 80){
	const output = [];
	const l = input.length;
	
	for(let i = 0, s; i < l; i += length){
		let segment = input.substring(i, i + length);
		
		// Segment contains at least one newline.
		const nl = segment.lastIndexOf("\n");
		if(-1 !== nl){
			output.push(segment.substring(0, nl + 1));
			segment = segment.substring(nl + 1);
		}
		
		// We're attempting to cut on a non-whitespace character. Do something.
		if(/\S/.test(input[(i + length) - 1]) && (s = segment.match(/\s(?=\S+$)/))){
			output.push(segment.substr(0, i + length > l ? l : (s.index + 1)));
			i = (i - (s.input.length - s.index)) + 1;
		}
		else output.push(segment);
	}
	return output;
}


/**
 * Add leading zeroes if necessary.
 *
 * @example zeroise(5, 2) == "05"
 * @param {Number} value - Number being formatted.
 * @param {Number} min - Minimum required length.
 * @return {String}
 */
function zeroise(value, min){
	value = value.toString();
	const {length} = value;
	if(length < min)
		value = "0".repeat(min - length) + value;
	return value;
}
