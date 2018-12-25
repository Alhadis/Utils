/**
 * Encode data using MIME base64.
 *
 * @example base64Encode([0x63, 0xE1, 0x66, 0xE9]) == "Y+Fm6Q==";
 * @example base64Encode("cáfébábé") == "Y+Fm6WLhYuk=";
 * @param {String|Number[]} bytes
 * @return {String}
 */
export function base64Encode(bytes){
	
	// Split strings into arrays of codepoints
	if("string" === typeof bytes)
		bytes = [...bytes].map(c => c.charCodeAt(0));
	
	const codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	let encoded = "";
	for(let i = 5, n = bytes.length * 8 + 5; i < n; i += 6)
		encoded += codex[(bytes[~~(i / 8) - 1] << 8 | bytes[~~(i / 8)]) >> 7 - i % 8 & 63];
	for(; encoded.length % 4; encoded += "=");
	return encoded;
}


/**
 * Decode base64-encoded data.
 *
 * @example base64Decode("Y+Fm6Q==") == [0x63, 0xE1, 0x66, 0xE9];
 * @example base64Decode("YuFi6Q==", true) == "bábé";
 * @param {String} data
 * @param {Boolean} [asBytes=false]
 * @return {String|Number[]}
 */
export function base64Decode(data, asBytes = false){
	const codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	const bytes = [];
	let i = 0;
	data = data.replace(/[^A-Za-z0-9+/=]/g, "");
	
	const {length} = data;
	while(i < length){
		const a = codex.indexOf(data[i++]);
		const b = codex.indexOf(data[i++]);
		const c = codex.indexOf(data[i++]);
		const d = codex.indexOf(data[i++]);
		bytes.push((a << 2) | (b >> 4));
		if(64 !== c) bytes.push(((b & 15) << 4) | (c >> 2));
		if(64 !== d) bytes.push(((c &  3) << 6) | d);
	}
	
	return asBytes ? bytes : String.fromCharCode(...bytes);
}


/**
 * Generate a 4×4-sized PNG image filled with the designated RGBA value.
 *
 * @example base64Encode(rgba(255, 0, 0, 255)) == "iVBORw0KGgoAAAANSU…ErkJggg==";
 * @param {Number} r - Red component (0-255)
 * @param {Number} g - Green component (0-255)
 * @param {Number} b - Blue component (0-255)
 * @param {Number} a - Alpha value (0-255: transparent to opaque)
 * @return {String} Raw PNG data
 */
export function rgba(r, g, b, a){
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
		// Adler's algorithm
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
			for(let b = data.charCodeAt(i) | 0x100; b !== 1; b >>>= 1)
				c = (c >>> 1) ^ ((c ^ b) & 1 ? 0xEDB88320 : 0);
		return ~c;
	})(IDAT + data + crc1));

	// Concatenate image-data and close PNG stream with IEND chunk.
	return IHDR + IDAT + data + crc1 + crc2 + "\0".repeat(4) + "IEND\xAEB`\x82";
}


/**
 * Encode a sequence of single-byte characters as UTF-8.
 *
 * @example utf8Encode("cÃ¡fÃ©bÃ¡bÃ©") == "cáfébábé"
 * @param {String} data
 * @return {String}
 */
export function utf8Encode(data){
	let result = "";
	let offset = 0;
	const char = String.fromCharCode;
	const get = i => data.charCodeAt(i);
	const {length} = data;
	while(offset < length){
		const code = get(offset);
		if(code < 128){
			result += char(code);
			++offset;
		}
		else if(code > 191 && code < 224){
			result += char(((code & 31) << 6) | (get(offset + 1) & 63));
			offset += 2;
		}
		else{
			result += char(((code & 15) << 12) | ((get(offset + 1) & 63) << 6) | (get(offset + 2) & 63));
			offset += 3;
		}
	}
	return result;
}


/**
 * Break a UTF-8 string into a stream of single-byte sequences.
 *
 * @example utf8Decode("cáfébábé") == "cÃ¡fÃ©bÃ¡bÃ©"
 * @param {String} data
 * @return {String}
 */
export function utf8Decode(data){
	data = data.replace(/\r\n/g, "\n");
	let result = "";
	const char = String.fromCharCode;
	const {length} = data;
	for(let i = 0; i < length; ++i){
		const code = data.charCodeAt(i);
		if(code < 128)
			result += char(code);
		else if(code > 127 && code < 2048)
			result += char((code >> 6) | 192, (code & 63) | 128);
		else
			result += char((code >> 12) | 224, ((code >> 6) & 63) | 128, (code & 63) | 128);
	}
	return result;
}
