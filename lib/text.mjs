/**
 * Align a string by padding it with leading/trailing whitespace.
 *
 * @example alignText("Text",   10)            == "   Text   ";
 * @example alignText(" Text ", 14, 0.5, "-")  == "---- Text ----";
 * @example alignText("Text",   14, 0.75, "=") == "========Text===";
 *
 * @param {String} input - String to align with padding.
 * @param {Number} width - Total width of the containing text-area (in characters).
 * @param {Number} [axis=0.5] - Alignment position in the range of 0 (left) and 1 (right).
 * @param {String} [char=" "] - Character to use as padding. Defaults to space (U+0020).
 * @return {String}
 */
export function alignText(input, width, axis = 0.5, char = " "){
	const emptySpace = width - input.length;
	
	// Bail early if there's nothing to do here
	if(emptySpace < 1) return input;
	
	const left  = emptySpace * axis;
	const right = emptySpace - left;
	return char.repeat(Math.ceil(left)) + input + char.repeat(Math.floor(right));
}


/**
 * Convert a camelCased string to its kebab-cased equivalent.
 *
 * @example camelToKebabCase("fooBar") == "foo-bar"
 * @param {String} input
 * @return {String}
 */
export function camelToKebabCase(input){
	return /^(?:[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*)+(?:[a-z][a-z0-9]*)?$/.test(input)
		? input
			.replace(/([a-z0-9])([A-Z]{2,})(?=[A-Z][a-z][a-z0-9]*(?:$|[A-Z]))/g, (_, a, B) => `${a}-${B.toLowerCase()}-`)
			.replace(/([a-z][a-z0-9]*)([A-Z])/g, (_, a, B) => `${a}-${B}`)
			.toLowerCase()
		: input;
}


/**
 * Strip excess whitespace from a multiline string.
 *
 * Intended to be used with tagged template literals,
 * but will work on any multiline string value.
 *
 * @example
 * const HTML = deindent;
 * let output = HTML `
 *     <div>
 *         (Text)
 *     </div>
 * `;
 * output == "<div>\n\t(Text)\n</div>";
 *
 * @param {Object|String} input
 * @param {...String} [args]
 * @return {String}
 */
export function deindent(input, ...args){
	
	// Avoid breaking on String.raw if called as an ordinary function
	if("object" !== typeof input || "object" !== typeof input.raw)
		return deindent `${input}`;
	
	const depthTable = [];
	let maxDepth = Number.NEGATIVE_INFINITY;
	let minDepth = Number.POSITIVE_INFINITY;
	
	// Normalise newlines and strip leading or trailing blank lines
	const chunk = String.raw.call(null, input, ...args)
		.replace(/\r(\n?)/g, "$1")
		.replace(/^(?:[ \t]*\n)+|(?:\n[ \t]*)+$/g, "");

	for(const line of chunk.split(/\n/)){
		// Ignore whitespace-only lines
		if(!/\S/.test(line)) continue;
		
		const indentString = line.match(/^[ \t]*(?=\S|$)/)[0];
		const indentLength = indentString.replace(/\t/g, " ".repeat(8)).length;
		if(indentLength < 1) continue;

		const depthStrings = depthTable[indentLength] || [];
		depthStrings.push(indentString);
		maxDepth = Math.max(maxDepth, indentLength);
		minDepth = Math.min(minDepth, indentLength);
		if(!depthTable[indentLength])
			depthTable[indentLength] = depthStrings;
	}

	if(maxDepth < 1)
		return chunk;
	
	const depthStrings = new Set();
	for(const column of depthTable.slice(0, minDepth + 1)){
		if(!column) continue;
		depthStrings.add(...column);
	}
	depthStrings.delete(undefined);
	const stripPattern = [...depthStrings].reverse().join("|");
	return chunk.replace(new RegExp(`^(?:${stripPattern})`, "gm"), "");
}


/**
 * Escape [C0 and C1 control characters]{@link https://en.wikipedia.org/wiki/C0_and_C1_control_codes}.
 *
 * Tabs and line-feeds are exempt from being escaped, as are carriage returns
 * which are immediately followed by a line-feed (Windows/DOS-style newline).
 * 
 * @example <caption>Various ways of escaping null-bytes</caption>
 * escapeCtrl("\0") == "\\x00";
 * escapeCtrl("\0", {caret: true}) == "^@";
 * escapeCtrl("\0", {named: true}) == "\\0";
 * escapeCtrl("\0", {octal: true}) == "\\000";
 * escapeCtrl("\0", {pictures: true}) == "␀";
 *
 * @param  {String}  input             - String potentially containing control codes
 * @param  {Object}  [opts={}]         - Settings for refining output
 * @param  {String}  [opts.before=""]  - Text inserted before each escaped character
 * @param  {String}  [opts.after=""]   - Text inserted after each escaped character
 * @param  {String}  [opts.include=""] - Additional characters to escape
 * @param  {String}  [opts.exclude=""] - Characters to exempt from escaping
 * @param  {Boolean} [opts.caret]      - Use caret notation like `^M`
 * @param  {Boolean} [opts.named]      - Use C-style single-character names like `\r`
 * @param  {Boolean} [opts.octal]      - Use octal notation for displaying codepoints
 * @param  {Boolean} [opts.pictures]   - Use Unicode control pictures (U+2400—U+243F)
 * @return {String}
 */
export function escapeCtrl(input, opts = {}){
	const {before = "", after = "", caret, named, octal, pictures, include = "", exclude = ""} = opts;
	const caretCodex = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_";
	const namedCodex = {0: "0", 7: "a", 8: "b", 9: "t", 10: "n", 11: "v", 12: "f", 13: "r", 27: "e"};
	const pictureCodex = "␀␁␂␃␄␅␆␇␈␉␊␋␌␍␎␏␐␑␒␓␔␕␖␗␘␙␚␛␜␝␞␟␠";
	const includeRegex = include ? `|[${include.replace(/[-\\^]/g, "\\$&")}]` : "";
	return input.replace(new RegExp(/(?!\r\n)[\0-\b\v-\x1F\x7F-\x9F]/.source + includeRegex, "g"), char => {
		if(~exclude.indexOf(char)) return char;
		const code = char.charCodeAt(0);
		return before + (
			named    && namedCodex[code] ? "\\" + namedCodex[code] :
			pictures && (0x7F === code || pictureCodex[code]) ? pictureCodex[code] || "␡" :
			caret    && (0x7F === code || caretCodex[code]) ? `^${caretCodex[code] || "?"}` :
			octal ? "\\" + code.toString(8).padStart(3, "0") :
			`\\x${code.toString(16).padStart(2, "0").toUpperCase()}`
		) + after;
	});
}


/**
 * Escape special HTML characters within a string.
 *
 * @example escapeHTML("< 1 & 2 >") == "&#60; 1 &#38; 2 &#62;";
 * @param {String} input
 * @return {String}
 */
export function escapeHTML(input){
	return input.replace(/[<&'">]/g, char => `&#${char.charCodeAt(0)};`);
}


/**
 * Escape special regex characters within a string.
 *
 * @example escapeRegExp("file.js") == "file\\.js"
 * @param {String} input
 * @return {String}
 */
export function escapeRegExp(input){
	return input.replace(/([/\\^$*+?{}[\]().|])/g, "\\$1");
}


/**
 * Escape dangerous characters in a POSIX shell argument.
 *
 * @example escapeShellArg("; rm -rf *");                // echo \;\ rm\ -rf\ \*
 * @example escapeShellArg("; `exit`", {quoted: true});  // echo "; \`exit\`"
 * @example escapeShellArg("-filename", {isPath: true}); // echo ./-filename
 * @param {String} input
 * @param {ShellEscapeOptions} [options={}]
 * @return {String}
 */
export function escapeShellArg(input, options = {}){
	input = options.quoted
		? input.replace(/[$`\\!"]/g, "\\$&")
		: input.replace(/(?!\r?\n)[\s!"#$&'()*+:;<=>?@[\\\]`{|}~]/g, "\\$&");
	switch(options.nullBytes){
		case "escape":   input = input.replace(/\0/g,  "\\\0");            break;
		case "strip":    input = input.replace(/\0+/g, "");                break;
		case "error":    throw new TypeError("Input contains null-bytes");
	}
	switch(options.newlines){
		case "escape":   input = input.replace(/\r|\n/g, "\\$&");          break;
		case "strip":    input = input.replace(/\r?\n/g, "");              break;
		case "quote":    input = input.replace(/(?:\r?\n)+/g, "'$&'");     break;
		case "collapse": input = input.replace(/(?:\r?\n)+/g, " ");        break;
		case "error":    throw new TypeError("Input contains newlines");
	}
	return options.isPath && "-" === input[0] ? "./" + input : input;
}

/**
 * @typedef {Object} ShellEscapeOptions
 * @description
 *    Settings controlling how {@link escapeShellArg} transforms its input.
 *
 * @property {Boolean} [isPath=false]
 *    Prefix result with `./` if it starts with a dash.
 *
 * @property {NewlineEscapeStrategy} [newlines="quote"]
 *    How bare newlines (CRLF or LF) are handled.
 *
 * @property {NullByteEscapeStrategy} [nullBytes="strip"]
 *    How null-bytes (U+0000) are sanitised.
 *
 * @property {Boolean} [quoted=false]
 *    Escape only characters which are interpreted inside double-quoted strings.
 *    This includes dollar-signs, backticks, backslashes, and double-quotes.
 */

/**
 * How {@link escapeShellArg} handles newlines (CRLF or LF) when escaping input.
 *
 * @typedef {String} NewlineEscapeStrategy
 * @var {String} collapse - Merge contiguous newlines into a single space character.
 * @var {String} error    - Throw a {@link TypeError}.
 * @var {String} escape   - Insert a backslash before each newline.
 * @var {String} ignore   - Keep newlines as they are (default).
 * @var {String} quote    - Enclose contiguous newlines with single-quotes.
 * @var {String} strip    - Remove newlines entirely.
 */

/**
 * How {@link escapeShellArg} handles null-bytes (U+0000) when escaping input.
 *
 * @typedef {String} NullByteEscapeStrategy
 * @var {String} error  - Throw a {@link TypeError}.
 * @var {String} escape - Insert a backslash before each null-byte.
 * @var {String} ignore - Keep null-bytes as they are (default).
 * @var {String} strip  - Remove null-bytes entirely.
 */


/**
 * Expand escape sequences like `\t` into their literal counterparts.
 *
 * @example expandEscapes("\\x40\\u2020") == "@†";
 * @example expandEscapes("\\e[1m", true) == "\x1B[1m";
 * @example expandEscapes("\\?", 0, true) == "\\?";
 * @param {String} input
 * @param {Boolean} [all=false] - Expand `\a` and `\e` into ASCII BEL and ESC, respectively.
 * @param {Boolean} [ignoreUnknown=false] - Don't strip backslashes of unknown/invalid escapes.
 * @return {String}
 */
export function expandEscapes(input, all = false, ignoreUnknown = false){
	const chr = String.fromCodePoint;
	const esc = /\\x([a-fA-F0-9]{2})|\\u([a-fA-F0-9]{4})|\\u{([a-fA-F0-9]+)}|\\([0-7]{1,3})|\\(.|$)|\\\r?\n/g;
	const tbl = {t: 0x09, n: 0x0A, r: 0x0D, f: 0x0C, v: 0x0B, b: 0x08, 0: 0, ...!!all && {a: 0x07, e: 0x1B}};
	return input.replace(esc, (str, x2, x4, xN, o, s) => {
		if(x2 || x4 || xN) return chr(parseInt(xN || x4 || x2, 16));
		if(o)              return chr(parseInt(o, 8));
		if(null == s)      return "";
		if(s in tbl)       return chr(tbl[s]);
		return ignoreUnknown ? "\\" + s : s ? s : "";
	});
}


/**
 * Locate the root directory shared by multiple paths.
 *
 * @param {String[]} paths - A list of filesystem paths
 * @return {String} root
 */
export function findBasePath(paths){
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
		let x;
		X: for(x = 0; x < width; ++x){
			const str = rows[0][x];
			for(let y = 1; y < height; ++y)
				if(str !== rows[y][x]) break X;
			matched.push(str);
		}
	}
	
	if(matched.length > 1)
		return matched.join(POSIX ? "/" : "\\");
	
	// None of the paths share a common ancestor
	else{
		if(POSIX) return "/";
		const driveLetter = paths[0][0] + ":\\";
		return paths.every(path => path.startsWith(driveLetter)) ? driveLetter : "";
	}
}


/**
 * Format a number of bytes for human-readable output.
 *
 * @example formatBytes(3524959) == "3.36 MB"
 * @param {Number} bytes
 * @return {String} A reader-friendly representation of filesize.
 */
export function formatBytes(bytes){
	let unit;
	for(unit of new Array("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"))
		if(bytes >= 1024) bytes /= 1024; else break;
	return `${Math.round(bytes * 100) / 100} ${unit}`;
}


/**
 * Encode a number of milliseconds as a timecode string.
 *
 * @example formatTime(5425999) == "01:30:25.999"
 * @param {Number} input
 * @return {String} A string of the form `HH:MM:SS.000`.
 */
export function formatTime(input){
	if((input = Math.round(+input || 0)) <= 0)
		return "00:00:00.000";
	
	let hours   = "00";
	let minutes = "00";
	let seconds = "00";
	let ms      = "000";
	
	const [HOUR, MIN, SEC] = [3600000, 60000, 1000];
	if(input >= HOUR) { hours   = Math.floor(input / HOUR); input %= HOUR; }
	if(input >= MIN)  { minutes = Math.floor(input / MIN);  input %= MIN;  }
	if(input >= SEC)  { seconds = Math.floor(input / SEC);  input %= SEC;  }
	ms = input;
	
	return (String(hours).padStart(2, "0") + ":"
		+ String(minutes).padStart(2, "0") + ":"
		+ String(seconds).padStart(2, "0") + "."
		+ String(ms).padStart(3, "0"));
}


/**
 * Return one or more characters not contained in a string.
 *
 * @example getUnusedChar("\x00\x02")    == "\x01";
 * @example getUnusedChar("\x00\x02", 2) == "\x01\x03";
 * @param {String} input
 * @param {Number} [count=1]
 * @return {String}
 */
export function getUnusedChar(input, count = 1){
	let chars = "";
	let next = "\x00";
	let code = 0;
	for(let i = 0; i < count; ++i){
		while(-1 !== input.indexOf(next) || -1 !== chars.indexOf(next))
			next = String.fromCodePoint(++code);
		chars += next;
	}
	return chars;
}


/**
 * Inclusive string-splitting method.
 *
 * Identical to {@link String.prototype.split}, except
 * matched delimiters are included with the results.
 *
 * @example isplit("A-B", /-/) == ["A", "-", "B"];
 * @param {String} input
 * @param {RegExp|String} [pattern=/./]
 * @return {String[]}
 */
export function isplit(input, pattern = /./){
	const output = [];
	
	// String-type pattern: convert to RegExp
	if("string" === typeof pattern)
		pattern = new RegExp(pattern.replace(/\W/g, "\\$&"), "g");
	
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
	
	return output.filter(Boolean);
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
export function isValidCCNumber(input){
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
export function kebabToCamelCase(input){
	return input.toLowerCase().replace(/([^-\s])-+([^-\s])/g, (_, a, b) => a + b.toUpperCase());
}


/**
 * Demarcate regions of text.
 *
 * @example mark("abcxyz", [[2, 5, "<", ">"]]) == "ab<cxy>z";
 * @param {String} input
 * @param {Array[]|Array|String|Number} ranges
 * @return {String}
 */
export function mark(input, ranges){
	input = String(input);
	ranges = "object" !== typeof ranges
		? [[0, input.length, ...+ranges >= 0
			? [`\x1B[38;5;${ranges}m`, "\x1B[39m"]
			: [ranges, "\x1B[0m"]]]
		: ranges && "object" !== typeof ranges[0] && ranges.length
			? ["string" === typeof ranges[0] ? [0, input.length, ...ranges] : ranges]
			: ranges;
	const flattened = [];
	for(const [start, end, before = "\x1B[7m", after = "\x1B[27m"] of ranges)
		start !== end && flattened.push([start, before, false], [end, after, true]);
	flattened.sort((a, b) =>
		a[0] < b[0] ? -1 :
		a[0] > b[0] ?  1 :
		a[2] > b[2] ? -1 :
		a[2] < b[2] ?  1 :
		0);
	let output = "", prevOffset = 0;
	for(const [offset, insert] of flattened){
		if(prevOffset < offset)
			output += input.slice(prevOffset, offset);
		output += insert;
		prevOffset = offset;
	}
	if(prevOffset < input.length)
		output += input.slice(prevOffset);
	return output;
}


/**
 * Return the English ordinal suffix for a number (-st, -nd, -rd, -th).
 *
 * @example ordinalSuffix(22) == "nd"
 * @param {Number} n - A number (preferably an integer) to return the suffix for.
 * @return {String}
 */
export function ordinalSuffix(n){
	return [, "st", "nd", "rd"][((n %= 100) > 10 && n < 20) ? 0 : (n % 10)] || "th";
}


/**
 * Convert an ISO duration or temporal {@link CSSUnitValue} to milliseconds.
 *
 * @example parseDuration("4s") == 4000;
 * @example parseDuration("5 sec") == 5000;
 * @example parseDuration("PT12H30M5S") == 45005000;
 * @param {String|CSSUnitValue} value
 * @return {Number}
 */
export function parseDuration(value){
	switch(typeof value){
		default: return Number(value);
		case "string": break;
		case "object": return "[object CSSUnitValue]" === {}.toString.call(value)
			? "s" === value.unit ? value.value * 1000 : value.value
			: +value;
	}
	value = value.toUpperCase().trim()
		.replace(/(?<=\d)\s+(?=[A-Z])/g, "")
		.replace(/\sAND\s/g, " ")
		.split(/[\s,;]+/)
		.filter(Boolean);
	if(value.length > 1){
		let result = 0;
		value.forEach(n => result += parseDuration(n));
		return result;
	}
	[value] = value;
	const SECOND = 1000;
	const MINUTE = SECOND * 60;
	const HOUR   = MINUTE * 60;
	const DAY    = HOUR   * 24;
	const WEEK   = DAY    * 7;
	const YEAR   = DAY    * 365.242198781;
	const MONTH  = YEAR   / 12;
	if(/^([.\d]+)(M?S|[A-Z]*[A-RT-Z])S?$/.test(value)){
		let value = +RegExp.$1;
		switch(RegExp.$2){
			case "Y":  case "YR":  case "YEAR":   value *= YEAR;     break;
			case "D":  case "DA":  case "DAY":    value *= DAY;      break;
			case "W":  case "WK":  case "WEEK":   value *= WEEK;     break;
			case "H":  case "HR":  case "HOUR":   value *= HOUR;     break;
			case "M":  case "MIN": case "MINUTE": value *= MINUTE;   break;
			case "S":  case "SEC": case "SECOND": value *= SECOND;   break;
			case "MS": case "MILLISECOND":        break;
			case "MONTH":     value *= MONTH;     break;
			case "FORTNIGHT": value *= WEEK * 2;  break;
			default:          value = NaN;        break;
		}
		return value;
	}
	if(/^P([.\d]+Y)?([.\d]+M)?([.\d]+D)?(?:T([.\d]+H)?([.\d]+M)?([.\d]+S)?)?(?<!P|T)$/.test(value))
		return (
			parseFloat(RegExp.$1 || 0) * YEAR   +
			parseFloat(RegExp.$2 || 0) * MONTH  +
			parseFloat(RegExp.$3 || 0) * DAY    +
			parseFloat(RegExp.$4 || 0) * HOUR   +
			parseFloat(RegExp.$5 || 0) * MINUTE +
			parseFloat(RegExp.$6 || 0) * SECOND
		);
	if(/^P([.\d]+)W$/i.test(value))
		return RegExp.$1 * WEEK;
	return NaN;
}


/**
 * Parse a string containing a JavaScript primitive.
 *
 * Regular expressions are also recognised, despite being objects.
 *
 * @example parsePrimitive("+0x35") == {type: Number, value: 53};
 * @example parsePrimitive('"Foo"') == {type: String, value: "Foo", delimiter: '"'};
 * @param {String} input - String containing a JavaScript literal
 * @param {Boolean} [useDoubleAt=false] - Interpret `@@foo` as `Symbol(foo)`
 * @return {?ParsedPrimitive}
 */
export function parsePrimitive(input, useDoubleAt = false){
	const parse = () => Function(`return ${input}`)();
	input = input.trim();
	if(/^(true|false)$/.test(input))        return {type: Boolean, name: RegExp.$1, value: "true" === RegExp.$1};
	if(/^[-+]?(NaN|Infinity)$/.test(input)) return {type: Number,  name: RegExp.$1, value: parse()};
	if(/^(null|undefined)$/.test(input))    return {type: parse(), name: RegExp.$1, value: parse()};
	if(/^("|'|`)((?:(?!\1)[^\\]|\\.)*)\1$/s.test(input)){
		const delimiter = RegExp.$1;
		const value = RegExp.$2.replace(/\\(.)/g, "$1");
		return {type: String, value, delimiter};
	}
	if(/^(?!\+.+n$|.*(?:\b_|_\b|__|_[Een]|[Een]_))[-+]?(?!0_)(?:0[oO][0-7_]+|0[bB][01_]+|0[xX][A-Fa-f0-9_]+|[\d_]+(?:[eE][-+]?[\d_]+(?!n))?)(n)?$/.test(input)){
		const type = RegExp.lastParen ? BigInt : Number;
		input = input.replace(/_/g, "");
		return {type, value: parse()};
	}
	if(/^(?!.*(?:\b_|_\b|__|_[Ee]|[Ee]_))[-+]?(?!0_)(?:[\d_]*\.[\d_]+|[\d_]+\.)(?:[eE][-+]?[\d_]+)?$/.test(input)){
		input = input.replace(/_/g, "");
		return {type: Number, value: parse()};
	}
	if(/^Symbol\((.*)\)$/.test(input) || useDoubleAt && /^@@(\S+)$/.test(input)){
		const {$1} = RegExp;
		const value = "symbol" === typeof Symbol[$1.replace(/^(?:@@|Symbol\.)(.+)/, "$1")]
			? Symbol[RegExp.$1]
			: Symbol.for($1);
		return {type: Symbol, value, name: $1};
	}
	if(/^\/(.+)\/(\w*)$/.test(input))
		try{
			const value = new RegExp(RegExp.$1, RegExp.$2);
			return value.toString() === input ? {type: RegExp, value} : null;
		}
		catch(e){}
	return null;
}

/**
 * @typedef {Object} ParsedPrimitive
 * @description
 *    Object returned by {@link parsePrimitive} after successfully parsing
 *    a string containing a JavaScript primitive.
 *
 * @property {?Function} type
 *    Class of the parsed primitive, or `null` or `undefined` for those values.
 *
 * @property {*} value
 *    The parsed primitive itself.
 *
 * @property {?String} name
 *    Human-readable label of the primitive, if any. Only defined for symbols,
 *    booleans, nullish constants, and numeric constants like NaN and Infinity.
 *
 * @property {?String} delimiter
 *    Quote-character that delimits the input-string of the parsed primitive:
 *    either ", ' or `. Only defined when the parsed primitive is a string.
 */


/**
 * Parse a timecode string of the form `HH:MM:SS.mmm`.
 *
 * Hour and millisecond components are optional, and default to 0 if omitted.
 * Components may be of any length, and are not required to fall within their
 * expected ranges (e.g., `90:00` is analogous to `1:30:0`). Milliseconds are
 * truncated to 3 digits rather than being rounded off: `0:00.5009` is parsed
 * as `0:00.500` instead of `0:00.501`.
 *
 * Semicolons may be used instead of colons for delimiting H:M:S components.
 * Similarly, the decimal separator may be either a comma or a dot.
 *
 * @example parseTime("01:30:25.000") == 5425000
 * @param {String} input
 * @return {Number} Time expressed in milliseconds.
 * @throws {SyntaxError} Raises an exception if passed invalid input.
 */
export function parseTime(input){
	input = String(input).trim();
	if(/^(\d+[:;])?(\d+)[:;](\d+)(?:[.,](\d{1,3})\d*)?$/.test(input)){
		const hours   = (parseInt(RegExp.$1) * 3600000 || 0);
		const minutes = +RegExp.$2 * 60000;
		const seconds = +RegExp.$3 * 1000;
		const ms      = +(RegExp.$4 || "0").padEnd(3, "0");
		return hours + minutes + seconds + ms;
	}
	else throw SyntaxError(`Invalid timecode: "${input}"`);
}


/**
 * Split a URL into separate components.
 *
 * @return {ParsedURL}
 * @param {String} path - Directory path or URI (either absolute or relative)
 *
 * @example
 * parseURL("https://github.com/page.php?foo=bar&qux#top") == {
 *    protocol: "https",
 *    hostname: "github.com",
 *    pathname: "/page.php",
 *    filename: "page.php",
 *    query:    "?foo=bar&qux",
 *    fragment: "#top",
 * };
 *
 * // Works with system filepaths too:
 * parseURL("/usr/share/man/whatis") == {
 *    protocol: "",
 *    hostname: "",
 *    pathname: "/usr/share/man/whatis",
 *    filename: "whatis",
 * };
 */
export function parseURL(path){
	const pattern = /^(?:\/\/|([^/#:?]*):(?:\/\/)?)?(?:(?=$|\s)|(?:(([^/:#?@]+)(?::([^@]+))?@)?([^/:]+)(?::(\d+))?)?(\/?(?:[^/#?]+\/)*([^/#?]+)?\/?)(\?[^#]*)?(#.*)?$)/;
	const matches = path.match(pattern);
	return {
		protocol: (matches[1]  || "").toLowerCase(),
		auth:      matches[2]  || "",
		username:  matches[3]  || "",
		password:  matches[4]  || "",
		hostname:  matches[5]  || "",
		port:     +matches[6]  || null,
		pathname:  matches[7]  || "",
		filename:  matches[8]  || "",
		query:     matches[9]  || "",
		fragment:  matches[10] || "",
	};
}

/**
 * An object enumerated with substrings matched by {@link parseURL}.
 * @typedef  {Object} ParsedURL
 * @property {String} [protocol=""]
 * @property {String} [auth=""]
 * @property {String} [username=""]
 * @property {String} [password=""]
 * @property {String} [hostname=""]
 * @property {Number} [port=null]
 * @property {String} [pathname=""]
 * @property {String} [filename=""]
 * @property {String} [query=""]
 * @property {String} [fragment=""]
 */


/**
 * Transpose paired character sequences.
 *
 * @example <caption>Toggling different types of quotes and brackets</caption>
 * rotate(`"A"'B'\`C\``, `"'\``) == "`A`\"B\"'C'";
 * rotate("[[(A)]]", ["[]", "()"] == "(([A]))";
 * rotate("$(a `b`)", [["$(", ")"], "``"]) == "`a $(b)`";
 *
 * @example <caption>Caesar cipher (ROT13 encryption)</caption>
 * const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
 * let decryption = rotate(emailAddress, alphabet, 13);
 * decryption     = rotate(decryption, alphabet.toLowerCase(), 13);
 * 
 * @param {String} input
 * @param {String|Array.<String|String[]>} list
 * @param {Number} [steps=1]
 * @return {String}
 */
export function rotate(input, list, steps = 1){
	steps |= 0;
	input = [...String(input)];
	list = "string" === typeof list
		? [...list].map(char => [char, char])
		: list.map((item, i) => "string" === typeof item
			? [item.slice(0, i = Math.ceil(item.length / 2)), item.slice(i)]
			: [item[0] || "", item[1] || ""]
		).filter(pair => pair[0] || pair[1]);
	let output     = "";
	const listSize = list.length;
	const depths   = new Array(listSize).fill(0);
	const {length} = input;
	if(!steps || listSize < 2)
		return input.join("");
	main: for(let i = 0; i < length;){
		for(let c, j = 0; j < listSize; ++j){
			const [begin, end] = list[j];
			if(end && (depths[j] > 0 || !begin) && end === input.slice(i, i + end.length).join("")){
				output += list[(c = (j + steps) % listSize) < 0 ? listSize + c : c][1];
				--depths[j];
				i += end.length;
				continue main;
			}
			else if(begin && begin === input.slice(i, i + begin.length).join("")){
				output += list[(c = (j + steps) % listSize) < 0 ? listSize + c : c][0];
				++depths[j];
				i += begin.length;
				continue main;
			}
		}
		output += input[i++];
	}
	return output;
}


/**
 * Generate an ID-safe slug from a name.
 *
 * @example slug("Here's an ID string.") == "heres-an-id-string"
 * @param {String} name
 * @return {String}
 */
export function slug(name){
	return String(name)
		.toLowerCase()
		.replace(/(\w)'(re)(?=\s|$)/g, "$1-are")
		.replace(/(\w)'s(?=\s|$)/g, "$1s")
		.replace(/[^\w$]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}


/**
 * Split bundled option groups into separate arguments.
 *
 * @public
 * @example <caption>Expansion of short-options</caption>
 *    splitOptions(["-pvTpdf"], "pv", "T")     => ["-p", "-v", "-T", "pdf"];
 *    splitOptions(["-w20", "-h40"], "", "wh") => ["-w", "20", "-h", "40"];
 *
 * @example <caption>Expansion of long-options</caption>
 *    splitOptions(["--width=25"], "", "", "width|height") => ["--width", "25"];
 *    splitOptions(["--height="],  "", "", "width|height") => ["--height", ""];
 *
 * @param {Array<String[]>} argv
 * @param {String} [niladicShort=""] - Single-letter options which take no parameters.
 * @param {String} [monadicShort=""] - Single-letter options which take a single parameter.
 * @param {String} [monadicLong=""]  - Pipe-delimited list of options which take a single parameter.
 * @return {String[]}
 */
export function splitOptions(argv, niladicShort = "", monadicShort = "", monadicLong = ""){
	if(!argv || !argv.length) return [];
	argv = "string" === typeof argv ? [argv] : [...argv];
	const escape = x => x.replace(/([/\\^$*+?{}[\]().|])/g, "\\$1");
	const undash = x => x.replace(/-|\s/g, "");
	niladicShort = escape(undash(niladicShort));
	monadicShort = escape(undash(monadicShort));
	monadicLong  = monadicLong.split("|").filter(Boolean).map(escape).sort().join("|");
	const patterns = [
		niladicShort && new RegExp(`^-([${niladicShort}][^-\\s${monadicShort}]*)${
			monadicShort ? `(?:([${monadicShort}])(\\S+)?)?` : "(\\S*)"}`),
		monadicShort && new RegExp(`^(-[${monadicShort}])(\\S*)`),
		monadicLong  && new RegExp(`^(--(?:${monadicLong}))(=(\\S*))?(?=$|\\s)`),
	];
	const opts = [];
	while(argv.length){
		const arg = argv.shift();
		let match = null;
		if(patterns[0] && (match = arg.match(patterns[0]))){
			opts.push(...(match[1] + (match[2] || "")).split("").map(s => s && "-" + s));
			if(match.length > 3 && match[2]) opts.push(match[3] || argv.shift());
		}
		else if(patterns[1] && (match = arg.match(patterns[1]))) opts.push(match[1], match[2] || argv.shift());
		else if(patterns[2] && (match = arg.match(patterns[2]))) opts.push(match[1], match[2] ? match[3] : argv.shift());
		else opts.push(arg);
	}
	return opts.filter(s => null != s);
}


/**
 * Break a string into chunks, preserving quoted regions and escaped characters.
 *
 * @example splitStrings(`"foo bar" baz`) == ["foo bar", "baz"];
 * @example splitStrings(`foo\\ \\" bar`) == ["foo \"", "bar"];
 * @param {String} input
 * @param {Object} [options={}]
 * @param {String} [options.delimiters=" \t\n"]
 * @param {String} [options.quoteChars="'\"`"]
 * @param {String} [options.escapeChars="\\"]
 * @param {Boolean} [options.keepQuotes=false]
 * @param {Boolean} [options.keepEscapes=false]
 * @return {String[]}
 */
export function splitStrings(input, options = {}){
	input = String(input);
	
	const delimiters  = (options.delimiters || " \t\n").split("");
	const quoteChars  = (options.quoteChars || "'\"`").split("");
	const escapeChars = (options.escapeChars || "\\").split("");
	const keepQuotes  = !!options.keepQuotes;
	const keepEscapes = !!options.keepEscapes;
	const results     = [];
	
	let quote = "";
	let token = "";
	let escaped = false;
	
	const {length} = input;
	for(let i = 0; i < length; ++i){
		const char = input[i];
		if(escaped){
			token += char;
			escaped = false;
			continue;
		}
		
		// Argument delimiter: terminate token if unquoted
		if(!quote && -1 !== delimiters.indexOf(char)){
			token && results.push(token + "");
			token = "";
			continue;
		}
		
		// Escape sequence: treat next character literally
		if(-1 !== escapeChars.indexOf(char)){
			escaped = true;
			if(!keepEscapes)
				continue;
		}
		
		// Quote marks
		else if((!quote || char === quote) && -1 !== quoteChars.indexOf(char)){
			quote = quote === char ? "" : char;
			
			// Hack to make empty token truthy
			if(!token)
				token = new String("");
			
			if(!keepQuotes)
				continue;
		}
		
		token += char;
	}
	if(token)
		results.push(token + "");
	return results;
}


/**
 * Generate a reader-friendly representation of a time difference.
 *
 * @example <caption>Formatting a time 1-3 weeks in the past</caption>
 *    timeSince((6048e5 * 1) - Date.now()) === "Last week";
 *    timeSince((6048e5 * 3) - Date.now()) === "3 weeks ago.";
 *
 * @example <caption>Using a Date object</caption>
 *    const now = Date.now();
 *    timeSince(new Date(now + 864e5)) === "Tomorrow";
 *    timeSince(new Date(now - 864e5)) === "Yesterday";
 *
 * @param {Number|Date} time - Elapsed time, expressed in milliseconds
 * @param {Boolean} [maxYear=false] - Consider units of measurement beyond years
 * @return {String}
 */
export function timeSince(time, maxYear = false){
	
	// Use effective time difference if given a Date object
	if(time instanceof Date)
		time = Date.now() - time;
	
	const future = time < 0;
	const prev = future ? "Next " : "Last ";
	const ago = future ? " from now" : " ago";
	time = Math.abs(time / 1000);
	
	if(time < 60)                    return  time < 2 ? "Just now"      : `${time} seconds${ago}`;
	if((time /= 60) < 60)            return (time < 2 ? "A minute"      : `${Math.floor(time)} minutes`) + ago;
	if((time /= 60) < 24)            return (time < 2 ? "An hour"       : `${Math.floor(time)} hours`)   + ago;
	if((time /= 24) < 7)             return  time < 2 ? future ? "Tomorrow" : "Yesterday" : `${Math.floor(time)} days${ago}`;
	if((time /= 7) < 4.345238)       return  time < 2 ? `${prev}week`   : `${Math.floor(time)} weeks${ago}`;
	if((time /= 4.345238) < 12)      return  time < 2 ? `${prev}month`  : `${Math.floor(time)} months${ago}`;
	if((time /= 12) < 10 || maxYear) return  time < 2 ? `${prev}year`   : `${Math.floor(time)} years${ago}`;
	if((time /= 10) < 10)            return (time < 2 ? "A decade"      : `${Math.floor(time)} decades`)   + ago;
	if((time /= 10) < 10)            return (time < 2 ? "A century"     : `${Math.floor(time)} centuries`) + ago;
	time /= 10;                      return (time < 2 ? "A millennium"  : `${Math.floor(time)} millennia`) + ago;
}


/**
 * Capitalise a string using basic English title-case rules.
 *
 * @example titleCase("Lord Of The Rings") == "Lord of the Rings"
 * @param {String} input
 * @return {String}
 */
export function titleCase(input){
	const lcWords = "a an and at but for in nor of on or the to upon with yet".split(" ");
	const [firstChar, ...remainder] = input
		.toLowerCase()
		.replace(/\b(\w)(\w*)/gi, (word, firstLetter, remainder, index, input) => {
			
			// Always capitalise the last word
			if(/^(?!\.{3}|…)[^\w]*$/.test(input.substring(index + word.length)))
				return firstLetter.toUpperCase() + remainder;
		
			// Use lowercase for articles, conjunctions, prepositions, etc
			if(lcWords.includes(word)) return word;
			
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
 * Nodes are serialised as plain arrays with an extra `.name` property
 * containing the line's textual content (sans whitespace).
 *
 * @example tokeniseOutline("Foo\n\tBar\nBaz\n\tQux") == [
 *    [level: 0, name: "Foo", 0: [level: 1, name: "Bar"]],
 *    [level: 0, name: "Baz", 0: [level: 1, name: "Qux"]],
 * ];
 * @param {String} input - Block of tab/newline-delimited data
 * @return {OutlineNode[]} A tree of object-nodes.
 */
export function tokeniseOutline(input){
	input = input.replace(/^([ \t]*\n)*|(\n\s*)*$/g, "");
	const output = [];
	const indent = input.match(/^[\t ]+(?=\S)/);
	if(indent){
		const stripIndent = new RegExp("^" + indent[0], "gm");
		input = input.replace(stripIndent, "");
	}
	let prev = null, currentLevel = 0;
	for(const l of input.split(/\n+/g)){
		const level = l.match(/^\t*/)[0].length;
		const name = l.replace(/^\t+/, "");
		const node = Object.assign([], {level, name, parent: null});
		// Indent
		if(level > currentLevel){
			node.parent = prev;
			prev.push(node);
			currentLevel = level;
		}
		// Outdent
		else if(level < currentLevel)
			while(prev){
				if(prev.level <= level){
					currentLevel = prev.level;
					prev.parent
						? prev.parent.push(node)
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
				prev.push(node);
				node.parent = prev;
			}
			else output.push(node);
		}
		prev = node;
	}
	return output;
}

/**
 * Line of text serialised by {@link tokeniseOutline}.
 * @typedef  {OutlineNode[]} OutlineNode
 * @property {String}        name   - Textual content, sans leading and trailing whitespace.
 * @property {Number}        level  - Number of ancestor nodes, with 0 indicating a root node.
 * @property {?OutlineNode}  parent - Back-reference to the immediate parent node, if any.
 */


/**
 * Count the number of words in a string.
 *
 * @example wordCount("Bunch of odd-looking functions") == 4
 * @param {String} input
 * @param {Boolean} [ignoreHyphens=false] - Treat "foo-bar" as 2 words, not 1
 * @return {Number}
 */
export function wordCount(input, ignoreHyphens = false){
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
 * @param {String} input - Block of text to wrap.
 * @param {Number} [length=80] - Maximum number of characters permitted on each line.
 * @return {String[]} An array of wrapped lines, preserving any newlines in the original text.
 */
export function wordWrap(input, length = 80){
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
