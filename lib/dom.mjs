/**
 * Curried method to append multiple nodes at once.
 *
 * @example addTo(node)(el1, el2, …)
 * @example node = addTo(node)(…)[0]
 * @return {Function}
 */
export function addTo(parent){
	let count = 0;
	let target = parent;
	
	const fn = (...nodes) => {
		let lastElement;
		
		for(let node of nodes){
			if("string" === typeof node)
				node = document.createTextNode(node);
			else if(node)
				lastElement =
				fn[++count] = node;
			node && target.appendChild(node);
		}
		
		target = lastElement || target;
		return fn;
	};
	fn[count] = target;
	return fn;
}


/**
 * Build a dictionary object from the contents of a <dl> element.
 *
 * If more than one <dd> tag falls under a single definition, the term is
 * assigned an array of strings instead. If duplicate definitions are encountered,
 * their values are appended to the array of the previously-defined definition.
 *
 * @param {HTMLDListElement} dl
 *    Description list from which to construct a hash of named values.
 *
 * @param {Boolean} [valueKey="textContent"]
 *    Name of property from which to derive definitions from.
 *
 * @param {Function|RegExp} [filter=/^\s*|\s*:\s*$/g]
 *    Callback or regex to execute on each definition's name.
 *    If a RegExp is supplied, it's used to delete matching characters from
 *    the name instead (defaulting to a regex which strips trailing colons).
 *
 * @return {Object}
 */
export function buildDict(dl, valueKey = "textContent", filter = /^\s*|\s*:\s*$/g){
	const output = {};
	
	if("function" !== typeof filter){
		const pattern = filter;
		filter = s => s.replace(pattern, "");
	}
	
	let key, value;
	for(const node of dl.childNodes)
		switch(node.tagName){
			case "DT":
				key = filter(node[valueKey]);
				break;
			
			case "DD":
				const existingValue = output[key];
				if(existingValue != null && !Array.isArray(existingValue))
					output[key] = [existingValue];
				
				value = node[valueKey];
				undefined === output[key]
					? output[key] = value
					: output[key].push(value);
				break;
		}
	return output;
}


/**
 * Retrieve every text-node contained by a DOM element.
 *
 * @param {Element} el
 *    Element to recursively scan for text-nodes.
 *
 * @param {String} [filter]
 *    CSS selector to skip nodes of unwanted elements.
 *
 * @example collectTextNodes(el, "#ignore > .this");
 * @return {CharacterData[]}
 */
export function collectTextNodes(el, filter = ""){
	const nodes = [];
	for(const node of el.childNodes)
		switch(node.nodeType){
			case Node.TEXT_NODE:
				nodes.push(node);
				break;
			case Node.ELEMENT_NODE:
				if(!filter || !node.matches(filter))
					nodes.push(...collectTextNodes(node));
		}
	return nodes;
}


/**
 * Get or set a cookie's value.
 *
 * If neither name or value are passed, the function returns all
 * available cookies enumerated as a single object-hash.
 *
 * @param {String}  name - Cookie's name
 * @param {String}  [value] - Value to assign. Passing `null` deletes the cookie.
 * @param {Object}  [attr={}] - Cookie attributes used when invoked as a setter.
 * @param {String}  [attr.expires=""] - GMT-formatted expiration date
 * @param {String}  [attr.path=""] - Absolute path of cookie
 * @param {String}  [attr.domain=""] - Domains/subdomains
 * @param {Boolean} [attr.secure=false] - Specify cookie must be sent over HTTPS.
 * @return {String} If invoked as a getter, returns cookie's existing value.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie}
 */
export function cookie(name, value, options = {}){
	
	// If no name was specified, return all available cookies.
	if(!name){
		const output = {};
		for(const cookie of document.cookie.split(/;\s*/)){
			const split = cookie.indexOf("=");
			if(cookie && split > 0){
				const name   = cookie.substr(0, split);
				const value  = cookie.substr(split + 1);
				output[name] = decodeURIComponent(value);
			}
		}
		return output;
	}
	
	// Getter
	if(undefined === value){
		const split = name.length + 1;
		for(const cookie of document.cookie.split(/;\s*/))
			if(name + "=" === cookie.substr(0, split))
				return decodeURIComponent(cookie.substr(split));
		return null;
	}
	
	// Setter
	else{
		let {expires} = options;
		if(null === value){
			expires = -1;
			value   = "";
		}
		if(expires){
			const dateObj = !(expires instanceof Date)
				? new Date(Date.now() + (86400000 * expires))
				: expires;
			expires = dateObj.toUTCString();
		}
		document.cookie = name + "=" + encodeURIComponent(value)
			+ (expires        ? "; expires="+ expires        : "")
			+ (options.path   ? "; path="   + options.path   : "")
			+ (options.domain ? "; domain=" + options.domain : "")
			+ (options.secure ? "; secure"  : "");
	}
}


/**
 * Return the deepest-nested descendant of an element.
 *
 * @param {Element} el
 * @return {Node}
 */
export function deepest(el){
	if(!el.childElementCount) return el;
	const branches = [];
	for(const child of el.querySelectorAll("*")){
		let depth = 0;
		let parent = child.parentNode;
		while(parent !== el){
			++depth;
			parent = parent.parentNode;
		}
		branches.push([depth, child]);
	}
	let max = [-1, null];
	for(const child of branches)
		if(child[0] > max[0]) max = child;
	return max[1];
}


/**
 * Export a table's data as a list of objects.
 *
 * @param {HTMLTableElement} table
 * @return {Object[]}
 */
export function extractTableData(table){
	const headers = [];
	const data = [];
	
	// Column names
	const tHeads = table.tHead
		? table.tHead.querySelectorAll("tr:first-child > th")
		: table.tBodies[0].querySelectorAll("tr:first-child > td");
	for(const th of tHeads)
		headers.push(th.textContent.trim());
	
	// Table data
	for(const tBody of table.tBodies)
		for(const tr of tBody.rows){
			let columnIndex = 0;
			const row = {};
			for(const cell of tr.cells){
				const columnName = headers[columnIndex++];
				row[columnName] = cell.textContent.trim();
			}
			data.push(row);
		}
	return data;
}


/**
 * Measure the scrollbar-width of the current OS/device.
 *
 * @example getScrollbarWidth() == 12 // Windows 10
 * @example getScrollbarWidth() == 0  // macOS
 * @return {Number}
 */
export function getScrollbarWidth(){
	const doc = document.body || document.documentElement;
	const tmp = document.createElement("div");
	const {style} = tmp;
	const size    = 120;
	style.cssText = `width: ${size}px; height: ${size}px; overflow: auto;`;
	tmp.innerHTML = " W ".repeat(size * 5);
	
	doc.appendChild(tmp);
	const width = tmp.offsetWidth - tmp.scrollWidth;
	doc.removeChild(tmp);
	return width;
}


/**
 * Resolve the name of the supported WebGL rendering context.
 *
 * If no WebGL is unsupported, an empty string is returned.
 *
 * @example getWebGLSupport() == "webgl"     // Chrome 57
 * @example getWebGLSupport() == "moz-webgl" // Old FireFox
 * @return {String}
 */
export function getWebGLSupport(){
	const canvas = document.createElement("canvas");
	const names = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
	for(const name of names)
		try{ if(canvas.getContext(name)) return name; }
		catch(e){ }
	return "";
}


/**
 * Inject <wbr /> elements into lengthy words in an element.
 *
 * @uses {@link collectTextNodes}
 * @param {Element} element
 *    DOM element to operate upon.
 * @param {Number} [limit=80]
 *    Number of characters to traverse in a single word before inserting a breakpoint.
 * @return {HTMLElement} An array of <wbr /> elements that were inserted.
 */
export function injectWordBreaks(element, limit = 80){
	const terminators = '.,+*?$|#{}()\\^\\-\\[\\]\\\\/!%\'"~=<>_:;\\s';
	const regexSource = "([^" + terminators + "]{" + limit + "})";
	
	const injections = [];
	for(const node of collectTextNodes(element)){
		const splitBy = new RegExp(regexSource, "g");
		const breakPoints = [];
		
		// Collect a list of insertion points.
		while(splitBy.exec(node.data))
			breakPoints.push(splitBy.lastIndex);
		
		for(const breakPoint of breakPoints.reverse()){
			const wbr = document.createElement("wbr");
			const otherHalf = node.splitText(breakPoint);
			node.parentNode.insertBefore(wbr, otherHalf);
			injections.push(wbr);
		}
	}
	return injections;
}


/**
 * Determine if a font is monospaced (has fixed-width letterforms).
 *
 * @example isFixedWidth("Courier") == true
 * @example isFixedWidth("Times") == false
 * @param {String} font - Any string accepted as a CSS font-family value
 * @return {Boolean}
 */
export function isFixedWidth(font){
	const el = document.createElement("div");
	Object.assign(el.style, {
		all:        "reset",
		fontFamily: font,
		fontSize:   "72px",
		fontVariantLigatures: "none",
		overflow:   "scroll",
		position:   "fixed",
		whiteSpace: "pre",
		width:      "10px",
		height:     "10px",
	});
	const widths = new Map();
	document.body.appendChild(el);
	for(let i = 32; i < 127; ++i){
		el.textContent = String.fromCharCode(i).repeat(300);
		widths.set(i, ~~el.scrollWidth);
	}
	document.body.removeChild(el);
	return 1 === new Set(widths.values()).size;
}


/**
 * Retrieve a node's first ancestor which matches a CSS selector.
 *
 * @param {Node} subject - DOM node to query the ancestry of
 * @param {String} selector - A CSS selector string
 * @param {Boolean} [ignoreSelf=false] - Exempt subject from matching selector
 * @return {Element} The closest matching container, or `null` if nothing in the searched ancestry matched the selector.
 */
export function nearest(subject, selector, ignoreSelf = false){
	subject = ignoreSelf ? subject.parentNode : subject;
	if("function" === typeof Element.prototype.matches)
		while(subject){
			if(subject.matches(selector)) return subject;
			subject = subject.parentNode;
		}
	else{ // Dumbed-down version for IE8
		const matches = document.querySelectorAll(selector);
		if(matches.length) while(subject){
			for(const match of matches)
				if(match === subject) return subject;
			subject = subject.parentNode;
		}
	}
	return null;
}


/**
 * Check if the browser is a particular version of Internet Explorer.
 *
 * @example isIE(8, ">") == // IE9+
 * @param {String} version - Version to check against.
 * @param {String} operand - String describing the type of comparison to perform.
 * @return {Boolean}
 */
export function isIE(version, operator){
	switch(operator){
		case "<":  operator = "lt ";  break;
		case "<=": operator = "lte "; break;
		case ">":  operator = "gt ";  break;
		case ">=": operator = "gte "; break;
		case "!=": operator = "!";    break;
		default:   operator = "";     break;
	}
	const div = document.createElement("div");
	div.innerHTML = "<!--[if " + operator + "IE " + version + "]><i></i><![endif]-->";
	return !!div.getElementsByTagName("i").length;
}


/**
 * Create a new DOM element.
 *
 * @example New("div", {
 *   className: "foo",
 *   textContent: "bar"
 * }) == HTML`<div class="foo">bar</div>`
 * 
 * @param {String} type - Tag-name of element to create.
 * @param {Object} [attr] - Optional attributes to assign.
 * @return {Element}
 */
export function New(type, attr = null){
	function absorb(a, b){
		for(const i in b)
			if(Object(a[i]) === a[i] && Object(b[i]) === b[i])
				absorb(a[i], b[i]);
			else a[i] = b[i];
	}
	const node = document.createElement(type);
	if(null !== attr) absorb(node, attr);
	return node;
}


/**
 * Convert a CSS {@link https://developer.mozilla.org/en-US/docs/Web/CSS/time|`time`} to milliseconds.
 *
 * @example parseCSSDuration("4s") == 4000
 * @param {String} value - A CSS time value
 * @return {Number}
 */
export function parseCSSDuration(time){
	if("string" !== typeof time) return time;
	return parseFloat(time) * (/\ds\s*$/.test(time) ? 1000 : 1);
}


/**
 * Extract DOM elements from a chunk of HTML source.
 *
 * @param {String} input
 * @return {Node[]}
 */
export function parseHTMLFragment(input){
	const fragment = document.createDocumentFragment();
	const output = [];
	let tagType = (input.match(/^[^<]*<([-\w]+)/) || [, ""])[1];
	switch(tagType.toLowerCase()){
		case "thead":
		case "tbody":
		case "tfoot":
		case "caption":
			input = "<table>" + input + "</table>";
			break;
		case "tr":
			input = "<table><tbody>" + input + "</tbody></table>";
			break;
		case "th":
		case "td":
			input = "<table><tbody><tr>" + input + "</tr></tbody></table>";
			break;
		default:
			tagType = "";
	}
	let root = fragment.appendChild(document.createElement("div"));
	root.insertAdjacentHTML("afterbegin", input);
	if(tagType && (tagType = root.querySelector(tagType)))
		root = tagType.parentNode;
	while(root.firstChild)
		output.push(root.removeChild(root.firstChild));
	return output;
}


/**
 * Check if the browser supports a CSS property.
 *
 * @example supportsCSSProperty("Transform") == false in IE8
 * @param {String} name - CSS property name, supplied in sentence case (e.g., "Transition")
 * @return {Boolean} Whether the browser supports the property (either prefixed or unprefixed).
 */
export function supportsCSSProperty(name){
	const {style} = document.documentElement;
	if(name[0].toLowerCase() + name.slice(1) in style) return true;
	const prefixes = [
		"Webkit", "Moz", "Ms", "O", "Khtml",
		"webkit", "moz", "ms", "o", "khtml",
	];
	for(const prefix of prefixes)
		if(prefix + name in style) return true;
	return false;
}


/**
 * Check if the browser understands a CSS selector.
 *
 * Not supported in IE6-7, which always report `true` (even for unsupported selectors).
 *
 * @example supportsCSSSelector("input:checked")
 * @param {String} selector
 * @return {Boolean}
 */
export function supportsCSSSelector(selector){
	const ruleset = selector + "{}";
	const styleEl = document.body.appendChild(document.createElement("style"));
	let {sheet} = styleEl;
	
	if(sheet){
		styleEl.textContent = ruleset;
		sheet = styleEl.sheet;
	}
	else{
		sheet = styleEl.styleSheet;
		sheet.cssText = ruleset;
	}
	
	const {length} = sheet.cssRules || sheet.rules;
	document.body.removeChild(styleEl);
	return 0 !== length;
}


/**
 * Check if the browser appears to support a CSS unit.
 *
 * @example supportsCSSUnit("rem")
 * @param {String} name - Unit's name
 * @return {Boolean}
 */
export function supportsCSSUnit(name){
	try{
		const d = document.createElement("div");
		d.style.width = "32" + name;
		return d.style.width === "32" + name;
	} catch(e){ return false; }
}
