/**
 * Compute the Adler-32 checksum of a value.
 *
 * @example adler32("foo-bar") == 0xAA402A7;
 * @see {@link https://en.wikipedia.org/wiki/Adler-32}
 * @param {String|Number[]} data
 * @return {Number}
 */
export function adler32(data){
	if("string" === typeof data)
		data = [...data].map(c => c.charCodeAt(0));
	let a = 1;
	let b = 0;
	const base = 65521;
	const {length} = data;
	for(let i = 0; i < length; ++i){
		a = (a + data[i]) % base;
		b = (b + a)       % base;
	}
	return b << 16 | a;
}


/**
 * Convert bytes to 16-bit unsigned integers.
 *
 * @example bytesToUInt16([0xFF, 0xBB]) == [0xFFBB];
 * @param {Number[]} bytes
 * @return {Number[]}
 */
export function bytesToUInt16(bytes){
	const words = [], {length} = bytes;
	for(let i = 0; i < length; words.push(((bytes[i++] << 8) | bytes[i++]) >>> 0));
	return words;
}


/**
 * Convert bytes to 32-bit unsigned integers.
 *
 * @example bytesToUInt32([0xAA, 0xBB, 0xCC, 0xDD]) == [0xAABBCCDD];
 * @param {Number[]} bytes
 * @return {Number[]}
 */
export function bytesToUInt32(bytes){
	const words = [], {length} = bytes;
	for(let i = 0; i < length; words.push((
		(bytes[i++] << 24) |
		(bytes[i++] << 16) |
		(bytes[i++] << 8)  |
		(bytes[i++])
	) >>> 0));
	return words;
}


/**
 * Convert bytes to 64-bit unsigned integers.
 *
 * @example bytesToUInt64([17,34,51,68,85,102,119,136]) == [0x1122334455667788n];
 * @param {Number[]} bytes
 * @return {BigInt[]}
 */
export function bytesToUInt64(bytes){
	const words = [], {length} = bytes;
	for(let i = 0; i < length; words.push(
		(BigInt(bytes[i++] || 0) << 56n) |
		(BigInt(bytes[i++] || 0) << 48n) |
		(BigInt(bytes[i++] || 0) << 40n) |
		(BigInt(bytes[i++] || 0) << 32n) |
		(BigInt(bytes[i++] || 0) << 24n) |
		(BigInt(bytes[i++] || 0) << 16n) |
		(BigInt(bytes[i++] || 0) << 8n)  |
		(BigInt(bytes[i++] || 0))));
	return words;
}


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
 * Compute a 32-bit cyclic redundancy check.
 *
 * @example crc32("Foo123") == 0x67EDF5DB;
 * @param {String|Number[]} data
 * @return {Number}
 */
export function crc32(data){
	if("string" === typeof data)
		data = [...data].map(c => c.charCodeAt(0));
	let crc = ~0;
	const {length} = data;
	for(let i = 0; i < length; ++i)
		for(let byte = data[i] | 0x100; byte !== 1; byte >>>= 1)
			crc = (crc >>> 1) ^ ((crc ^ byte) & 1 ? 0xEDB88320 : 0);
	return ~crc;
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
 * @uses {@link adler32}, {@link crc32}
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
	
	const crc1 = hton(adler32(data));
	const crc2 = hton(crc32(IDAT + data + crc1));

	// Concatenate image-data and close PNG stream with IEND chunk.
	return IHDR + IDAT + data + crc1 + crc2 + "\0".repeat(4) + "IEND\xAEB`\x82";
}


/**
 * Compute the SHA-1 checksum of a byte-array.
 *
 * @example sha1([120, 121, 122]) == "66b27417d37e024c46526c2f6d358a754fc552f3";
 * @param {Number[]} input
 * @return {String} A 160-bit message digest
 * @uses {@link bytesToUInt32}
 */
export function sha1(input){
	const ml = input.length * 8;
	input = bytesToUInt32(input);
	let [h0, h1, h2, h3, h4] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
	
	// Preprocessing
	input[ml >>> 5] |= 128 << (24 - ml % 32);
	input[15 + ((64 + ml >>> 9) << 4)] = ml;
	
	// Circular left-shift
	const rotl = (x, n) => (x << n) | (x >>> (32 - n));
	
	const w = [], {length} = input;
	for(let i = 0; i < length; i += 16){
		let a = h0, b = h1, c = h2, d = h3, e = h4, f, k;
		
		// Main loop
		for(let t = 0; t < 80; ++t){
			w[t] = t < 16
				? (input[i + t] >>> 0)
				: rotl(w[t-3] ^ w[t-8] ^ w[t-14] ^ w[t-16], 1);
			
			[f, k] =
				t < 20 ? [b & c | ~b & d,        0x5A827999] :
				t < 40 ? [b ^ c ^ d,             0x6ED9EBA1] :
				t < 60 ? [b & c | b & d | c & d, 0x8F1BBCDC] :
				[b ^ c ^ d, 0xCA62C1D6];
			
			const temp = rotl(a, 5) + f + e + w[t] + k;
			e = d, d = c, c = rotl(b, 30), b = a, a = temp;
		}
		h0 += a;
		h1 += b;
		h2 += c;
		h3 += d;
		h4 += e;
	}
	return (
		(BigInt(h0 >>> 0) << 128n) |
		(BigInt(h1 >>> 0) << 96n)  |
		(BigInt(h2 >>> 0) << 64n)  |
		(BigInt(h3 >>> 0) << 32n)  |
		(BigInt(h4 >>> 0))
	).toString(16);
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


/**
 * Decode a base64-encoded variable-length quantity.
 *
 * @example vlqDecode("8Egkh9BwM8EA") == [78, 1000000, 200, 78, 0];
 * @param {String} input
 * @return {Number[]}
 */
export function vlqDecode(input){
	const codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	const values = [];
	const {length} = input;
	let more, shift = 0, value = 0;
	for(let i = 0; i < length; ++i){
		const byte = codex.indexOf(input[i]);
		if(-1 === byte)
			throw new Error("Bad character: " + input[i]);
		more   =  byte & 32;
		value += (byte & 31) << shift;
		if(more)
			shift += 5;
		else{
			const negated = value & 1;
			value >>= 1;
			values.push(negated ? value ? -value : -0x80000000 : value);
			more = shift = value = 0;
		}
	}
	return values;
}


/**
 * Encode an integer as a base64-encoded variable-length quantity.
 *
 * @example vlqEncode(0x1FFFFF) == "+///D";
 * @param {Number} input
 * @return {String}
 */
export function vlqEncode(input){
	const codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	let encoded = "";
	input = input < 0 ? (-input << 1) | 1 : (input << 1);
	do {
		let value = input & 31;
		if(input >>>= 5) value |= 32;
		encoded += codex[value];
	} while(input > 0);
	return encoded;
}


/**
 * Generate a `Sec-WebSocket-Accept` header for a WebSocket handshake.
 *
 * @example wsHandshake("dGhlIHNhbXBsZSBub25jZQ==") == "s3pPLMBiTxaQ9kYGzzhZRbK+xOo=";
 * @see {@link https://datatracker.ietf.org/doc/rfc6455/?include_text=1}
 * @param {String} key - `Sec-WebSocket-Key` field sent from the client
 * @return {String}
 * @uses {@link base64Encode}, {@link sha1}
 */
export function wsHandshake(key){
	key += "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
	return base64Encode(sha1(key.split("").map(n => n.charCodeAt(0)))
		.padStart(40, "0")
		.match(/.{2}/g)
		.map(n => parseInt(n, 16)));
}


/**
 * Decode a WebSocket frame without unmasking its data.
 *
 * @example
 * // Read a single-frame, unmasked text message containing "Hello"
 * wsDecodeFrame([0x81, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F]) == {
 *    isFinal: true,
 *    isRSV1:  false,
 *    isRSV2:  false,
 *    isRSV3:  false,
 *    opcode:  "text",
 *    length:  5n,
 *    data:    [72, 101, 108, 108, 111],
 *    mask:    null,
 * };
 *
 * @see {@link wsMask}
 * @param {Number[]} input - Byte-array
 * @return {Object}
 */
export function wsDecodeFrame(input){
	const [byte]  = input;
	const isFinal = !!(byte & 0x80);
	const isRSV1  = !!(byte & 0x40);
	const isRSV2  = !!(byte & 0x20);
	const isRSV3  = !!(byte & 0x10);
	const opcode  = {
		__proto__: null,
		0:  "continue",
		1:  "text",
		2:  "binary",
		8:  "close",
		9:  "ping",
		10: "pong",
	}[byte & 0x0F] || "reserved";

	// Resolve payload length
	let skip = 0, length = BigInt(input[1]) & 0x7Fn;
	if(126n === length)
		skip = 2, length = BigInt(input[2] << 8 | input[3]);
	else if(127n === length)
		skip = 8, length =
			(BigInt(input[2]) << 56n) |
			(BigInt(input[3]) << 48n) |
			(BigInt(input[4]) << 40n) |
			(BigInt(input[5]) << 32n) |
			(BigInt(input[6]) << 24n) |
			(BigInt(input[7]) << 16n) |
			(BigInt(input[8]) << 8n)  |
			(BigInt(input[9]));

	// Resolve masking key
	let mask = null;
	if(input[1] & 0x80) mask =
		(input[2 + skip++] << 24) |
		(input[2 + skip++] << 16) |
		(input[2 + skip++] << 8)  |
		(input[2 + skip++]);

	// Payload
	const data = input.slice(2 + skip);
	return {isFinal, isRSV1, isRSV2, isRSV3, opcode, length, data, mask};
}


/**
 * Mask or unmask the payload of a WebSocket frame.
 *
 * @example wsMask([0x7F, 0x9F, 0x4D, 0x51, 0x58], 0x37FA213D) == [72, 101, 108, 108, 111];
 * @param {Number[]} input - Byte-array
 * @param {Number} key - Masking-key as a 32-bit unsigned integer
 * @return {Number[]}
 */
export function wsMask(input, key){
	const results = [], {length} = input;
	for(let i = 0; i < length; results.push(input[i] ^ key >> 8 * (3 - i++ % 4) & 0xFF));
	return results;
}
