/**
 * Draw a polygon from a sequence of points.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Number[]} points
 */
function drawPolygon(context, points){
	context.beginPath();
	for(const point of points){
		const [x, y] = point;
		context.lineTo(x, y);
	};
	context.closePath();
	context.stroke();
};


/**
 * Return the context's current font-style as separate properties.
 *
 * @param {CanvasRenderingContext2D} context
 * @return {Object} Hash of font-related CSS properties.
 */
function getCanvasFont(context){
	const el = document.createElement("div");
	el.style.cssText = "font: " + context.font + " !important;";
	
	context.canvas.appendChild(el);
	const style = window.getComputedStyle(el);
	const output = {
		fontFamily:   style.fontFamily,
		fontSize:     style.fontSize,
		fontStyle:    style.fontStyle,
		fontVariant:  style.fontVariant,
		fontWeight:   style.fontWeight,
		lineHeight:   style.lineHeight
	};
	context.canvas.removeChild(el);
	return output;
}


/**
 * Draw a soft-wrapping, rectangular region of text.
 *
 * @uses {@link getCanvasFont}
 * @param {CanvasRenderingContext2D} context
 * @param {String|Array} text - Text content, expressed as either a string or an array of substrings representing each word.
 * @param {Number} [x=0] - X coordinate of textarea.
 * @param {Number} [y=0] - Y coordinate of textarea.
 * @param {Number} [w=(context.canvas.width - x * 2)] - Textarea's width
 * @param {Number} [h=(context.canvas.height - y * 2)] - Textarea's height
 * @param {Number} [leading=1] - Multiplier to adjust overall line-height.
 * @param {Number} [indent=0] - Leading indentation applied to first line.
 *
 * @return {Object} A hash keyed with the following properties:
 *  - x: X coordinate that the context finished drawing text at (relative to canvas object).
 *  - y: Y coordinate the context finished drawing text at
 *  - remainder: Remaining text that couldn't fit inside the textarea.
 */
function drawTextArea(context, text, x=0, y=0, w=0, h=0, leading=1, indent=0){
	const words = Array.isArray(text) ? text : text.split(/\b(?=\S)|(?=\s)/g);
	const font = getCanvasFont(context);
	const size = parseInt(font.fontSize);
	const {textBaseline} = context;
	context.textBaseline = "top";
	
	let rowLength = indent;
	let totalHeight = 0;
	leading *= size;
	w = w || context.canvas.width - x * 2;
	h = h || context.canvas.height - y * 2;
	
	for(let i = 0; i < words.length; ++i){
		let diff, width;

		// Newline: Don't measure, just increase total height
		if("\n" === words[i]){
			rowLength = 0;
			totalHeight += leading;
			
			// Terminate if newline pushed remaining text outside drawing area
			if(totalHeight + leading >= h) return {
				x: rowLength + x,
				y: totalHeight + y,
				remainder: words.slice(i)
			};
			continue;
		}

		// Strip leading tabs
		if(!rowLength && /^\t+/.test(words[i]))
			words[i] = words[i].replace(/^\t+/, "");
		
		// This is one honkin' long word, so try to hyphenate it
		let s, measuredWidth = context.measureText(words[i]).width;
		if(0 >= (diff = w - measuredWidth)){
			diff = Math.abs(diff);
			
			// Decide which end to measure from.
			if(diff - w <= 0)
				for(s = words[i].length; s; --s){
					const string = words[i].substr(0, s) + "-";
					if(w > context.measureText(string.width + size)){
						breakPoint = s;
						break;
					}
				}
			else{
				const {length} = words[i];
				for(let s = 0; s < length; ++s){
					const string = words[i].substr(0, s + 1) + "-";
					if(w < context.measureText(string.width + size)){
						breakPoint = s;
						break;
					}
				}
			}
			if(breakPoint){
				const left  = words[i].substr(0, s+1) + "-";
				const right = words[i].substr(s+1);
				words[i] = left;
				words.splice(i+1, 0, right);
				measuredWidth = context.measureText(left).width;
			}
		}
		
		// No room on current line to fit next word: start another line.
		if(rowLength > 0 && rowLength + measuredWidth >= w){
			
			// We've run out of vertical room too. Return any remaining words that couldn't fit.
			if(totalHeight + leading * 2 >= h) return {
				x: rowLength   + x,
				y: totalHeight + y,
				remainder: words.slice(i)
			};
			rowLength = 0;
			totalHeight += leading;

			// If current word is just a space, skip it to avoid adding a weird-looking gap.
			if(" " === words[i]) continue;
		}

		// Write another word and increase total line-length.
		context.fillText(words[i], rowLength+x, totalHeight+y);
		rowLength += measuredWidth;
	}

	// Restore original context.textBaseline
	context.textBaseline = textBaseline;
	return {x: rowLength + x, y: totalHeight + y, remainder: []};
}



/**
 * Draw a DOM element to the canvas.
 *
 * Not supported on IE9.
 *
 * @param {CanvasRenderingContext2D} context
 * @param {Node} node
 * @param {Number} [x=0]
 * @param {Number} [y=0]
 * @param {Number} [w=context.canvas.width]
 * @param {Number} [h=context.canvas.height]
 * @return {Image}
 */
function drawHTML(context, node, x=0, y=0, w=0, h=0){
	w = w || context.canvas.width;
	h = h || context.canvas.height;
	
	// Snapshot rendered appearance of each contained element
	const nodeAppearances = [];
	for(const child of node.querySelectorAll("*")){
		const style = window.getComputedStyle(child);
		nodeAppearances.push(style.cssText || (function(){
			let cssText = "";
			for(const name of style){
				const value = style[name];
				if(value) cssText += `${name}: ${value}; `;
			}
			return cssText;
		}()));
	}
	
	// Assumption: descendants of cloned node are returned in the same order as before
	const carbonCopy = node.cloneNode(true);
	Array.from(carbonCopy.querySelectorAll("*")).forEach((child, i) =>
		child.setAttribute("style", nodeAppearances[i]));
	
	// Parse node's HTML content as well-formed XHTML: needed to pass through SVG
	const doc = document.implementation.createHTMLDocument("");
	doc.documentElement.setAttribute("xmlns", doc.documentElement.namespaceURI);
	doc.body.innerHTML = carbonCopy.outerHTML;
	const markup = (new XMLSerializer).serializeToString(doc).replace(/<!DOCTYPE[^>]*>/i, "");
	const svgSrc = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}px" height="${h}px">` +
		`<foreignObject width="100%" height="100%">` +
			`<div xmlns="http://www.w3.org/1999/xhtml">${markup}</div>` +
		"</foreignObject></svg>";
	
	// Generate image
	const img = new Image();
	img.onload = () => context.drawImage(img, x, y, w, h);
	img.src = "data:image/svg+xml;utf8," + encodeURIComponent(svgSrc);
	return img;
}
