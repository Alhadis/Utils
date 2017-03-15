"use strict";


/**
 * Encode a UTF-8 string using MIME base64.
 *
 * @example base64Encode("cáfé") == "Y8OhZsOp"
 * @param {String} data
 * @return {String}
 */
function base64Encode(data){

	// Convert UTF-8 strings to whatever "normal" encoding is needed to safely manipulate data at binary-level.
	data = ((data => {
		let output = "";
		const char = String.fromCharCode;
		const {length} = data;
		for(let i = 0; i < length; ++i){
			const c = data.charCodeAt(i);
			if(c < 128)                      output += char(c);
			else if((c > 127) && (c < 2048)) output += char((c >> 6)  | 192) + char((c & 63)        | 128);
			else                             output += char((c >> 12) | 224) + char(((c >> 6) & 63) | 128) + char((c & 63) | 128);
		}
		return output;
	})(data.replace(/\r\n/g, "\n")));
	
	// Apply base64 encoding
	const codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	let encoded = ""
	for(let i = 5, n = data.length * 8 + 5; i < n; i += 6)
		encoded += codex[(data.charCodeAt(~~(i/8)-1) << 8 | data.charCodeAt(~~(i/8))) >> 7 - i%8 & 63];
	for(; encoded.length % 4; encoded += "=");
	return encoded;
}


/**
 * Decode a base64-encoded string as UTF-8.
 *
 * @example base64Decode("Y8OhZsOp") == "cáfé"
 * @param {String} data
 * @return {String}
 */
function base64Decode(data){
	const codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	const char = String.fromCharCode;
	let output = "";
	let i = 0;
	data = data.replace(/[^A-Za-z0-9\+\/=]/g, "");
	
	const {length} = data;
	while(i < length){
		const a = codex.indexOf(data[i++]);
		const b = codex.indexOf(data[i++]);
		const c = codex.indexOf(data[i++]);
		const d = codex.indexOf(data[i++]);
		output += char((a << 2) | (b >> 4));
		if(64 !== c) output += char(((b & 15) << 4) | (c >> 2));
		if(64 !== d) output += char(((c &  3) << 6) | d);
	}
	
	// Re-encode data as UTF-8
	return ((data => {
		const {length} = data;
		let output = "";
		let i = 0;
		while(i < length){
			const c = data.charCodeAt(i);
			if(c < 128){                      output += char(c); ++i; }
			else if((c > 191) && (c < 224)){  output += char(((c & 31) <<  6) |  (data.charCodeAt(i+1) & 63)); i += 2; }
			else{                             output += char(((c & 15) << 12) | ((data.charCodeAt(i+1) & 63) << 6) | (data.charCodeAt(i+2) & 63)); i += 3; }
		}
		return output;
	})(output));
}


/**
 * Generate a base64-encoded 4x4-size PNG image of a designated RGBA value.
 *
 * @param {Number} r - Red component (0-255)
 * @param {Number} g - Green component (0-255)
 * @param {Number} b - Blue component (0-255)
 * @param {Number} a - Alpha value (0-255: transparent to opaque)
 * @param {Boolean} [raw=false] - Return raw, unencoded bytestream.
 *
 * @return {String} Base64-encoded PNG data
 * @example rgba(255, 0, 0, 255) == "iVBORw0KGgoAAAANSU…ErkJggg=="
 */
function rgba(r, g, b, a, raw = false){
	const char = String.fromCharCode;
	const hton = i => String.fromCharCode(i >>> 24, i >>> 16 & 255, i >>> 8 & 255, i & 255);
	
	// PNG header
	const IHDR = "\x89PNG\r\n\x1A\n\0\0\0\rIHDR\0\0\0\x04\0\0\0\x04\x08\x06\0\0\0\xA9\xF1\x9E~\0\0\0O";
	
	// IDAT (Image Data) chunk
	const IDAT = "IDAT\x08\x1D\x01D\0\xBB\xFF";
	const data = "\x01" + char(r) + char(g) + char(b) + char(a) + "\0".repeat(12)
		+ "\x02" + `${"\0".repeat(16)}\x02`.repeat(2)
		+ "\0".repeat(16);
	
	const crc1 = hton((data => {
		// Addler's algorithm
		let a = 1, b = 0;
		const l = data.length;
		const k = 65521;
		for(let i = 0; i < l; ++i){
			a = (a + data.charCodeAt(i)) % k;
			b = (b + a) % k;
		}
		return b << 16 | a;
	})(data));
	
	const crc2 = hton((data => {
		// CRC32
		let c = ~0;
		const l = data.length;
		for(let i = 0; i < l; ++i)
			for(let b = data.charCodeAt(i) | 0x100; b != 1; b >>>= 1)
				c = (c >>> 1) ^ ((c ^ b) & 1 ? 0xEDB88320 : 0);
		return ~c;
	})(IDAT + data + crc1));

	// Concatenate image-data and close PNG stream with IEND chunk.
	const bytes = IHDR + IDAT + data + crc1 + crc2 + "\0".repeat(4) + "IEND\xAEB`\x82";
	
	return raw ? bytes : ((data => {
		// Base64-encode that bitch
		const codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
		let encoded = "";
		for(let i = 5, n = data.length * 8 + 5; i < n; i += 6)
			encoded += codex[(data.charCodeAt(~~(i/8)-1) << 8 | data.charCodeAt(~~(i/8))) >> 7 - i%8 & 63];
		for(; encoded.length % 4; encoded += "=");
		return encoded;
	})(bytes));
}


/**
 * Encode a sequence of single-byte characters as UTF-8.
 *
 * @example UTF8Encode("cÃ¡fÃ©bÃ¡bÃ©") == "cáfébábé"
 * @param {String} data
 * @return {String}
 */
function UTF8Encode(data){
	const {length} = data;
	let s = "";
	let i = 0;
	while(i < length){
		const c = data.charCodeAt(i);
		if(c < 128)                     { s += String.fromCharCode(c); ++i; }
		else if((c > 191) && (c < 224)) { s += String.fromCharCode(((c & 31) << 6)  |  (data.charCodeAt(i+1) & 63)); i += 2; }
		else                            { s += String.fromCharCode(((c & 15) << 12) | ((data.charCodeAt(i+1) & 63) << 6) | (data.charCodeAt(i+2) & 63)); i += 3; }
	}
	return s;
}


/**
 * Break a UTF-8 string into a stream of single-byte sequences.
 *
 * @example UTF8Decode("cáfébábé") == "cÃ¡fÃ©bÃ¡bÃ©"
 * @param {String} data
 * @return {String}
 */
function UTF8Decode(data){
	data = data.replace(/\r(?=\n)/g, "");
	const {length} = data;
	let output = "";
	for(let i = 0; i < length; ++i){
		const c = data.charCodeAt(i);
		if(c < 128)                      output += String.fromCharCode(c);
		else if((c > 127) && (c < 2048)) output += String.fromCharCode((c >> 6)  | 192) + String.fromCharCode((c & 63)        | 128);
		else                             output += String.fromCharCode((c >> 12) | 224) + String.fromCharCode(((c >> 6) & 63) | 128) + String.fromCharCode((c & 63) | 128);
	}
	return output;
}
