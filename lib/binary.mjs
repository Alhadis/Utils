/**
 * Compute the Adler-32 checksum of a value.
 *
 * @example adler32(utf8Decode("foo-bar")) == 0xAA402A7;
 * @see {@link https://en.wikipedia.org/wiki/Adler-32}
 * @param {Number[]} bytes
 * @return {Number}
 */
export function adler32(bytes){
	let a = 1;
	let b = 0;
	const base = 65521;
	const {length} = bytes;
	for(let i = 0; i < length; ++i){
		a = (a + bytes[i]) % base;
		b = (b + a)        % base;
	}
	return b << 16 | a;
}


/**
 * Convert bytes to 32-bit IEEE 754 floating-point values.
 *
 * @example bytesToFloat32([0x41, 0xC8, 0x00, 0x00]) == [25];
 * @param {Number[]} bytes
 * @param {Boolean} [littleEndian=false]
 * @return {Float32Array}
 */
export function bytesToFloat32(bytes, littleEndian = false){
	const {length} = bytes;
	const floats = new Float32Array(Math.ceil(length / 4));
	for(let i = 0; i < length; i += 4){
		let a = bytes[i]     || 0;
		let b = bytes[i + 1] || 0;
		let c = bytes[i + 2] || 0;
		let d = bytes[i + 3] || 0;
		if(littleEndian) [a, b, c, d] = [d, c, b, a];
		const sign = (-1) ** +!!(a & 128);
		const expo = (a & 127) << 1 | (b & 128) >>> 7;
		let frac = (b & 127) << 16 | c << 8 | d;
		d = ~~(i / 4);
		switch(expo){
			case 0xFF: floats[d] = 0 === frac ? sign * Infinity : NaN; break;
			case 0x00: if((floats[d] = (sign * 0)) === frac) break; // Fall-through
			default:
				if(expo) frac |= 1 << 23;
				let float = 0;
				for(let i = 0; i < 24; float += (frac >> 23 - i & 1) * 2 ** -i++);
				floats[d] = float * 2 ** (expo ? expo - 127 : -126) * sign;
		}
	}
	return floats;
}


/**
 * Convert bytes to 64-bit IEEE 754 floating-point values.
 *
 * @example bytesToFloat64([0x40,0x37,0,0,0,0,0,0]) == [23];
 * @param {Number[]} bytes
 * @param {Boolean} [littleEndian=false]
 * @return {Float64Array}
 */
export function bytesToFloat64(input, littleEndian = false){
	const {length} = input;
	const floats = new Float64Array(Math.ceil(length / 8));
	for(let i = 0; i < length; i += 8){
		let a = input[i]     || 0;
		let b = input[i + 1] || 0;
		let c = input[i + 2] || 0;
		let d = input[i + 3] || 0;
		let e = input[i + 4] || 0;
		let f = input[i + 5] || 0;
		let g = input[i + 6] || 0;
		let h = input[i + 7] || 0;
		if(littleEndian) [a, b, c, d, e, f, g, h] = [h, g, f, e, d, c, b, a];
		const sign = (-1) ** +!!(a & 128);
		const expo = (a & 127) << 4 | (b & 240) >>> 4;
		let frac = BigInt(b & 15) << 48n
			| BigInt(c) << 40n
			| BigInt(d) << 32n
			| BigInt(e) << 24n
			| BigInt(f) << 16n
			| BigInt(g) << 8n
			| BigInt(h);
		h = ~~(i / 8);
		switch(expo){
			case 0x7FF: floats[h] = 0n === frac ? sign * Infinity : NaN; break;
			case 0x000: if((floats[h] = (sign * 0)) === Number(frac)) break; // Fall-through
			default:
				if(expo) frac |= 1n << 52n;
				let float = 0;
				for(let i = 0; i < 53; float += Number(frac >> 52n - BigInt(i) & 1n) * 2 ** -i++);
				floats[h] = float * 2 ** (expo ? expo - 1023 : -126) * sign;
		}
	}
	return floats;
}


/**
 * Convert bytes to 8-bit signed integers.
 *
 * @example bytesToInt8([0x7F, 0x80, 0x81]) == [127, -128, -127];
 * @param {Number[]} bytes
 * @return {Int8Array}
 */
export function bytesToInt8(bytes){
	const {length} = bytes;
	const ints = new Int8Array(length);
	for(let i = 0; i < length; ++i)
		ints[i] = bytes[i] & 128 ? -((~bytes[i] & 127) + 1) : bytes[i];
	return ints;
}


/**
 * Convert bytes to 16-bit signed integers.
 *
 * @example bytesToInt16([0x80, 0x02]) == [-32766];
 * @param {Number[]} bytes
 * @param {Boolean} [littleEndian=false]
 * @return {Int16Array}
 */
export function bytesToInt16(bytes, littleEndian = false){
	const {length} = bytes;
	const ints = new Int16Array(Math.ceil(length / 2));
	for(let i = 0; i < length; i += 2){
		let a = bytes[i];
		let b = bytes[i + 1];
		if(littleEndian) [a, b] = [b, a];
		b = (a << 8 | b) >>> 0;
		ints[~~(i / 2)] = a & 128 ? -((~b & 0x7FFF) + 1) : b;
	}
	return ints;
}


/**
 * Convert bytes to 32-bit signed integers.
 *
 * @example bytesToInt32([0x80, 0x00, 0x00, 0xFF]) == [-2147483393];
 * @param {Number[]} bytes
 * @param {Boolean} [littleEndian=false]
 * @return {Int32Array}
 */
export function bytesToInt32(bytes, littleEndian = false){
	const {length} = bytes;
	const ints = new Int32Array(Math.ceil(length / 4));
	for(let i = 0; i < length; i += 4){
		let a = bytes[i];
		let b = bytes[i + 1];
		let c = bytes[i + 2];
		let d = bytes[i + 3];
		if(littleEndian) [a, b, c, d] = [d, c, b, a];
		b = (a << 24 | b << 16 | c << 8 | d) >>> 0;
		ints[~~(i / 4)] = a & 128 ? -((~b & 0x7FFFFFFF) + 1) : b;
	}
	return ints;
}


/**
 * Convert bytes to 64-bit signed integers.
 *
 * @example bytesToInt64([0x80,0,0,0,0,0,0,0xFF]) == [-9223372036854775553n];
 * @param {Number[]} bytes
 * @param {Boolean} [littleEndian=false]
 * @return {BigInt64Array}
 */
export function bytesToInt64(bytes, littleEndian = false){
	const {length} = bytes;
	const ints = new BigInt64Array(Math.ceil(length / 8));
	for(let i = 0; i < length; i += 8){
		let a = BigInt(bytes[i] || 0);
		let b = BigInt(bytes[i + 1] || 0);
		let c = BigInt(bytes[i + 2] || 0);
		let d = BigInt(bytes[i + 3] || 0);
		let e = BigInt(bytes[i + 4] || 0);
		let f = BigInt(bytes[i + 5] || 0);
		let g = BigInt(bytes[i + 6] || 0);
		let h = BigInt(bytes[i + 7] || 0);
		if(littleEndian) [a, b, c, d, e, f, g, h] = [h, g, f, e, d, c, b, a];
		b = a << 56n | b << 48n | c << 40n | d << 32n | e << 24n | f << 16n | g << 8n | h;
		ints[~~(i / 8)] = a & 128n ? -((~b & (2n ** 63n - 1n)) + 1n) : b;
	}
	return ints;
}


/**
 * Convert bytes to 16-bit unsigned integers.
 *
 * @example bytesToUint16([0xFF, 0xBB]) == [0xFFBB];
 * @param {Number[]} bytes
 * @param {Boolean} [littleEndian=false]
 * @return {Uint16Array}
 */
export function bytesToUint16(bytes, littleEndian = false){
	const {length} = bytes;
	const uints = new Uint16Array(Math.ceil(length / 2));
	for(let i = 0; i < length; i += 2){
		let a = bytes[i];
		let b = bytes[i + 1];
		if(littleEndian) [a, b] = [b, a];
		uints[~~(i / 2)] = (a << 8 | b) >>> 0;
	}
	return uints;
}


/**
 * Convert bytes to 32-bit unsigned integers.
 *
 * @example bytesToUint32([0xAA, 0xBB, 0xCC, 0xDD]) == [0xAABBCCDD];
 * @param {Number[]} bytes
 * @param {Boolean} [littleEndian=false]
 * @return {Uint32Array}
 */
export function bytesToUint32(bytes, littleEndian = false){
	const {length} = bytes;
	const uints = new Uint32Array(Math.ceil(length / 4));
	for(let i = 0; i < length; i += 4){
		let a = bytes[i];
		let b = bytes[i + 1];
		let c = bytes[i + 2];
		let d = bytes[i + 3];
		if(littleEndian) [a, b, c, d] = [d, c, b, a];
		uints[~~(i / 4)] = (a << 24 | b << 16 | c << 8 | d) >>> 0;
	}
	return uints;
}


/**
 * Convert bytes to 64-bit unsigned integers.
 *
 * @example bytesToUint64([17,34,51,68,85,102,119,136]) == [0x1122334455667788n];
 * @param {Number[]} bytes
 * @param {Boolean} [littleEndian=false]
 * @return {BigUint64Array}
 */
export function bytesToUint64(bytes, littleEndian = false){
	const {length} = bytes;
	const uints = new BigUint64Array(Math.ceil(length / 8));
	for(let i = 0; i < length; i += 8){
		let a = BigInt(bytes[i] || 0);
		let b = BigInt(bytes[i + 1] || 0);
		let c = BigInt(bytes[i + 2] || 0);
		let d = BigInt(bytes[i + 3] || 0);
		let e = BigInt(bytes[i + 4] || 0);
		let f = BigInt(bytes[i + 5] || 0);
		let g = BigInt(bytes[i + 6] || 0);
		let h = BigInt(bytes[i + 7] || 0);
		if(littleEndian) [a, b, c, d, e, f, g, h] = [h, g, f, e, d, c, b, a];
		uints[~~(i / 8)] = a << 56n | b << 48n | c << 40n | d << 32n | e << 24n | f << 16n | g << 8n | h;
	}
	return uints;
}


/**
 * Encode data using MIME base64.
 *
 * @example base64Encode([0x63, 0xE1, 0x66, 0xE9]) == "Y+Fm6Q==";
 * @param {Number[]} bytes
 * @return {String}
 */
export function base64Encode(bytes){
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
 * @param {String} data
 * @return {Number[]}
 */
export function base64Decode(data){
	const codex = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	const bytes = [];
	let i = 0;
	
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
	
	return bytes;
}


/**
 * Compute a 32-bit cyclic redundancy check.
 *
 * @example crc32(utf8Decode("Foo123")) == 0x67EDF5DB;
 * @param {Number[]} data
 * @return {Number}
 */
export function crc32(data){
	let crc = ~0;
	const {length} = data;
	for(let i = 0; i < length; ++i)
		for(let byte = data[i] | 0x100; byte !== 1; byte >>>= 1)
			crc = (crc >>> 1) ^ ((crc ^ byte) & 1 ? 0xEDB88320 : 0);
	return ~crc;
}


/**
 * Convert 8-bit signed integers to bytes.
 *
 * @example int8ToBytes([127, -128, -127]) == [0x7F, 0x80, 0x81];
 * @param {Number|Number[]} input
 * @return {Uint8Array}
 */
export function int8ToBytes(input){
	if("number" === typeof input)
		input = [input];
	const {length} = input;
	const bytes = new Uint8Array(length);
	for(let i = 0; i < length; ++i)
		bytes[i] = input[i] < 0 ? ~-(input[i] + 1) & 255 : input[i];
	return bytes;
}


/**
 * Convert 16-bit signed integers to bytes.
 *
 * @example int16ToBytes(-32768) == [0x80, 0x00];
 * @param {Number|Number[]} input
 * @param {Boolean} [littleEndian=false]
 * @return {Uint8Array}
 */
export function int16ToBytes(input, littleEndian = false){
	if("number" === typeof input)
		input = [input];
	const {length} = input;
	const bytes = new Uint8Array(length * 2);
	for(let i = 0; i < length; ++i){
		const int = input[i] < 0 ? ~-(input[i] + 1) & 0xFFFF : input[i];
		for(let j = 0; j < 2; ++j)
			bytes[i * 2 + j] = int >> 8 * (littleEndian ? j : 1 - j) & 0xFF;
	}
	return bytes;
}


/**
 * Convert 32-bit signed integers to bytes.
 *
 * @example int32ToBytes(-2147483648) == [0x80, 0x00, 0x00, 0x00];
 * @param {Number|Number[]} input
 * @param {Boolean} [littleEndian=false]
 * @return {Uint8Array}
 */
export function int32ToBytes(input, littleEndian = false){
	if("number" === typeof input)
		input = [input];
	const {length} = input;
	const bytes = new Uint8Array(length * 4);
	for(let i = 0; i < length; ++i){
		const int = input[i] < 0 ? ~-(input[i] + 1) & 0xFFFFFFFF : input[i];
		for(let j = 0; j < 4; ++j)
			bytes[i * 4 + j] = int >> 8 * (littleEndian ? j : 3 - j) & 0xFF;
	}
	return bytes;
}


/**
 * Convert 64-bit signed integers to bytes.
 *
 * @example int64ToBytes(-9223372036854775808n) == [0x80, 0x00, 0x00…];
 * @param {BigInt|BigInt[]} input
 * @param {Boolean} [littleEndian=false]
 * @return {Uint8Array}
 */
export function int64ToBytes(input, littleEndian = false){
	if("bigint" === typeof input)
		input = [input];
	const {length} = input;
	const bytes = new Uint8Array(length * 8);
	for(let i = 0; i < length; ++i){
		const int = input[i] < 0n ? ~-(input[i] + 1n) & (2n ** 64n - 1n) : input[i];
		for(let j = 0; j < 8; ++j)
			bytes[i * 8 + j] = Number(int >> 8n * BigInt(littleEndian ? j : 7 - j) & 0xFFn);
	}
	return bytes;
}


/**
 * Generate a 4×4-sized PNG image filled with the designated RGBA value.
 *
 * @example base64Encode(rgba(255, 0, 0, 255)) == "iVBORw0KGgoAAAANSU…ErkJggg==";
 * @param {Number} r - Red component (0-255)
 * @param {Number} g - Green component (0-255)
 * @param {Number} b - Blue component (0-255)
 * @param {Number} a - Alpha value (0-255: transparent to opaque)
 * @return {Number[]} Raw PNG data
 * @uses {@link adler32}, {@link crc32}
 */
export function rgba(r, g, b, a){
	const ctoh = x => [...x].map(x => x.charCodeAt(0));
	const hton = i => String.fromCharCode(i >>> 24, i >>> 16 & 255, i >>> 8 & 255, i & 255);
	
	// PNG header
	const IHDR = "\x89PNG\r\n\x1A\n\0\0\0\rIHDR\0\0\0\x04\0\0\0\x04\x08\x06\0\0\0\xA9\xF1\x9E~\0\0\0O";
	
	// IDAT (Image Data) chunk
	const IDAT = "IDAT\x08\x1D\x01D\0\xBB\xFF";
	const data = "\x01" + String.fromCharCode(r, g, b, a) + "\0".repeat(12)
		+ "\x02" + `${"\0".repeat(16)}\x02`.repeat(2)
		+ "\0".repeat(16);
	
	const crc1 = hton(adler32(ctoh(data)));
	const crc2 = hton(crc32(ctoh(IDAT + data + crc1)));

	// Concatenate image-data and close PNG stream with IEND chunk.
	return (IHDR + IDAT + data + crc1 + crc2 + "\0".repeat(4) + "IEND\xAEB`\x82")
		.split("").map(s => s.charCodeAt(0));
}


/**
 * Perform leftward bitwise rotation of a 32-bit value.
 *
 * @example rotl(0b110…1110, 1) == 0b10…11101;
 * @param {Number} value
 * @param {Number} count
 * @return {Number}
 */
export function rotl(value, count){
	return (value << count | value >>> 32 - count) >>> 0;
}


/**
 * Perform rightward bitwise rotation of a 32-bit value.
 *
 * @example rotr(0b110…0110, 1) == 0b011…0011;
 * @param {Number} value
 * @param {Number} count
 * @return {Number}
 */
export function rotr(value, count){
	return (value >>> count | value << 32 - count) >>> 0;
}


/**
 * Compute the SHA-1 checksum of a byte-array.
 *
 * @example sha1([120, 121, 122]) == "66b27417d37e024c46526c2f6d358a754fc552f3";
 * @param {Number[]} input
 * @return {String} A 160-bit message digest
 * @uses {@link bytesToUint32}, {@link rotl}
 */
export function sha1(input){
	const ml = input.length * 8;
	input = [...bytesToUint32(input)];
	let [h0, h1, h2, h3, h4] = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
	
	// Preprocessing
	input[ml >>> 5] |= 128 << (24 - ml % 32);
	input[15 + ((64 + ml >>> 9) << 4)] = ml;
	
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
	).toString(16).padStart(40, "0");
}


/**
 * Convert 16-bit unsigned integers to bytes.
 *
 * @example uint16ToBytes(0xAABB) == [0xAA, 0xBB];
 * @param {Number|Number[]} input
 * @param {Boolean} [littleEndian=false]
 * @return {Uint8Array}
 */
export function uint16ToBytes(input, littleEndian = false){
	if("number" === typeof input)
		input = [input];
	const {length} = input;
	const bytes = new Uint8Array(length * 2);
	for(let i = 0; i < length; ++i)
	for(let j = 0; j < 2; ++j)
		bytes[i * 2 + j] = input[i] >> 8 * (littleEndian ? j : 1 - j) & 0xFF;
	return bytes;
}


/**
 * Convert 32-bit unsigned integers to bytes.
 *
 * @example uint32ToBytes(0xAABBCCDD) == [0xAA, 0xBB, 0xCC, 0xDD];
 * @param {Number|Number[]} input
 * @param {Boolean} [littleEndian=false]
 * @return {Uint8Array}
 */
export function uint32ToBytes(input, littleEndian = false){
	if("number" === typeof input)
		input = [input];
	const {length} = input;
	const bytes = new Uint8Array(length * 4);
	for(let i = 0; i < length; ++i)
	for(let j = 0; j < 4; ++j)
		bytes[i * 4 + j] = input[i] >> 8 * (littleEndian ? j : 3 - j) & 0xFF;
	return bytes;
}


/**
 * Convert 64-bit unsigned integers to bytes.
 *
 * @example uint64ToBytes(0x1122334455667788n) == [0x11, 0x22, 0x33…];
 * @param {BigInt|BigInt[]} input
 * @param {Boolean} [littleEndian=false]
 * @return {Uint8Array}
 */
export function uint64ToBytes(input, littleEndian = false){
	if("bigint" === typeof input)
		input = [input];
	const {length} = input;
	const bytes = new Uint8Array(length * 8);
	for(let i = 0; i < length; ++i)
	for(let j = 0; j < 8; ++j)
		bytes[i * 8 + j] = Number(input[i] >> 8n * BigInt(littleEndian ? j : 7 - j) & 0xFFn);
	return bytes;
}


/**
 * Encode a byte-stream as UTF-8.
 *
 * @param  {Number[]} bytes
 * @param  {Object}  [opts={}]
 * @param  {Boolean} [opts.allowOverlong=false]
 * @param  {Boolean} [opts.allowSurrogates=false]
 * @param  {Boolean} [opts.codePoints=false]
 * @param  {Boolean} [opts.strict=false]
 * @param  {Boolean} [opts.stripBOM=false]
 * @return {String|Number[]}
 */
export function utf8Encode(bytes, opts = {}){
	const results = [];
	const {length} = bytes;
	for(let bad, b1, b2, b3, b4, code, size, i = 0; i < length; ++i){
		bad  = 0;
		b1   = bytes[i];
		code = 0xFFFD;
		size = 1;
		
		// 1 byte
		if(b1 >= 0 && b1 < 128)
			code = b1;
		
		// 2 bytes
		else if(b1 > 191 && b1 < 224){
			b2 = bytes[i + ++bad];
			if(128 === (b2 & 192)){
				code = (b1 & 31) << 6 | b2 & 63;
				size = 2;
				--bad;
			}
		}
		
		// 3 bytes
		else if(b1 > 223 && b1 < 240){
			b2 = bytes[i + 1];
			b3 = bytes[i + 2];
			if(128 === (b2 & 192) && 128 === (b3 & 192)){
				code = (b1 & 15) << 12 | (b2 & 63) << 6 | b3 & 63;
				size = 3;
				if(!i && 0xFEFF === code && opts.stripBOM){
					i = 2; continue; // Ignore byte-order mark
				}
			}
			else ++bad, 128 === (b2 & 192) && ++i;
		}
		
		// 4 bytes
		else if(b1 > 239 && b1 < 248){
			b2 = bytes[i + 1];
			b3 = bytes[i + 2];
			b4 = bytes[i + 3];
			if(128 === (b2 & 192) && 128 === (b3 & 192) && 128 === (b4 & 192)){
				code = (b1 & 7) << 18 | (b2 & 63) << 12 | (b3 & 63) << 6 | b4 & 63;
				size = 4;
			}
			else ++bad, i += 128 === (b3 & 192) ? 2 : +!!(128 === (b2 & 192));
		}
		
		// Nothing we recognised or expected
		else ++bad;
		
		// Clamp codepoints to the maximum range permitted by RFC 3629
		if(code > 0x10FFFF){
			opts.strict && String.fromCodePoint(code);
			code = 0xFFFD;
			size = 1;
		}
		
		// Reject surrogate halves, and restrict codepoints to their minimum byte-lengths
		if(!opts.allowSurrogates && code >= 0xD800 && code <= 0xDFFF && (size = 3)
		|| !opts.allowOverlong && size > 1 && !(
			code >= [,, 0x080, 0x0800, 0x010000][size] &&
			code <= [,, 0x7FF, 0xFFFF, 0x10FFFF][size]
		)) ++bad, results.push(...new Array(size).fill(0xFFFD));
		
		else results.push(code);
		if(bad && opts.strict)
			throw new RangeError(`Invalid UTF-8 at offset ${i}`);
		i += size - 1;
	}
	return opts.codePoints ? results : String.fromCodePoint(...results);
}


/**
 * Break a UTF-8 encoded string into bytes.
 *
 * @example utf8Decode("€") == [0xE2, 0x82, 0xAC];
 * @param {String|Number[]} input
 * @return {Number[]} Byte-stream
 */
export function utf8Decode(input){
	input = [...input];
	const results = [];
	const {length} = input;
	for(let code, i = 0; i < length; ++i){
		code = input[i];
		code = "string" === typeof code
			? code.codePointAt(0)
			: ~~Number(code);
		
		if(code >= 0 && code < 128)
			results.push(code);
		
		else if(code > 127 && code < 2048)
			results.push(
				(192 | (code & 1984) >> 6),
				(128 | (code & 63))
			);
		
		else if(code > 2047 && code < 65536)
			results.push(
				(224 | (code & 61440) >> 12),
				(128 | (code & 4032)  >> 6),
				(128 | (code & 63))
			);
		
		else if(code > 65535 && code < 0x110000)
			results.push(
				(240 | (code & 1835008) >> 18),
				(128 | (code & 258048)  >> 12),
				(128 | (code & 4032)    >> 6),
				(128 | (code & 63))
			);
		
		else throw new RangeError(`Invalid codepoint: ${code}`);
	}
	return results;
}


/**
 * Encode a byte-stream as UTF-16.
 *
 * @param {Number[]} bytes
 * @param {Object}  [opts={}]
 * @param {Boolean} [opts.allowUnpaired=false]
 * @param {Boolean} [opts.codePoints=false]
 * @param {String}  [opts.endianness="auto"]
 * @return {String|Number[]}
 */
export function utf16Encode(bytes, opts = {}){
	const {endianness, allowUnpaired} = opts;
	const {length} = bytes;
	const results = [];
	const haveBOM =
		0xFE === bytes[0] && 0xFF === bytes[1] ||
		0xFF === bytes[0] && 0xFE === bytes[1];
	let isLE, surrogate = 0;
	switch(endianness){
		case "little": isLE = true;  break;
		case "big":    isLE = false; break;
		default:       isLE = haveBOM && 0xFE === bytes[1];
	}
	for(let b1, b2, code, i = haveBOM ? 2 : 0; i < length;){
		b1   = bytes[i++] & 255;
		b2   = bytes[i++] & 255;
		code = isLE ? b2 << 8 | b1 : b1 << 8 | b2;
		
		// Incomplete code-unit
		if(i > length){
			surrogate = allowUnpaired && surrogate
				? (results.push(surrogate, 0xFFFD), 0)
				: 0xFFFD;
			break;
		}
		
		// High surrogate
		if(code > 0xD7FF && code < 0xDC00){
			surrogate && results.push(allowUnpaired ? surrogate : 0xFFFD);
			surrogate = code;
		}
		
		// Low surrogate
		else if(code > 0xDBFF && code < 0xE000){
			results.push(surrogate
				? 0x10000 + ((surrogate & 0x3FF) << 10 | code & 0x3FF)
				: allowUnpaired ? code : 0xFFFD);
			surrogate = 0;
		}
		
		// Non-surrogate BMP character
		else{
			surrogate && results.push(allowUnpaired ? surrogate : 0xFFFD);
			surrogate = 0;
			results.push(code);
		}
	}
	surrogate && results.push(allowUnpaired ? surrogate : 0xFFFD);
	return opts.codePoints ? results : String.fromCodePoint(...results);
}


/**
 * Break a UTF-16 encoded string into bytes.
 *
 * @param {String|Number[]} input
 * @param {Boolean} [littleEndian=false]
 * @param {Boolean} [addBOM=false]
 * @return {Number[]}
 */
export function utf16Decode(input, littleEndian = false, addBOM = false){
	input = [...input];
	addBOM && input.unshift(0xFEFF);
	const results = [];
	const {length} = input;
	for(let b1, b2, code, i = 0; i < length; ++i){
		code = input[i];
		code = "string" === typeof code
			? code.codePointAt(0)
			: ~~Number(code);
		
		if(code >= 0 && code < 0x10000){
			b1 = (code >> 8) & 0xFF;
			b2 = code & 0xFF;
			if(littleEndian)
				[b1, b2] = [b2, b1];
			results.push(b1, b2);
		}
		
		else if(code > 0xFFFF && code < 0x110000){
			code -= 0x10000;
			b1 = 0xD800 + (code >> 10);
			b2 = 0xDC00 + (code & 0x3FF);
			b1 = [b1 >> 8, b1 & 255];
			b2 = [b2 >> 8, b2 & 255];
			if(littleEndian)
				b1.reverse(), b2.reverse();
			results.push(...b1, ...b2);
		}
		
		else throw new RangeError(`Invalid codepoint: ${code}`);
	}
	return results;
}


/**
 * Encode a byte-stream as UTF-32.
 *
 * @example utf32Encode([0x00, 0x00, 0x20, 0xAC]) === "€";
 * @param {Number[]} bytes
 * @param {Object}  [opts={}]
 * @param {Boolean} [opts.codePoints=false]
 * @param {String}  [opts.endianness="auto"]
 * @return {String|Number[]}
 */
export function utf32Encode(bytes, opts = {}){
	const results = [];
	const {length} = bytes;
	const haveBOM =
		0x00 === bytes[0] && 0x00 === bytes[1] && 0xFE === bytes[2] && 0xFF === bytes[3] ||
		0xFF === bytes[0] && 0xFE === bytes[1] && 0x00 === bytes[2] && 0x00 === bytes[3];
	let isLE;
	switch(opts.endianness){
		case "little": isLE = true;  break;
		case "big":    isLE = false; break;
		default:       isLE = haveBOM && !bytes[3];
	}
	for(let b1, b2, b3, b4, i = haveBOM ? 4 : 0; i < length;){
		b1 = bytes[i++] & 255;
		b2 = bytes[i++] & 255;
		b3 = bytes[i++] & 255;
		b4 = bytes[i++] & 255;
		if(i > length)
			results.push(0xFFFD);
		else{
			if(isLE) [b1, b2, b3, b4] = [b4, b3, b2, b1];
			results.push(b1 << 24 | b2 << 16 | b3 << 8 | b4);
		}
	}
	return opts.codePoints ? results : String.fromCodePoint(...results);
}


/**
 * Break a UTF-32 encoded string into bytes.
 *
 * @example utf32Decode("€") == [0x00, 0x00, 0x20, 0xAC];
 * @param {String|Number[]} input
 * @param {Boolean} [littleEndian=false]
 * @param {Boolean} [addBOM=false]
 * @return {Number[]}
 */
export function utf32Decode(input, littleEndian = false, addBOM = false){
	input = [...input];
	addBOM && input.unshift(0xFEFF);
	const results = [];
	const {length} = input;
	for(let code, i = 0; i < length; ++i){
		code = input[i];
		code = "string" === typeof code
			? code.codePointAt(0)
			: ~~Number(code);
		if(code >= 0 && code < 0x110000){
			code = [(code >> 24) & 255, (code >> 16) & 255, (code >> 8) & 255, code & 255];
			littleEndian && code.reverse();
			results.push(...code);
		}
		else throw new RangeError(`Invalid codepoint: ${code}`);
	}
	return results;
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
 * Decode a WebSocket frame.
 *
 * @example
 * // Read a single-frame, unmasked text message containing "Hello"
 * wsDecodeFrame([0x81, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F]) == {
 *    payload: [72, 101, 108, 108, 111],
 *    isFinal: true,
 *    isRSV1:  false,
 *    isRSV2:  false,
 *    isRSV3:  false,
 *    length:  5n,
 *    mask:    null,
 *    opcode:  0x01,
 *    opname:  "text",
 * };
 * @param {Number[]} input - Byte-array
 * @param {Boolean} [noMask=false] - Don't apply masking-key to payload
 * @return {WSFrame}
 * @uses {@link bytesToUint32}, {@link bytesToUint64}
 */
export function wsDecodeFrame(input, noMask = false){
	
	// Resolve opcode
	const opcode = input[0] & 0x0F;
	const opname = {
		0:  "continue",
		1:  "text",
		2:  "binary",
		8:  "close",
		9:  "ping",
		10: "pong",
	}[opcode] || "reserved";

	// Resolve payload length
	let skip = 2, length = BigInt(input[1]) & 0x7Fn;
	if(126n === length)
		skip = 4, length = BigInt(input[2] << 8 | input[3]);
	else if(127n === length)
		skip = 10, [length] = bytesToUint64(input.slice(2, 9));

	// Resolve payload and masking-key
	let mask = null, payload, trailer;
	if(input[1] & 0x80){
		mask    = input.slice(skip, skip += 4);
		payload = input.slice(skip, skip += Number(length));
		trailer = input.slice(skip);
		payload = noMask ? payload : payload.map((byte, index) => byte ^ mask[index % 4]);
		mask    = bytesToUint32(mask)[0];
	}
	else{
		payload = input.slice(skip, skip += Number(length));
		trailer = input.slice(skip);
	}

	return {
		isFinal: !!(input[0] & 0x80),
		isRSV1:  !!(input[0] & 0x40),
		isRSV2:  !!(input[0] & 0x20),
		isRSV3:  !!(input[0] & 0x10),
		length, mask, opcode, opname, payload, trailer,
	};
}


/**
 * Encode a WebSocket frame.
 *
 * @example wsEncodeFrame({payload: [72, 105], opcode: 2}) == [2, 2, 72, 105];
 * @param  {WSFrame} input
 * @param  {Boolean} [noMask=false] - Don't apply masking-key to payload
 * @return {Uint8Array} Byte-array
 * @throws {RangeError} Payload must be smaller than 0xFFFFFFFFFFFFFFFF bytes
 * @uses {@link uint32ToBytes}, {@link uint64ToBytes}
 */
export function wsEncodeFrame(input, noMask = false){
	const frame = [input.opcode & 15, 127];
	if(input.isFinal) frame[0] |= 128;
	if(input.isRSV1)  frame[0] |= 64;
	if(input.isRSV2)  frame[0] |= 32;
	if(input.isRSV3)  frame[0] |= 16;
	let {payload = []} = input;
	
	// Resolve payload length
	let length = BigInt(Math.max(payload.length, 0));
	if(length > 0xFFFFFFFFFFFFFFFFn)
		throw new RangeError("Payload too large");
	if(length < 126n)
		frame[1] = Number(length);
	else if(length < 65536n){
		frame[1] = 126;
		length   = Number(length);
		frame.push(length >> 8 & 0xFF, length & 0xFF);
	}
	else frame.push(...uint64ToBytes(length));
	
	// Resolve masking-key
	if(null != input.mask){
		frame[1] |= 128;
		const mask = uint32ToBytes(input.mask);
		frame.push(...mask);
		if(!noMask)
			payload = payload.map((byte, index) => byte ^ mask[index % 4]);
	}
	frame.push(...payload);
	return new Uint8Array(frame);
}

/**
 * Deserialised WebSocket frame returned by {@link wsDecodeFrame}.
 * @typedef  {Object}   WSFrame
 * @property {Boolean}  isFinal - Whether the frame is the last fragment in a message
 * @property {Boolean}  isRSV1  - Unused; reserved for extensions
 * @property {Boolean}  isRSV2  - Unused; reserved for extensions
 * @property {Boolean}  isRSV3  - Unused; reserved for extensions
 * @property {BigInt}   length  - Reported payload length
 * @property {?Number}  mask    - Masking-key, expressed as a 32-bit integer
 * @property {Number}   opcode  - Opcode value
 * @property {String}   opname  - Opcode's human-readable name
 * @property {Number[]} payload - Payload data, expressed in bytes
 * @property {Number[]} trailer - Excess bytes found after payload
 */
