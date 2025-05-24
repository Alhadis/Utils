import assert          from "assert";
import {readFileSync}  from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import * as utils      from "../index.mjs";

describe("Byte-level functions", () => {
	const dir  = dirname(fileURLToPath(import.meta.url));
	const file = path => Uint8Array.from([...readFileSync(join(dir, "fixtures", ...path.split("/")), {encoding: null})]);
	
	describe("adler32()", () => {
		const {adler32} = utils;
		it("computes checksums of byte arrays", () => {
			const A = [0x66, 0x6F, 0x6F, 0x2D, 0x62, 0x61, 0x72];
			const B = [0x57, 0x69, 0x6B, 0x69, 0x70, 0x65, 0x64, 0x69, 0x61];
			expect(adler32(A)).to.equal(0xAA402A7);
			expect(adler32(B)).to.equal(0x11E60398);
		});
		it("computes checksums of typed arrays", () => {
			const A = Uint8Array.from([0x66, 0x6F, 0x6F, 0x2D, 0x62, 0x61, 0x72]);
			const B = Uint8Array.from([0x57, 0x69, 0x6B, 0x69, 0x70, 0x65, 0x64, 0x69, 0x61]);
			expect(adler32(A)).to.equal(0xAA402A7);
			expect(adler32(B)).to.equal(0x11E60398);
		});
		it("computes checksums of buffers", () => {
			const A = Buffer.from([0x08, 0xC6, 0x9C, 0x1C, 0xF0, 0xEF, 0xE1, 0xD7, 0xE1, 0x0B, 0xF2, 0xF6, 0xC5, 0x7F, 0xD0]);
			const B = Buffer.from([0x90, 0x9F, 0x38, 0x8C, 0xCC, 0x69, 0x48, 0x61, 0x47, 0xB3, 0xD0, 0xF2, 0x22, 0x3A, 0x00]);
			expect(adler32(A)).to.equal(0x49F60A06);
			expect(adler32(B)).to.equal(0x3BDC06EA);
			expect(adler32(Buffer.concat([A, B]))).to.equal(0x1C2C10EF);
		});
	});
	
	describe("ascii85Decode()", () => {
		const {ascii85Decode} = utils;
		const decode = (input, expected) =>
			expect(ascii85Decode(input)).to.eql(new Uint8Array(expected));

		it("decodes 1 byte",       () => decode("5l", [0x41]));
		it("decodes 2 bytes",      () => decode("6!=", [0x41, 0x5A]));
		it("decodes 3 bytes",      () => decode("7W32", [0x46, 0x6F, 0x6F]));
		it("decodes 4 bytes",      () => decode("7W32t", [0x46, 0x6F, 0x6F, 0x2E]));
		it("decodes 8 bytes",      () => decode("9jqo^F*2M7", [0x4D, 0x61, 0x6E, 0x20, 0x73, 0x75, 0x72, 0x65]));
		it("decodes all 32-bits",  () => decode("J=:u^", [0x80, 0x9A, 0x7F, 0xF7]));
		it("ignores whitespace",   () => decode("7\rW\n3 \t2\ft", [0x46, 0x6F, 0x6F, 0x2E]));
		it("skips a leading `<~`", () => decode("<~5l", [0x41]));
		it("stops parsing at `~`", () => decode("7W32~t", [0x46, 0x6F, 0x6F]));
		it("expands `z` into null-bytes", () => {
			decode("z",    new Array(4).fill(0));
			decode("zz",   new Array(8).fill(0));
			decode("zzz",  new Array(12).fill(0));
			decode("z6!=", [0, 0, 0, 0, 0x41, 0x5A]);
			const json = JSON.parse(String.fromCharCode(...file("ascii85.json")));
			for(const entry of Object.entries(json))
				decode(...entry);
		});
		it("throws an exception for illegal characters", () => {
			expect(() => ascii85Decode("v"))  .to.throw(SyntaxError, 'Unexpected character "v"');
			expect(() => ascii85Decode("ax")) .to.throw(SyntaxError, 'Unexpected character "x"');
			expect(() => ascii85Decode("aby")).to.throw(SyntaxError, 'Unexpected character "y"');
		});
		it("throws an exception for misplaced `z` symbols", () => {
			const err = [SyntaxError, "Unexpected `z` shorthand"];
			expect(() => ascii85Decode("5z"))  .to.throw(...err);
			expect(() => ascii85Decode("5lz")) .to.throw(...err);
			expect(() => ascii85Decode("6!=z")).to.throw(...err);
		});
	});
	
	describe("ascii85Encode()", () => {
		const {ascii85Encode} = utils;
		const encode = (input, expected) => {
			expect(ascii85Encode([...input])).to.equal(expected);
			expect(ascii85Encode(new Uint8Array(input))).to.equal(expected);
			expect(ascii85Encode(new Uint8ClampedArray(input))).to.equal(expected);
			expect(ascii85Encode(Buffer.from(input))).to.equal(expected);
		};
		it("encodes 1 byte",  () => encode([0x41], "5l"));
		it("encodes 2 bytes", () => encode([0x41, 0x5A], "6!="));
		it("encodes 3 bytes", () => encode([0x46, 0x6F, 0x6F], "7W32"));
		it("encodes 4 bytes", () => encode([0x46, 0x6F, 0x6F, 0x2E], "7W32t"));
		it("encodes 8 bytes", () => encode([0x4D, 0x61, 0x6E, 0x20, 0x73, 0x75, 0x72, 0x65], "9jqo^F*2M7"));
		it("encodes 4 null-bytes as `z`", () => encode([0, 0, 0, 0], "z"));
		it("unsets the sign-bit when encoding", () => encode([0x80, 0x9A, 0x7F, 0xF7], "J=:u^"));
		it("correctly truncates null-bytes", () => {
			const json = JSON.parse(String.fromCharCode(...file("ascii85.json")));
			for(const entry of Object.entries(json))
				encode(...entry.reverse());
		});
	});
	
	describe("base64Decode()", () => {
		const {base64Decode} = utils;
		const decode = (input, expected) =>
			expect(base64Decode(input)).to.eql(new Uint8Array(expected));

		it("decodes ASCII",   () => decode("Rm9vQmFy", [0x46, 0x6F, 0x6F, 0x42, 0x61, 0x72]));
		it("decodes Latin-1", () => decode("Y+Fm6WLhYuk=", [0x63, 0xE1, 0x66, 0xE9, 0x62, 0xE1, 0x62, 0xE9]));
		it("decodes binary",  () => decode("iQEAj//+AA==", [0x89, 0x01, 0x00, 0x8F, 0xFF, 0xFE, 0x00]));
		it("decodes UTF-8",   () => decode("8J+Ygg==", [0xF0, 0x9F, 0x98, 0x82]));
	});
	
	describe("base64Encode()", () => {
		const {base64Encode} = utils;
		const encode = (input, expected) => {
			expect(base64Encode([...input])).to.equal(expected);
			expect(base64Encode(new Uint8Array(input))).to.equal(expected);
			expect(base64Encode(new Uint8ClampedArray(input))).to.equal(expected);
			expect(base64Encode(Buffer.from(input))).to.equal(expected);
		};
		it("encodes ASCII",   () => encode([0x46, 0x6F, 0x6F, 0x42, 0x61, 0x72], "Rm9vQmFy"));
		it("encodes Latin-1", () => encode([0x63, 0xE1, 0x66, 0xE9, 0x62, 0xE1, 0x62, 0xE9], "Y+Fm6WLhYuk="));
		it("encodes binary",  () => encode([0x89, 0x01, 0x00, 0x8F, 0xFF, 0xFE, 0x00], "iQEAj//+AA=="));
		it("encodes PNGs",    () => {
			const json = JSON.parse(String.fromCharCode(...file("base64/rgba.json")));
			for(const [png, encoded] of Object.entries(json))
				encode(file(png), encoded);
		});
	});
	
	describe("bytesToFloat32()", () => {
		const {bytesToFloat32} = utils;
		const encode = (input, expected, thresh = 0) => {
			if(thresh){
				expect(bytesToFloat32(input)[0]).to.be.closeTo(expected[0], thresh);
				expect(bytesToFloat32(input.reverse(), true)[0]).to.be.closeTo(expected[0], thresh);
			}
			else{
				expected = Float32Array.from(expected);
				expect(bytesToFloat32(input, false)).to.eql(expected);
				expect(bytesToFloat32(input.reverse(), true)).to.eql(expected);
			}
		};
		it("encodes normal numbers",  () => {
			encode([0x3F, 0x80, 0x00, 0x00], [1]);
			encode([0x41, 0xC8, 0x00, 0x00], [25]);
			encode([0xC0, 0x00, 0x00, 0x00], [-2]);
			encode([0x3F, 0x80, 0x00, 0x01], [1.0000001192], 1e-11);
			encode([0x3F, 0x7F, 0xFF, 0xFF], [0.9999999404], 1e-11);
		});
		it("encodes subnormal numbers", () => {
			encode([0x00, 0x00, 0x00, 0x01], [1.4012984643 * (10 ** -45)], 1e-11);
			encode([0x00, 0x7F, 0xFF, 0xFF], [1.1754942107 * (10 ** -38)], 1e-11);
		});
		it("encodes NaN", () => {
			encode([0xFF, 0xC0, 0x00, 0x01], [NaN]);
			encode([0xFF, 0x80, 0x00, 0x01], [NaN]);
		});
		it("encodes positive infinity",  () => encode([0x7F, 0x80, 0x00, 0x00], [Infinity]));
		it("encodes negative infinity",  () => encode([0xFF, 0x80, 0x00, 0x00], [-Infinity]));
		it("encodes positive zero",      () => encode([0x00, 0x00, 0x00, 0x00], [0]));
		it("encodes negative zero",      () => encode([0x80, 0x00, 0x00, 0x00], [-0]));
		it("encodes recurring decimals", () => encode([0x3E, 0xAA, 0xAA, 0xAB], [0.333333343267], 1e-11));
		it("roughly approximates π",     () => encode([0x40, 0x49, 0x0F, 0xDB], [3.14159274101], 1e-11));
		it("zero-fills missing bytes",   () => {
			const expected = new Float32Array([-2]);
			expect(bytesToFloat32([0xC0])).to.eql(expected);
			expect(bytesToFloat32([0xC0, 0x00])).to.eql(expected);
			expect(bytesToFloat32([0xC0, 0x00, 0x00])).to.eql(expected);
			expect(bytesToFloat32([0xC0, 0x00, 0x00, 0x00, 0xC0])).to.eql(new Float32Array([-2, -2]));
		});
	});
	
	describe("bytesToFloat64()", () => {
		const {bytesToFloat64} = utils;
		const encode = (input, expected, thresh = 0) => {
			if(thresh){
				expect(bytesToFloat64(input)[0]).to.be.closeTo(expected[0], thresh);
				expect(bytesToFloat64(input.reverse(), true)[0]).to.be.closeTo(expected[0], thresh);
			}
			else{
				expected = Float64Array.from(expected);
				expect(bytesToFloat64(input)).to.eql(expected);
				expect(bytesToFloat64(input.reverse(), true)).to.eql(expected);
			}
		};
		it("encodes normal numbers", () => {
			encode([0x3F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [1]);
			encode([0x40, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [2]);
			encode([0x40, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [3]);
			encode([0x40, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [4]);
			encode([0x40, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [5]);
			encode([0x40, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [6]);
			encode([0x40, 0x37, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [23]);
			encode([0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [-2]);
			encode([0x3F, 0x88, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [0.01171875]);
			encode([0x3F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], [1.0000000000000002]);
			encode([0x3F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02], [1.0000000000000004]);
			encode([0x7F, 0xEF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [1.7976931348623157 * (10 ** 308)]);
			encode([0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [2.2250738585072014 * (10 ** -308)], Number.EPSILON);
		});
		it("encodes subnormal numbers", () => {
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], [2 ** -1074], Number.EPSILON);
			encode([0x00, 0x0F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [2.2250738585072009 * (10 ** -308)], Number.EPSILON);
		});
		it("encodes NaN", () => {
			encode([0x7F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], [NaN]);
			encode([0x7F, 0xF8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], [NaN]);
			encode([0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [NaN]);
		});
		it("encodes positive infinity",  () => encode([0x7F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [Infinity]));
		it("encodes negative infinity",  () => encode([0xFF, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [-Infinity]));
		it("encodes positive zero",      () => encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [+0]));
		it("encodes negative zero",      () => encode([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [-0]));
		it("encodes recurring decimals", () => encode([0x3F, 0xD5, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55], [1 / 3]));
		it("roughly approximates π",     () => encode([0x40, 0x09, 0x21, 0xFB, 0x54, 0x44, 0x2D, 0x18], [Math.PI]));
		it("zero-fills missing bytes", () => {
			const input = [0xC0];
			for(let i = 0; i < 7; ++i){
				expect(bytesToFloat64(input)).to.eql(Float64Array.from([-2]));
				input.push(0x00);
			}
			input.push(0xC0);
			expect(bytesToFloat64(input)).to.eql(Float64Array.from([-2, -2]));
		});
	});
	
	describe("bytesToInt8()", () => {
		const {bytesToInt8} = utils;
		it("encodes positive integers up to +127", () => {
			for(let i = 0; i < 128; ++i)
				expect(bytesToInt8([i])).to.eql(new Int8Array([i]));
			for(let i = 0; i < 125; i += 3){
				const ints = new Int8Array([i, i + 1, i + 2, i + 3]);
				expect(bytesToInt8(ints)).to.eql(ints).and.not.equal(ints);
			}
		});
		it("encodes negative integers up to -128", () => {
			expect(bytesToInt8([0x80])).to.eql(new Int8Array([-128]));
			expect(bytesToInt8([0x81])).to.eql(new Int8Array([-127]));
			expect(bytesToInt8([0xFE])).to.eql(new Int8Array([-2]));
			expect(bytesToInt8([0xFF])).to.eql(new Int8Array([-1]));
			for(let i = 0; i < 128; ++i)
				expect(bytesToInt8([i + 0x80])).to.eql(new Int8Array([-128 + i]));
		});
	});
	
	describe("bytesToInt16()", function(){
		const {bytesToInt16} = utils;
		this.slow(1000);
		const repeat = (list, times = 2) => {
			const result = [];
			for(let i = 0; i < times; ++i)
				result.push(...list);
			return result;
		};
		const encode = (input, expected, le = false) => {
			for(let i = 1; i < 6; ++i){
				const bytes = repeat(input, i);
				const ints = Int16Array.from(repeat(expected, i));
				assert.deepStrictEqual(bytesToInt16(bytes, le), ints);
				assert.deepStrictEqual(bytesToInt16(Uint8Array.from(bytes), le), ints);
			}
		};
		it("encodes positive big-endian integers", () => {
			for(let i = 0; i <= 0xFF; encode([0x00, i], [i++]));
			encode([0x03, 0x4F], [847]);
			encode([0x03, 0x50], [848]);
			encode([0x03, 0x51], [849]);
			encode([0x03, 0x52], [850]);
			encode([0x7F, 0xFC], [32764]);
			encode([0x7F, 0xFD], [32765]);
			encode([0x7F, 0xFE], [32766]);
			encode([0x7F, 0xFF], [32767]);
		});
		it("encodes negative big-endian integers", () => {
			encode([0xFF, 0xFF], [-1]);
			encode([0xFF, 0xFE], [-2]);
			encode([0xFF, 0xFD], [-3]);
			encode([0xFF, 0xFC], [-4]);
			encode([0xFF, 0xFB], [-5]);
			encode([0xFF, 0x02], [-254]);
			encode([0xFF, 0x01], [-255]);
			encode([0xFF, 0x00], [-256]);
			encode([0xFE, 0xFF], [-257]);
			encode([0xFE, 0xFE], [-258]);
			encode([0xFE, 0xFD], [-259]);
			encode([0x80, 0x03], [-32765]);
			encode([0x80, 0x02], [-32766]);
			encode([0x80, 0x01], [-32767]);
			encode([0x80, 0x00], [-32768]);
		});
		it("encodes positive little-endian integers", () => {
			for(let i = 0; i <= 0xFF; encode([i, 0x00], [i++], true));
			encode([0x4F, 0x03], [847], true);
			encode([0x50, 0x03], [848], true);
			encode([0x51, 0x03], [849], true);
			encode([0x52, 0x03], [850], true);
			encode([0xFC, 0x7F], [32764], true);
			encode([0xFD, 0x7F], [32765], true);
			encode([0xFE, 0x7F], [32766], true);
			encode([0xFF, 0x7F], [32767], true);
		});
		it("encodes negative little-endian integers", () => {
			encode([0xFF, 0xFF], [-1], true);
			encode([0xFE, 0xFF], [-2], true);
			encode([0xFD, 0xFF], [-3], true);
			encode([0xFC, 0xFF], [-4], true);
			encode([0xFB, 0xFF], [-5], true);
			encode([0x02, 0xFF], [-254], true);
			encode([0x01, 0xFF], [-255], true);
			encode([0x00, 0xFF], [-256], true);
			encode([0xFF, 0xFE], [-257], true);
			encode([0xFE, 0xFE], [-258], true);
			encode([0xFD, 0xFE], [-259], true);
			encode([0x03, 0x80], [-32765], true);
			encode([0x02, 0x80], [-32766], true);
			encode([0x01, 0x80], [-32767], true);
			encode([0x00, 0x80], [-32768], true);
		});
	});
	
	describe("bytesToInt32()", function(){
		const {bytesToInt32} = utils;
		this.slow(1000);
		const repeat = (list, times = 2) => {
			const result = [];
			for(let i = 0; i < times; ++i)
				result.push(...list);
			return result;
		};
		const encode = (input, expected, le = false) => {
			for(let i = 1; i < 6; ++i){
				const bytes = repeat(input, i);
				const ints = Int32Array.from(repeat(expected, i));
				assert.deepStrictEqual(bytesToInt32(bytes, le), ints);
				assert.deepStrictEqual(bytesToInt32(Uint8Array.from(bytes), le), ints);
			}
		};
		it("encodes positive big-endian integers", () => {
			for(let i = 0; i <= 0xFF; encode([0, 0, 0, i], [i++]));
			encode([0x00, 0x00, 0x03, 0x4F], [847]);
			encode([0x00, 0x00, 0x03, 0x50], [848]);
			encode([0x00, 0x00, 0x03, 0x51], [849]);
			encode([0x00, 0x00, 0x03, 0x52], [850]);
			encode([0x7F, 0xFF, 0xFF, 0xFC], [2147483644]);
			encode([0x7F, 0xFF, 0xFF, 0xFD], [2147483645]);
			encode([0x7F, 0xFF, 0xFF, 0xFE], [2147483646]);
			encode([0x7F, 0xFF, 0xFF, 0xFF], [2147483647]);
		});
		it("encodes negative big-endian integers", () => {
			encode([0xFF, 0xFF, 0xFF, 0xFF], [-1]);
			encode([0xFF, 0xFF, 0xFF, 0xFE], [-2]);
			encode([0xFF, 0xFF, 0xFF, 0xFD], [-3]);
			encode([0xFF, 0xFF, 0xFF, 0xFC], [-4]);
			encode([0xFF, 0xFF, 0xFF, 0xFB], [-5]);
			encode([0xFF, 0xFF, 0xFF, 0x02], [-254]);
			encode([0xFF, 0xFF, 0xFF, 0x01], [-255]);
			encode([0xFF, 0xFF, 0xFF, 0x00], [-256]);
			encode([0xFF, 0xFF, 0xFE, 0xFF], [-257]);
			encode([0xFF, 0xFF, 0xFE, 0xFE], [-258]);
			encode([0xFF, 0xFF, 0xFE, 0xFD], [-259]);
			encode([0x80, 0x00, 0x00, 0x04], [-2147483644]);
			encode([0x80, 0x00, 0x00, 0x03], [-2147483645]);
			encode([0x80, 0x00, 0x00, 0x02], [-2147483646]);
			encode([0x80, 0x00, 0x00, 0x01], [-2147483647]);
			encode([0x80, 0x00, 0x00, 0x00], [-2147483648]);
		});
		it("encodes positive little-endian integers", () => {
			for(let i = 0; i <= 0xFF; encode([i, 0, 0, 0], [i++], true));
			encode([0x4F, 0x03, 0x00, 0x00], [847], true);
			encode([0x50, 0x03, 0x00, 0x00], [848], true);
			encode([0x51, 0x03, 0x00, 0x00], [849], true);
			encode([0x52, 0x03, 0x00, 0x00], [850], true);
			encode([0xFC, 0xFF, 0xFF, 0x7F], [2147483644], true);
			encode([0xFD, 0xFF, 0xFF, 0x7F], [2147483645], true);
			encode([0xFE, 0xFF, 0xFF, 0x7F], [2147483646], true);
			encode([0xFF, 0xFF, 0xFF, 0x7F], [2147483647], true);
		});
		it("encodes negative little-endian integers", () => {
			encode([0xFF, 0xFF, 0xFF, 0xFF], [-1], true);
			encode([0xFE, 0xFF, 0xFF, 0xFF], [-2], true);
			encode([0xFD, 0xFF, 0xFF, 0xFF], [-3], true);
			encode([0xFC, 0xFF, 0xFF, 0xFF], [-4], true);
			encode([0xFB, 0xFF, 0xFF, 0xFF], [-5], true);
			encode([0x02, 0xFF, 0xFF, 0xFF], [-254], true);
			encode([0x01, 0xFF, 0xFF, 0xFF], [-255], true);
			encode([0x00, 0xFF, 0xFF, 0xFF], [-256], true);
			encode([0xFF, 0xFE, 0xFF, 0xFF], [-257], true);
			encode([0xFE, 0xFE, 0xFF, 0xFF], [-258], true);
			encode([0xFD, 0xFE, 0xFF, 0xFF], [-259], true);
			encode([0x04, 0x00, 0x00, 0x80], [-2147483644], true);
			encode([0x03, 0x00, 0x00, 0x80], [-2147483645], true);
			encode([0x02, 0x00, 0x00, 0x80], [-2147483646], true);
			encode([0x01, 0x00, 0x00, 0x80], [-2147483647], true);
			encode([0x00, 0x00, 0x00, 0x80], [-2147483648], true);
		});
	});
	
	describe("bytesToInt64()", function(){
		const {bytesToInt64} = utils;
		this.slow(1000);
		const repeat = (list, times = 2) => {
			const result = [];
			for(let i = 0; i < times; ++i)
				result.push(...list);
			return result;
		};
		const encode = (input, expected, le = false) => {
			for(let i = 1; i < 6; ++i){
				const bytes = repeat(input, i);
				const ints = BigInt64Array.from(repeat(expected, i));
				assert.deepStrictEqual(bytesToInt64(bytes, le), ints);
				assert.deepStrictEqual(bytesToInt64(Uint8Array.from(bytes), le), ints);
			}
		};
		it("encodes positive big-endian integers", () => {
			for(let i = 0; i <= 0xFF; encode([0, 0, 0, 0, 0, 0, 0, i], [BigInt(i++)]));
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00], [256n]);
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01], [257n]);
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02], [258n]);
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x03], [259n]);
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xFC], [1020n]);
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xFD], [1021n]);
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xFE], [1022n]);
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xFF], [1023n]);
			encode([0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFB, 0xFF], [9223372036854774783n]);
			encode([0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC], [9223372036854775804n]);
			encode([0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFD], [9223372036854775805n]);
			encode([0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE], [9223372036854775806n]);
			encode([0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [9223372036854775807n]);
		});
		it("encodes negative big-endian integers", () => {
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-1n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE], [-2n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFD], [-3n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC], [-4n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFB], [-5n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x01], [-255n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00], [-256n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE, 0xFF], [-257n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE, 0xFE], [-258n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x03], [-1021n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x02], [-1022n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x01], [-1023n]);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x00], [-1024n]);
			encode([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04], [-9223372036854775804n]);
			encode([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03], [-9223372036854775805n]);
			encode([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02], [-9223372036854775806n]);
			encode([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], [-9223372036854775807n]);
			encode([0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [-9223372036854775808n]);
		});
		it("encodes positive little-endian integers", () => {
			for(let i = 0; i <= 0xFF; encode([i, 0, 0, 0, 0, 0, 0, 0], [BigInt(i++)], true));
			encode([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [256n], true);
			encode([0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [257n], true);
			encode([0x02, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [258n], true);
			encode([0x03, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [259n], true);
			encode([0xFC, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [1020n], true);
			encode([0xFD, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [1021n], true);
			encode([0xFE, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [1022n], true);
			encode([0xFF, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], [1023n], true);
			encode([0xFF, 0xFB, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], [9223372036854774783n], true);
			encode([0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], [9223372036854775804n], true);
			encode([0xFD, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], [9223372036854775805n], true);
			encode([0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], [9223372036854775806n], true);
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], [9223372036854775807n], true);
		});
		it("encodes negative little-endian integers", () => {
			encode([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-1n], true);
			encode([0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-2n], true);
			encode([0xFD, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-3n], true);
			encode([0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-4n], true);
			encode([0xFB, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-5n], true);
			encode([0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-255n], true);
			encode([0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-256n], true);
			encode([0xFF, 0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-257n], true);
			encode([0xFE, 0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-258n], true);
			encode([0x03, 0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-1021n], true);
			encode([0x02, 0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-1022n], true);
			encode([0x01, 0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-1023n], true);
			encode([0x00, 0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], [-1024n], true);
			encode([0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], [-9223372036854775804n], true);
			encode([0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], [-9223372036854775805n], true);
			encode([0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], [-9223372036854775806n], true);
			encode([0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], [-9223372036854775807n], true);
			encode([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], [-9223372036854775808n], true);
		});
	});
	
	describe("bytesToUint16()", () => {
		const {bytesToUint16} = utils;
		const encode = (input, expected, le = false) => {
			expected = new Uint16Array(expected);
			assert.deepStrictEqual(bytesToUint16(input, le), expected);
			assert.deepStrictEqual(bytesToUint16(Buffer.from(input), le), expected);
			assert.deepStrictEqual(bytesToUint16(Uint8Array.from(input), le), expected);
			input.length % 2 && input.push(0);
			input = new DataView(new Uint8Array(input).buffer);
			expected.forEach((x, i) => assert.strictEqual(input.getUint16(i * 2, le), x));
		};
		it("encodes bytes in big-endian order", () => {
			encode([0x12, 0x34],                         [0x1234]);
			encode([0xFF, 0xBB],                         [0xFFBB]);
			encode([0x12, 0x34, 0x56, 0x78],             [0x1234, 0x5678]);
			encode([0xFF, 0xBB, 0xCC, 0xDD],             [0xFFBB, 0xCCDD]);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF], [0xAABB, 0xCCDD, 0xEEFF]);
			encode([0xA1, 0x00, 0xC3, 0x00, 0xE5, 0x00], [0xA100, 0xC300, 0xE500]);
			encode([0x00, 0xB2, 0x00, 0xD4, 0x00, 0xF6], [0x00B2, 0x00D4, 0x00F6]);
		});
		it("encodes bytes in little-endian order", () => {
			encode([0x12, 0x34],                         [0x3412], true);
			encode([0xFF, 0xBB],                         [0xBBFF], true);
			encode([0x12, 0x34, 0x56, 0x78],             [0x3412, 0x7856], true);
			encode([0xFF, 0xBB, 0xCC, 0xDD],             [0xBBFF, 0xDDCC], true);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF], [0xBBAA, 0xDDCC, 0xFFEE], true);
			encode([0xA1, 0x00, 0xC3, 0x00, 0xE5, 0x00], [0x00A1, 0x00C3, 0x00E5], true);
			encode([0x00, 0xB2, 0x00, 0xD4, 0x00, 0xF6], [0xB200, 0xD400, 0xF600], true);
		});
		it("zero-pads missing bytes", () => {
			encode([0xAB],                               [0xAB00]);
			encode([0xCD],                               [0x00CD], true);
			encode([0xFF, 0xBB, 0xCC],                   [0xFFBB, 0xCC00]);
			encode([0xFF, 0xBB, 0xCC],                   [0xBBFF, 0x00CC], true);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0xEE],       [0xAABB, 0xCCDD, 0xEE00]);
			encode([0xA1, 0x00, 0xC3, 0x00, 0xE5],       [0xA100, 0xC300, 0xE500]);
			encode([0x00, 0xB2, 0x00, 0xD4, 0x00],       [0x00B2, 0x00D4, 0x0000]);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0xEE],       [0xBBAA, 0xDDCC, 0x00EE], true);
			encode([0xA1, 0x00, 0xC3, 0x00, 0xE5],       [0x00A1, 0x00C3, 0x00E5], true);
			encode([0x00, 0xB2, 0x00, 0xD4, 0x00],       [0xB200, 0xD400, 0x0000], true);
		});
	});
	
	describe("bytesToUint32()", () => {
		const {bytesToUint32} = utils;
		const encode = (input, expected, le = false) => {
			expected = new Uint32Array(expected);
			assert.deepStrictEqual(bytesToUint32(input, le), expected);
			assert.deepStrictEqual(bytesToUint32(Buffer.from(input), le), expected);
			assert.deepStrictEqual(bytesToUint32(Uint8Array.from(input), le), expected);
			while(input.length % 4) input.push(0);
			input = new DataView(new Uint8Array(input).buffer);
			expected.forEach((x, i) => assert.strictEqual(input.getUint32(i * 4, le), x));
		};
		it("encodes bytes in big-endian order", () => {
			encode([0x00, 0x00, 0x00, 0xAF],                         [0x000000AF]);
			encode([0x00, 0x11, 0x22, 0x33],                         [0x00112233]);
			encode([0x12, 0x34, 0x56, 0x78],                         [0x12345678]);
			encode([0xAA, 0xBB, 0xCC, 0xDD],                         [0xAABBCCDD]);
			encode([0x12, 0x34, 0x56, 0x78, 0xAB, 0xCD, 0xEF, 0x35], [0x12345678, 0xABCDEF35]);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x11, 0x22], [0xAABBCCDD, 0xEEFF1122]);
			encode([0xA1, 0x00, 0xC3, 0x00, 0xE5, 0x00, 0x1A, 0x00], [0xA100C300, 0xE5001A00]);
			encode([0x00, 0xB2, 0x00, 0xD4, 0x00, 0xF6, 0x00, 0x2B], [0x00B200D4, 0x00F6002B]);
		});
		it("encodes bytes in little-endian order", () => {
			encode([0x00, 0x00, 0x00, 0xAF],                         [0xAF000000], true);
			encode([0x00, 0x11, 0x22, 0x33],                         [0x33221100], true);
			encode([0x12, 0x34, 0x56, 0x78],                         [0x78563412], true);
			encode([0xAA, 0xBB, 0xCC, 0xDD],                         [0xDDCCBBAA], true);
			encode([0x12, 0x34, 0x56, 0x78, 0xAB, 0xCD, 0xEF, 0x35], [0x78563412, 0x35EFCDAB], true);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x11, 0x22], [0xDDCCBBAA, 0x2211FFEE], true);
			encode([0xA1, 0x00, 0xC3, 0x00, 0xE5, 0x00, 0x1A, 0x00], [0x00C300A1, 0x001A00E5], true);
			encode([0x00, 0xB2, 0x00, 0xD4, 0x00, 0xF6, 0x00, 0x2B], [0xD400B200, 0x2B00F600], true);
		});
		it("zero-pads missing bytes", () => {
			encode([0xAB],                                           [0xAB000000]);
			encode([0xAB, 0xCD],                                     [0xABCD0000]);
			encode([0xAB, 0xCD, 0xEF],                               [0xABCDEF00]);
			encode([0xAB],                                           [0x000000AB], true);
			encode([0xAB, 0xCD],                                     [0x0000CDAB], true);
			encode([0xAB, 0xCD, 0xEF],                               [0x00EFCDAB], true);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0x12],                   [0xAABBCCDD, 0x12000000]);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0x12, 0x34],             [0xAABBCCDD, 0x12340000]);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0x12, 0x34, 0x56],       [0xAABBCCDD, 0x12345600]);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0x12],                   [0xDDCCBBAA, 0x00000012], true);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0x12, 0x34],             [0xDDCCBBAA, 0x00003412], true);
			encode([0xAA, 0xBB, 0xCC, 0xDD, 0x12, 0x34, 0x56],       [0xDDCCBBAA, 0x00563412], true);
		});
	});
	
	describe("bytesToUint64()", () => {
		const {bytesToUint64} = utils;
		const encode = (input, expected, le = false) => {
			expected = new BigUint64Array(expected);
			assert.deepStrictEqual(bytesToUint64(input, le), expected);
			assert.deepStrictEqual(bytesToUint64(Buffer.from(input), le), expected);
			assert.deepStrictEqual(bytesToUint64(Uint8Array.from(input), le), expected);
			while(input.length % 8) input.push(0);
			input = new DataView(new Uint8Array(input).buffer);
			expected.forEach((x, i) => assert.strictEqual(input.getBigUint64(i * 8, le), x));
		};
		const bytes = [0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91];
		const be = new BigUint64Array([0x1122334455667788n, 0xABCDEF1234567891n]);
		const le = new BigUint64Array([0x8877665544332211n, 0x9178563412EFCDABn]);
		it("encodes bytes in big-endian order",    () => expect(bytesToUint64(bytes)).to.eql(be));
		it("encodes bytes in little-endian order", () => expect(bytesToUint64(bytes, true)).to.eql(le));
		it("zero-pads missing bytes", () => {
			encode([...bytes, 0xAB, 0xCD], [...be, 0xABCD000000000000n]);
			encode([...bytes, 0xAB, 0xCD], [...le, 0x000000000000CDABn], true);
		});
	});
	
	describe("crc32()", () => {
		const {crc32} = utils;
		it("computes CRCs of byte arrays", () => {
			expect(crc32([0x46, 0x6F, 0x6F, 0x31, 0x32, 0x33])).to.equal(0x67EDF5DB);
			expect(crc32([0x00, 0x1B, 0xA4, 0x00, 0x07])).to.equal(0x12F479C);
		});
		it("computes CRCs of typed arrays", () => {
			const A = Uint8Array.from([0x66, 0x6F, 0x6F, 0x2D, 0x62, 0x61, 0x72]);
			const B = Uint8Array.from([0x57, 0x69, 0x6B, 0x69, 0x70, 0x65, 0x64, 0x69, 0x61]);
			expect(crc32(A)).to.equal(+0x4C2CD9E9);
			expect(crc32(B)).to.equal(-0x52553FD2);
		});
		it("computes CRCs of buffers", () => {
			const A = Buffer.from([0x08, 0xC6, 0x9C, 0x1C, 0xF0, 0xEF, 0xE1, 0xD7, 0xE1, 0x0B, 0xF2, 0xF6, 0xC5, 0x7F, 0xD0]);
			const B = Buffer.from([0x90, 0x9F, 0x38, 0x8C, 0xCC, 0x69, 0x48, 0x61, 0x47, 0xB3, 0xD0, 0xF2, 0x22, 0x3A, 0x00]);
			expect(crc32(A)).to.equal(0x2CD129D3);
			expect(crc32(B)).to.equal(0x0F9640D1);
			expect(crc32(Buffer.concat([A, B]))).to.equal(-0x2B751BDD);
		});
	});
	
	describe("int8ToBytes()", () => {
		const {int8ToBytes} = utils;
		it("decodes positive integers up to +127", () => {
			for(let i = 0; i < 128; ++i)
				expect(int8ToBytes([i])).to.eql(new Uint8Array([i]));
			for(let i = 0; i < 125; i += 3){
				const ints = new Uint8Array([i, i + 1, i + 2, i + 3]);
				expect(int8ToBytes(ints)).to.eql(ints).and.not.equal(ints);
			}
		});
		it("decodes negative integers up to -128", () => {
			expect(int8ToBytes([-1]))  .to.eql(new Uint8Array([0xFF]));
			expect(int8ToBytes([-2]))  .to.eql(new Uint8Array([0xFE]));
			expect(int8ToBytes([-127])).to.eql(new Uint8Array([0x81]));
			expect(int8ToBytes([-128])).to.eql(new Uint8Array([0x80]));
			for(let i = 0; i < 128; ++i)
				expect(int8ToBytes([-128 + i])).to.eql(new Uint8Array([i + 0x80]));
		});
		it("decodes single-integer arguments", () => {
			expect(int8ToBytes(-1))        .to.eql(new Uint8Array([0xFF]));
			expect(int8ToBytes(-2))        .to.eql(new Uint8Array([0xFE]));
			expect(int8ToBytes(-127, true)).to.eql(new Uint8Array([0x81]));
			expect(int8ToBytes(-128, true)).to.eql(new Uint8Array([0x80]));
		});
	});
	
	describe("int16ToBytes()", function(){
		const {int16ToBytes} = utils;
		this.slow(1000);
		const repeat = (list, times = 2) => {
			const result = [];
			for(let i = 0; i < times; ++i)
				result.push(...list);
			return result;
		};
		const decode = (input, expected, le = false) => {
			for(let i = 1; i < 6; ++i){
				const ints = repeat(input, i);
				const bytes = Uint8Array.from(repeat(expected, i));
				assert.deepStrictEqual(int16ToBytes(ints, le), bytes);
				assert.deepStrictEqual(int16ToBytes(Int16Array.from(ints), le), bytes);
				1 === ints.length && assert.deepStrictEqual(int16ToBytes(ints[0], le), bytes);
			}
		};
		it("decodes positive big-endian integers", () => {
			for(let i = 0; i <= 0xFF; decode([i], [0x00, i++]));
			decode([847],    [0x03, 0x4F]);
			decode([848],    [0x03, 0x50]);
			decode([849],    [0x03, 0x51]);
			decode([850],    [0x03, 0x52]);
			decode([32764],  [0x7F, 0xFC]);
			decode([32765],  [0x7F, 0xFD]);
			decode([32766],  [0x7F, 0xFE]);
			decode([32767],  [0x7F, 0xFF]);
		});
		it("decodes negative big-endian integers", () => {
			decode([-1],     [0xFF, 0xFF]);
			decode([-2],     [0xFF, 0xFE]);
			decode([-3],     [0xFF, 0xFD]);
			decode([-4],     [0xFF, 0xFC]);
			decode([-5],     [0xFF, 0xFB]);
			decode([-254],   [0xFF, 0x02]);
			decode([-255],   [0xFF, 0x01]);
			decode([-256],   [0xFF, 0x00]);
			decode([-257],   [0xFE, 0xFF]);
			decode([-258],   [0xFE, 0xFE]);
			decode([-259],   [0xFE, 0xFD]);
			decode([-32765], [0x80, 0x03]);
			decode([-32766], [0x80, 0x02]);
			decode([-32767], [0x80, 0x01]);
			decode([-32768], [0x80, 0x00]);
		});
		it("decodes positive little-endian integers", () => {
			for(let i = 0; i <= 0xFF; decode([i], [i++, 0x00], true));
			decode([847],    [0x4F, 0x03], true);
			decode([848],    [0x50, 0x03], true);
			decode([849],    [0x51, 0x03], true);
			decode([850],    [0x52, 0x03], true);
			decode([32764],  [0xFC, 0x7F], true);
			decode([32765],  [0xFD, 0x7F], true);
			decode([32766],  [0xFE, 0x7F], true);
			decode([32767],  [0xFF, 0x7F], true);
		});
		it("decodes negative little-endian integers", () => {
			decode([-1],     [0xFF, 0xFF], true);
			decode([-2],     [0xFE, 0xFF], true);
			decode([-3],     [0xFD, 0xFF], true);
			decode([-4],     [0xFC, 0xFF], true);
			decode([-5],     [0xFB, 0xFF], true);
			decode([-254],   [0x02, 0xFF], true);
			decode([-255],   [0x01, 0xFF], true);
			decode([-256],   [0x00, 0xFF], true);
			decode([-257],   [0xFF, 0xFE], true);
			decode([-258],   [0xFE, 0xFE], true);
			decode([-259],   [0xFD, 0xFE], true);
			decode([-32765], [0x03, 0x80], true);
			decode([-32766], [0x02, 0x80], true);
			decode([-32767], [0x01, 0x80], true);
			decode([-32768], [0x00, 0x80], true);
		});
	});
	
	describe("int32ToBytes()", function(){
		const {int32ToBytes} = utils;
		this.slow(1000);
		const repeat = (list, times = 2) => {
			const result = [];
			for(let i = 0; i < times; ++i)
				result.push(...list);
			return result;
		};
		const decode = (input, expected, le = false) => {
			for(let i = 1; i < 6; ++i){
				const ints = repeat(input, i);
				const bytes = Uint8Array.from(repeat(expected, i));
				assert.deepStrictEqual(int32ToBytes(ints, le), bytes);
				assert.deepStrictEqual(int32ToBytes(Int32Array.from(ints), le), bytes);
				1 === ints.length && assert.deepStrictEqual(int32ToBytes(ints[0], le), bytes);
			}
		};
		it("decodes positive big-endian integers", () => {
			for(let i = 0; i <= 0xFF; decode([i], [0, 0, 0, i++]));
			decode([847],         [0x00, 0x00, 0x03, 0x4F]);
			decode([848],         [0x00, 0x00, 0x03, 0x50]);
			decode([849],         [0x00, 0x00, 0x03, 0x51]);
			decode([850],         [0x00, 0x00, 0x03, 0x52]);
			decode([2147483644],  [0x7F, 0xFF, 0xFF, 0xFC]);
			decode([2147483645],  [0x7F, 0xFF, 0xFF, 0xFD]);
			decode([2147483646],  [0x7F, 0xFF, 0xFF, 0xFE]);
			decode([2147483647],  [0x7F, 0xFF, 0xFF, 0xFF]);
		});
		it("decodes negative big-endian integers", () => {
			decode([-1],          [0xFF, 0xFF, 0xFF, 0xFF]);
			decode([-2],          [0xFF, 0xFF, 0xFF, 0xFE]);
			decode([-3],          [0xFF, 0xFF, 0xFF, 0xFD]);
			decode([-4],          [0xFF, 0xFF, 0xFF, 0xFC]);
			decode([-5],          [0xFF, 0xFF, 0xFF, 0xFB]);
			decode([-254],        [0xFF, 0xFF, 0xFF, 0x02]);
			decode([-255],        [0xFF, 0xFF, 0xFF, 0x01]);
			decode([-256],        [0xFF, 0xFF, 0xFF, 0x00]);
			decode([-257],        [0xFF, 0xFF, 0xFE, 0xFF]);
			decode([-258],        [0xFF, 0xFF, 0xFE, 0xFE]);
			decode([-259],        [0xFF, 0xFF, 0xFE, 0xFD]);
			decode([-2147483644], [0x80, 0x00, 0x00, 0x04]);
			decode([-2147483645], [0x80, 0x00, 0x00, 0x03]);
			decode([-2147483646], [0x80, 0x00, 0x00, 0x02]);
			decode([-2147483647], [0x80, 0x00, 0x00, 0x01]);
			decode([-2147483648], [0x80, 0x00, 0x00, 0x00]);
		});
		it("decodes positive little-endian integers", () => {
			for(let i = 0; i <= 0xFF; decode([i], [i++, 0, 0, 0], true));
			decode([847],         [0x4F, 0x03, 0x00, 0x00], true);
			decode([848],         [0x50, 0x03, 0x00, 0x00], true);
			decode([849],         [0x51, 0x03, 0x00, 0x00], true);
			decode([850],         [0x52, 0x03, 0x00, 0x00], true);
			decode([2147483644],  [0xFC, 0xFF, 0xFF, 0x7F], true);
			decode([2147483645],  [0xFD, 0xFF, 0xFF, 0x7F], true);
			decode([2147483646],  [0xFE, 0xFF, 0xFF, 0x7F], true);
			decode([2147483647],  [0xFF, 0xFF, 0xFF, 0x7F], true);
		});
		it("decodes negative little-endian integers", () => {
			decode([-1],          [0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-2],          [0xFE, 0xFF, 0xFF, 0xFF], true);
			decode([-3],          [0xFD, 0xFF, 0xFF, 0xFF], true);
			decode([-4],          [0xFC, 0xFF, 0xFF, 0xFF], true);
			decode([-5],          [0xFB, 0xFF, 0xFF, 0xFF], true);
			decode([-254],        [0x02, 0xFF, 0xFF, 0xFF], true);
			decode([-255],        [0x01, 0xFF, 0xFF, 0xFF], true);
			decode([-256],        [0x00, 0xFF, 0xFF, 0xFF], true);
			decode([-257],        [0xFF, 0xFE, 0xFF, 0xFF], true);
			decode([-258],        [0xFE, 0xFE, 0xFF, 0xFF], true);
			decode([-259],        [0xFD, 0xFE, 0xFF, 0xFF], true);
			decode([-2147483644], [0x04, 0x00, 0x00, 0x80], true);
			decode([-2147483645], [0x03, 0x00, 0x00, 0x80], true);
			decode([-2147483646], [0x02, 0x00, 0x00, 0x80], true);
			decode([-2147483647], [0x01, 0x00, 0x00, 0x80], true);
			decode([-2147483648], [0x00, 0x00, 0x00, 0x80], true);
		});
	});
	
	describe("int64ToBytes()", function(){
		const {int64ToBytes} = utils;
		this.slow(1000);
		const repeat = (list, times = 2) => {
			const result = [];
			for(let i = 0; i < times; ++i)
				result.push(...list);
			return result;
		};
		const decode = (input, expected, le = false) => {
			for(let i = 1; i < 6; ++i){
				const ints = repeat(input, i);
				const bytes = Uint8Array.from(repeat(expected, i));
				assert.deepStrictEqual(int64ToBytes(ints, le), bytes);
				assert.deepStrictEqual(int64ToBytes(BigInt64Array.from(ints), le), bytes);
				1 === ints.length && assert.deepStrictEqual(int64ToBytes(ints[0], le), bytes);
			}
		};
		it("decodes positive big-endian integers", () => {
			for(let i = 0; i <= 0xFF; decode([BigInt(i)], [0, 0, 0, 0, 0, 0, 0, i++]));
			decode([256n],                  [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00]);
			decode([257n],                  [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01]);
			decode([258n],                  [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02]);
			decode([259n],                  [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x03]);
			decode([1020n],                 [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xFC]);
			decode([1021n],                 [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xFD]);
			decode([1022n],                 [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xFE]);
			decode([1023n],                 [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03, 0xFF]);
			decode([9223372036854774783n],  [0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFB, 0xFF]);
			decode([9223372036854775804n],  [0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC]);
			decode([9223372036854775805n],  [0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFD]);
			decode([9223372036854775806n],  [0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE]);
			decode([9223372036854775807n],  [0x7F, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
		});
		it("decodes negative big-endian integers", () => {
			decode([-1n],                   [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
			decode([-2n],                   [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE]);
			decode([-3n],                   [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFD]);
			decode([-4n],                   [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC]);
			decode([-5n],                   [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFB]);
			decode([-255n],                 [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x01]);
			decode([-256n],                 [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00]);
			decode([-257n],                 [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE, 0xFF]);
			decode([-258n],                 [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE, 0xFE]);
			decode([-1021n],                [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x03]);
			decode([-1022n],                [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x02]);
			decode([-1023n],                [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x01]);
			decode([-1024n],                [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFC, 0x00]);
			decode([-9223372036854775804n], [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04]);
			decode([-9223372036854775805n], [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03]);
			decode([-9223372036854775806n], [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02]);
			decode([-9223372036854775807n], [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]);
			decode([-9223372036854775808n], [0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
		});
		it("decodes positive little-endian integers", () => {
			for(let i = 0; i <= 0xFF; decode([BigInt(i)], [i++, 0, 0, 0, 0, 0, 0, 0], true));
			decode([256n],                  [0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], true);
			decode([257n],                  [0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], true);
			decode([258n],                  [0x02, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], true);
			decode([259n],                  [0x03, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], true);
			decode([1020n],                 [0xFC, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], true);
			decode([1021n],                 [0xFD, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], true);
			decode([1022n],                 [0xFE, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], true);
			decode([1023n],                 [0xFF, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], true);
			decode([9223372036854774783n],  [0xFF, 0xFB, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], true);
			decode([9223372036854775804n],  [0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], true);
			decode([9223372036854775805n],  [0xFD, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], true);
			decode([9223372036854775806n],  [0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], true);
			decode([9223372036854775807n],  [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F], true);
		});
		it("decodes negative little-endian integers", () => {
			decode([-1n],                   [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-2n],                   [0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-3n],                   [0xFD, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-4n],                   [0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-5n],                   [0xFB, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-255n],                 [0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-256n],                 [0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-257n],                 [0xFF, 0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-258n],                 [0xFE, 0xFE, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-1021n],                [0x03, 0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-1022n],                [0x02, 0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-1023n],                [0x01, 0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-1024n],                [0x00, 0xFC, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], true);
			decode([-9223372036854775804n], [0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], true);
			decode([-9223372036854775805n], [0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], true);
			decode([-9223372036854775806n], [0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], true);
			decode([-9223372036854775807n], [0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], true);
			decode([-9223372036854775808n], [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80], true);
		});
	});
	
	describe("rgba()", () => {
		const {rgba} = utils;
		describe("Solid colours", () => {
			it("generates red pixels",     () => expect(rgba(0xFF, 0x00, 0x00, 0xFF)).to.eql(file("rgba/ff0000ff.png")));
			it("generates green pixels",   () => expect(rgba(0x00, 0xFF, 0x00, 0xFF)).to.eql(file("rgba/00ff00ff.png")));
			it("generates blue pixels",    () => expect(rgba(0x00, 0x00, 0xFF, 0xFF)).to.eql(file("rgba/0000ffff.png")));
			it("generates white pixels",   () => expect(rgba(0xFF, 0xFF, 0xFF, 0xFF)).to.eql(file("rgba/ffffffff.png")));
			it("generates black pixels",   () => expect(rgba(0x00, 0x00, 0x00, 0xFF)).to.eql(file("rgba/000000ff.png")));
			it("generates grey pixels",    () => expect(rgba(0x7F, 0x7F, 0x7F, 0xFF)).to.eql(file("rgba/7f7f7fff.png")));
			it("generates #BBFFDD pixels", () => expect(rgba(0xBB, 0xFF, 0xDD, 0xFF)).to.eql(file("rgba/bbffddff.png")));
			it("generates #BBAAFF pixels", () => expect(rgba(0xBB, 0xAA, 0xFF, 0xFF)).to.eql(file("rgba/bbaaffff.png")));
		});
		describe("Translucent colours", () => {
			it("generates red pixels",     () => expect(rgba(0xAF, 0x00, 0x00, 0x64)).to.eql(file("rgba/af000064.png")));
			it("generates green pixels",   () => expect(rgba(0x00, 0x85, 0x00, 0x3A)).to.eql(file("rgba/0085003a.png")));
			it("generates blue pixels",    () => expect(rgba(0x00, 0x00, 0x9A, 0x89)).to.eql(file("rgba/00009a89.png")));
			it("generates white pixels",   () => expect(rgba(0xFF, 0xFF, 0xFF, 0x7F)).to.eql(file("rgba/ffffff7f.png")));
			it("generates black pixels",   () => expect(rgba(0x00, 0x00, 0x00, 0x40)).to.eql(file("rgba/00000040.png")));
			it("generates grey pixels",    () => expect(rgba(0x3A, 0x3B, 0x3C, 0x6F)).to.eql(file("rgba/3a3b3c6f.png")));
			it("generates #BBFFDD pixels", () => expect(rgba(0xBB, 0xFF, 0xDD, 0x30)).to.eql(file("rgba/bbffdd30.png")));
			it("generates #BBAAFF pixels", () => expect(rgba(0xBB, 0xAA, 0xFF, 0x0A)).to.eql(file("rgba/bbaaff0a.png")));
		});
		describe("100% transparency", () => {
			it("generates red pixels",     () => expect(rgba(0xFF, 0x00, 0x00, 0x00)).to.eql(file("rgba/ff000000.png")));
			it("generates green pixels",   () => expect(rgba(0x00, 0xFF, 0x00, 0x00)).to.eql(file("rgba/00ff0000.png")));
			it("generates blue pixels",    () => expect(rgba(0x00, 0x00, 0xFF, 0x00)).to.eql(file("rgba/0000ff00.png")));
			it("generates white pixels",   () => expect(rgba(0xFF, 0xFF, 0xFF, 0x00)).to.eql(file("rgba/ffffff00.png")));
			it("generates black pixels",   () => expect(rgba(0x00, 0x00, 0x00, 0x00)).to.eql(file("rgba/00000000.png")));
			it("generates grey pixels",    () => expect(rgba(0x3A, 0x3B, 0x3C, 0x00)).to.eql(file("rgba/3a3b3c00.png")));
			it("generates #BBFFDD pixels", () => expect(rgba(0xBB, 0xFF, 0xDD, 0x00)).to.eql(file("rgba/bbffdd00.png")));
			it("generates #BBAAFF pixels", () => expect(rgba(0xBB, 0xAA, 0xFF, 0x00)).to.eql(file("rgba/bbaaff00.png")));
		});
	});
	
	describe("rotl() / rotr()", () => {
		const {rotl, rotr} = utils;
		let tests = null;
		before("Loading tests", async () => {
			tests = (await import("./fixtures/rot32.mjs")).default;
		});
		it("rotates bits towards the left", () => tests.forEach((test, i) => {
			for(const [input, output] of test)
				expect(rotl(input, i + 1)).to.equal(output);
		}));
		it("rotates bits towards the right", () => tests.forEach((test, i) => {
			for(const [output, input] of test)
				expect(rotr(input, i + 1)).to.equal(output);
		}));
		it("wraps offset amounts modulo 32", () => {
			expect(rotl(0xF8000000, 32)).to.equal(0xF8000000);
			expect(rotr(0xF8000000, 32)).to.equal(0xF8000000);
			expect(rotl(0xF8000000, 33)).to.equal(0xF0000001);
			expect(rotr(0xF8000000, 33)).to.equal(0x7C000000);
			expect(rotl(0xF8000000, 34)).to.equal(0xE0000003);
			expect(rotr(0xF8000000, 34)).to.equal(0x3E000000);
		});
	});
	
	describe("sha1()", () => {
		const {sha1} = utils;
		it("computes checksums of 3-byte messages", () => {
			expect(sha1([120, 121, 122])).to.equal("66b27417d37e024c46526c2f6d358a754fc552f3");
			expect(sha1([0x1, 0x2, 0x3])).to.equal("7037807198c22a7d2b0807371d763779a84fdfcf");
			expect(sha1([255, 255, 255])).to.equal("78670e88a9c2c711124471d2f24a8dbc8ce5dba9");
			expect(sha1([128, 200, 0x7])).to.equal("2d1664fac047f29bd5e4f66435616e0e43e12a16");
			expect(sha1([0x0, 0x0, 0x0])).to.equal("29e2dcfbb16f63bb0254df7585a15bb6fb5e927d");
		});
		it("computes checksums of empty messages", () => {
			expect(sha1([])).to.equal("da39a3ee5e6b4b0d3255bfef95601890afd80709");
		});
		it("computes checksums of pangrams", () => {
			const $ = s => s.split("").map(x => x.charCodeAt(0));
			expect(sha1($("Glib jocks quiz nymph to vex dwarf.")))        .to.equal("5c7003e6d645a88d7e0717d3ea85f3e26350d8c7");
			expect(sha1($("Sphinx of black quartz, judge my vow.")))      .to.equal("77df869f7e054756bcce6d85dbb35f01cf3ea24a");
			expect(sha1($("How vexingly quick daft zebras jump!")))       .to.equal("7ab03e8daaf316ebedf1b8cfb63749a3202bbf47");
			expect(sha1($("The five boxing wizards jump quickly.")))      .to.equal("3d91b05a0c8bc749bdcaf63f0179b6017eba0383");
			expect(sha1($("Pack my box with five dozen liquor jugs.")))   .to.equal("a7e9cf930cae010f36bc252d59bf391ecc8b52d6");
			expect(sha1($("The quick brown fox jumps over the lazy dog"))).to.equal("2fd4e1c67a2d28fced849ee1bb76e7391b93eb12");
			expect(sha1($("The quick brown fox jumps over the lazy cog"))).to.equal("de9f2c7fd25e1b3afad3e85a0bd17d9b100db4b3");
			expect(sha1($("Jived fox nymph grabs quick waltz.")))         .to.equal("368fd45c3a192001c09cfd84ff4afa718c86b747");
		});
		it("computes checksums of binary blocks", () => {
			const zeroes = new Uint8Array(1024);
			const all128 = new Uint8Array(2048).fill(0x80);
			const all255 = new Uint8Array(3071).fill(0xFF);
			const latin1 = new Uint8Array(4096).map((n, index) => index % 255);
			expect(sha1(zeroes)).to.equal("60cacbf3d72e1e7834203da608037b1bf83b40e8");
			expect(sha1(all128)).to.equal("68e1ff2951f5d5f074613fa5480680f11dd1495d");
			expect(sha1(all255)).to.equal("e32a0982173eef5e9318f562b35fd1f43c85fb7c");
			expect(sha1(latin1)).to.equal("71bf658ae6ab40a70defe0d63f95f686870b754f");
		});
		it("computes checksums of PNG fixtures", () => {
			expect(sha1(file("rgba/00000000.png"))).to.equal("f8d88e6e02b634ea9cc384d33596c4f590b6ae31");
			expect(sha1(file("rgba/00000040.png"))).to.equal("fd69eead19d508fa659c6edfe3a0f8681ecf28d0");
			expect(sha1(file("rgba/000000ff.png"))).to.equal("ec6f28cd5ebed9bc95053fed3a2018bfff3e0596");
			expect(sha1(file("rgba/00009a89.png"))).to.equal("0fde443c129e30c91d2d6824397bd2fbd06c51a1");
			expect(sha1(file("rgba/0000ff00.png"))).to.equal("0762f078c0f3014dabe87bad3fe2f35d3dea64b3");
			expect(sha1(file("rgba/0000ffff.png"))).to.equal("9ee13be59305affc103d687909496822ac40d920");
			expect(sha1(file("rgba/0085003a.png"))).to.equal("baa685e7cd63395c21daa8c0e18a4ed7975de8d4");
			expect(sha1(file("rgba/00ff0000.png"))).to.equal("e7702eb43ead2ed16aa9a90b890132b6c76a9db4");
			expect(sha1(file("rgba/00ff00ff.png"))).to.equal("4b594c3fa919b925992d97255ca29bf1e25c08a6");
			expect(sha1(file("rgba/3a3b3c00.png"))).to.equal("d86184312b399508e6add30a707ba4ff4e03eb3a");
			expect(sha1(file("rgba/3a3b3c6f.png"))).to.equal("ecbab7ef0ee4d6402e6bfcdcd10614a3386d0bf6");
			expect(sha1(file("rgba/7f7f7fff.png"))).to.equal("4f7e15871a7156ee6a0791960ece126bc2f836e6");
			expect(sha1(file("rgba/af000064.png"))).to.equal("98ea5e764168c160582f0ed9a921ab54b5c5ef84");
			expect(sha1(file("rgba/bbaaff00.png"))).to.equal("a66ff64d8b139ea7c303850bad114f0bf7b6cb4b");
			expect(sha1(file("rgba/bbaaff0a.png"))).to.equal("475df629ebbed4296b5b2d20b0eef8f6b603d260");
			expect(sha1(file("rgba/bbaaffff.png"))).to.equal("094e8d1ff70ae139699a409c086f07964cb2417a");
			expect(sha1(file("rgba/bbffdd00.png"))).to.equal("b5f2ff741439aa66a2b1c6029c94688a5fe220d0");
			expect(sha1(file("rgba/bbffdd30.png"))).to.equal("246042095ef802ef3f59b6e46fcf8dbd1a29794e");
			expect(sha1(file("rgba/bbffddff.png"))).to.equal("65832700005eea524e4eacfd2d1244f50c5c1fbf");
			expect(sha1(file("rgba/ff000000.png"))).to.equal("75d60144d0907b5d300ec580904ad052e2812d43");
			expect(sha1(file("rgba/ff0000ff.png"))).to.equal("b31f0478d976ce5749f86344211aeeba41de065e");
			expect(sha1(file("rgba/ffffff00.png"))).to.equal("950408bcffbed5942be5534b0c6437a46524d617");
			expect(sha1(file("rgba/ffffff7f.png"))).to.equal("4a068096b7bdc92ac98d1d799e5ebc503691f119");
			expect(sha1(file("rgba/ffffffff.png"))).to.equal("5372946ce021a6956209135e2426bceb3a47e239");
		});
	});
	
	describe("uint16ToBytes()", () => {
		const {uint16ToBytes} = utils;
		const decode = (input, expected, le = false) => {
			expected = new Uint8Array(expected);
			assert.deepStrictEqual(uint16ToBytes(input, le), expected);
			assert.deepStrictEqual(uint16ToBytes(new Uint16Array(input), le), expected);
		};
		it("decodes integers in big-endian order", () => {
			decode([0x1234],               [0x12, 0x34]);
			decode([0x1234, 0x0056],       [0x12, 0x34, 0x00, 0x56]);
			decode([0x1234, 0x5678],       [0x12, 0x34, 0x56, 0x78]);
			decode([0xABCD, 0xEF12, 0x34], [0xAB, 0xCD, 0xEF, 0x12, 0x00, 0x34]);
		});
		it("decodes integers in little-endian order", () => {
			decode([0x00A5],               [0xA5, 0x00], true);
			decode([0x1234],               [0x34, 0x12], true);
			decode([0x1234, 0x0056],       [0x34, 0x12, 0x56, 0x00], true);
			decode([0x1234, 0x5678],       [0x34, 0x12, 0x78, 0x56], true);
			decode([0xABCD, 0xEF12, 0x34], [0xCD, 0xAB, 0x12, 0xEF, 0x34, 0], true);
		});
		it("decodes single-integer arguments", () => {
			expect(uint16ToBytes(0xABCD))      .to.eql(new Uint8Array([0xAB, 0xCD]));
			expect(uint16ToBytes(0x00EF))      .to.eql(new Uint8Array([0x00, 0xEF]));
			expect(uint16ToBytes(0xABCD, true)).to.eql(new Uint8Array([0xCD, 0xAB]));
			expect(uint16ToBytes(0x00EF, true)).to.eql(new Uint8Array([0xEF, 0x00]));
		});
	});
	
	describe("uint32ToBytes()", () => {
		const {uint32ToBytes} = utils;
		const decode = (input, expected, le = false) => {
			expected = new Uint8Array(expected);
			assert.deepStrictEqual(uint32ToBytes(input, le), expected);
			assert.deepStrictEqual(uint32ToBytes(new Uint32Array(input), le), expected);
		};
		it("decodes integers in big-endian order", () => {
			decode([0xAABBCCDD],                   [0xAA, 0xBB, 0xCC, 0xDD]);
			decode([0x000000AB],                   [0x00, 0x00, 0x00, 0xAB]);
			decode([0x0000ABCD],                   [0x00, 0x00, 0xAB, 0xCD]);
			decode([0x00ABCDEF],                   [0x00, 0xAB, 0xCD, 0xEF]);
			decode([0xABCDEF12],                   [0xAB, 0xCD, 0xEF, 0x12]);
			decode([0xABCDEF12, 0x00000034],       [0xAB, 0xCD, 0xEF, 0x12, 0x00, 0x00, 0x00, 0x34]);
			decode([0xABCDEF12, 0x00003456],       [0xAB, 0xCD, 0xEF, 0x12, 0x00, 0x00, 0x34, 0x56]);
			decode([0xABCDEF12, 0x00345678],       [0xAB, 0xCD, 0xEF, 0x12, 0x00, 0x34, 0x56, 0x78]);
			decode([0xABCDEF12, 0x34567891],       [0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91]);
			decode([0xABCDEF12, 0x34567891, 0x23], [0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91, 0, 0, 0, 0x23]);
		});
		it("decodes integers in little-endian order", () => {
			decode([0xAABBCCDD],                   [0xDD, 0xCC, 0xBB, 0xAA], true);
			decode([0x000000AB],                   [0xAB, 0x00, 0x00, 0x00], true);
			decode([0x0000ABCD],                   [0xCD, 0xAB, 0x00, 0x00], true);
			decode([0x00ABCDEF],                   [0xEF, 0xCD, 0xAB, 0x00], true);
			decode([0xABCDEF12],                   [0x12, 0xEF, 0xCD, 0xAB], true);
			decode([0xABCDEF12, 0x00000034],       [0x12, 0xEF, 0xCD, 0xAB, 0x34, 0x00, 0x00, 0x00], true);
			decode([0xABCDEF12, 0x00003456],       [0x12, 0xEF, 0xCD, 0xAB, 0x56, 0x34, 0x00, 0x00], true);
			decode([0xABCDEF12, 0x00345678],       [0x12, 0xEF, 0xCD, 0xAB, 0x78, 0x56, 0x34, 0x00], true);
			decode([0xABCDEF12, 0x34567891],       [0x12, 0xEF, 0xCD, 0xAB, 0x91, 0x78, 0x56, 0x34], true);
			decode([0xABCDEF12, 0x34567891, 0x23], [0x12, 0xEF, 0xCD, 0xAB, 0x91, 0x78, 0x56, 0x34, 0x23, 0, 0, 0], true);
		});
		it("decodes single-integer arguments", () => {
			const input = 0xABCDEF12;
			const bytes = new Uint8Array([0xAB, 0xCD, 0xEF, 0x12]);
			expect(uint32ToBytes(input))  .to.eql(bytes);
			expect(uint32ToBytes([input])).to.eql(bytes);
			bytes.reverse();
			expect(uint32ToBytes(input,   true)).to.eql(bytes);
			expect(uint32ToBytes([input], true)).to.eql(bytes);
		});
	});
	
	describe("uint64ToBytes()", () => {
		const {uint64ToBytes} = utils;
		it("decodes integers in big-endian order", () => {
			const uints = [0x1122334455667788n, 0xABCDEF1234567891n, 0xABCDn];
			expect(uint64ToBytes(uints)).to.eql(new Uint8Array([
				0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
				0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xAB, 0xCD,
			]));
		});
		it("decodes integers in little-endian order", () => {
			const uints = [0x1122334455667788n, 0xABCDEF1234567891n, 0xABCDn];
			expect(uint64ToBytes(uints, true)).to.eql(new Uint8Array([
				0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11,
				0x91, 0x78, 0x56, 0x34, 0x12, 0xEF, 0xCD, 0xAB,
				0xCD, 0xAB, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			]));
		});
		it("decodes single-integer arguments", () => {
			const input = 0xABCDEF1234567891n;
			const bytes = new Uint8Array([0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91]);
			expect(uint64ToBytes(input))  .to.eql(bytes);
			expect(uint64ToBytes([input])).to.eql(bytes);
			bytes.reverse();
			expect(uint64ToBytes(input,   true)).to.eql(bytes);
			expect(uint64ToBytes([input], true)).to.eql(bytes);
		});
	});
	
	describe("utf8Decode()", () => {
		const {utf8Decode} = utils;
		
		function decode(input, expected){
			expected = new Uint8Array(expected);
			const bytes = expected.map(n => n.toString(16).toUpperCase().padStart(2, "0")).join(" ");
			let message = `Expected "${input}" to be decoded as <${bytes}>`;
			const result = utf8Decode(input);
			assert.deepStrictEqual(result, expected, message);
			
			// Ensure consistency with Node.js/ICU-based implementations
			message = "Expected encodings to match";
			assert.strictEqual(Buffer.from(expected).utf8Slice(), input, message);
			assert.strictEqual(new TextDecoder("utf-8").decode(new Uint8Array(expected).buffer), input, message);
		}
		
		it("decodes 1-byte sequences", () => {
			for(let i = 0; i < 128; ++i)
				decode(String.fromCodePoint(i), [i]);
		});
		
		it("decodes 2-byte sequences", () => {
			decode("\xA0", [0xC2, 0xA0]);
			decode("§",    [0xC2, 0xA7]);
			decode("ÿ",    [0xC3, 0xBF]);
			decode("Джон", [0xD0, 0x94, 0xD0, 0xB6, 0xD0, 0xBE, 0xD0, 0xBD]);
			decode("John", [0x4A, 0x6F, 0x68, 0x6E]);
		});
		
		it("decodes 3-byte sequences", () => {
			decode("€",   [0xE2, 0x82, 0xAC]);
			decode("�",   [0xEF, 0xBF, 0xBD]);
			decode("→│λ", [0xE2, 0x86, 0x92, 0xE2, 0x94, 0x82, 0xCE, 0xBB]);
		});
		
		it("decodes 4-byte sequences", () => {
			decode("😂", [0xF0, 0x9F, 0x98, 0x82]);
			decode("𝑱𝒐", [0xF0, 0x9D, 0x91, 0xB1, 0xF0, 0x9D, 0x92, 0x90]);
			decode("𝒉𝒏", [0xF0, 0x9D, 0x92, 0x89, 0xF0, 0x9D, 0x92, 0x8F]);
		});
		
		it("raises an exception for invalid codepoints", () => {
			const error = {name: "RangeError", message: /^Invalid codepoint: \d+$/};
			assert.throws(() => utf8Decode([-2], error));
			assert.throws(() => utf8Decode([0x7FFFFFFF]), error);
		});
	});
	
	describe("utf8Encode()", () => {
		const {utf8Encode} = utils;
		
		function encode(input, expected, isValid = false){
			const bytes = input.map(n => n.toString(16).toUpperCase().padStart(2, "0")).join(" ");
			let message = `Expected <${bytes}> to be encoded as "${expected}"`;
			const result = utf8Encode(input);
			assert.strictEqual(result, expected, message);
			
			// Ensure consistent error-handling with other implementations
			message = "Expected encodings to match";
			assert.strictEqual(Buffer.from(input).utf8Slice(), result, message);
			assert.strictEqual(new TextDecoder("utf-8").decode(new Uint8Array(input).buffer), expected, input);
			
			// Make sure invalid UTF-8 raises an error for opts.strict
			const error = {name: "RangeError", message: /^Invalid (code point|UTF-8 at offset) \d+$/};
			(isValid ? assert.doesNotThrow : assert.throws)(() => utf8Encode(input, {strict: true}), error);
		}

		it("encodes valid UTF-8", () => {
			// Single characters
			encode([0x4A],                   "J", true);
			encode([0xC2, 0xA7],             "§", true);
			encode([0xE2, 0x82, 0xAC],       "€", true);
			encode([0xF0, 0x9F, 0x98, 0x82], "😂", true);
			
			// Multiple characters
			encode([0x4A, 0x6F, 0x68, 0x6E], "John", true);
			encode([0xD0, 0x94, 0xD0, 0xB6, 0xD0, 0xBE, 0xD0, 0xBD], "Джон", true);
			encode([0xE2, 0x86, 0x92, 0xE2, 0x94, 0x82, 0xCE, 0xBB], "→│λ", true);
			encode([0xF0, 0x9D, 0x91, 0xB1, 0xF0, 0x9D, 0x92, 0x90], "𝑱𝒐", true);
			encode([0xF0, 0x9D, 0x92, 0x89, 0xF0, 0x9D, 0x92, 0x8F], "𝒉𝒏", true);
		});
		
		it("encodes errors as U+FFFD", () => {
			encode([0xC0],                   "�");
			encode([0xC1],                   "�");
			encode([0xC2],                   "�");
			encode([0xA0, 0xC0],             "��");
			encode([0xC2, 0xEE],             "��");
			encode([0xC2, 0x45],             "�E");
			encode([0x45, 0xC2],             "E�");
			encode([0x41, 0xA0, 0x42],       "A�B");
			encode([0xE1, 0x45, 0xA0, 0x45], "�E�E");
			encode([0xE1, 0xA0, 0x45],       "�E");
			encode([0xE1, 0xA0, 0xC0],       "��");
			encode([0xE1, 0xA0, 0x4A],       "�J");
			encode([0xE1, 0xA0, 0xC0, 0x45], "��E");
			encode([0xF0, 0x9F, 0x98, 0x2F], "�/");
			encode([0xF0, 0x9F, 0x2F, 0x2E], "�/.");
			encode([0xF0, 0x2E, 0x2E, 0x2F], "�../");
			encode([0xF0, 0x2E, 0xE1, 0x2F], "�.�/");
		});
		
		it("isn't fooled by overlong encodings", () => {
			const overlong = (bytes, chars, expected) => {
				encode(bytes, expected);
				const error = {name: "RangeError", message: /^Invalid UTF-8 at offset \d+$/};
				assert.strictEqual          (utf8Encode(bytes, {allowOverlong: true}),  chars);
				assert.notStrictEqual       (utf8Encode(bytes, {allowOverlong: false}), chars);
				assert.throws         (() => utf8Encode(bytes, {allowOverlong: false, strict: true}), error);
				assert.doesNotThrow   (() => utf8Encode(bytes, {allowOverlong: true,  strict: true}));
			};
			overlong([0xC0, 0x80], "\0", "��");
			overlong([0xC0, 0x90], "\x10", "��");
			overlong([0xC0, 0x8D], "\r", "��");
			overlong([0xC1, 0x80], "@", "��");
			overlong([0xC1, 0x8F], "O", "��");
			overlong([0xC1, 0x90], "P", "��");
			overlong([0xC0, 0xAF, 0x2A], "/*", "��*");
			overlong([0xF0, 0x82, 0x82, 0xAC], "€", "����");
			overlong([0x2F, 0xC0, 0xAE, 0x2E, 0x2F], "/../", "/��./");
		});
		
		it("rejects surrogate halves", () => {
			const input = [0xED, 0xA0, 0x88, 0xED, 0xB0, 0xBB, 0xED, 0xA0, 0x88, 0xED, 0xB0, 0xB0];
			encode(input, "������������");
			assert.deepStrictEqual       (utf8Encode(input, {allowSurrogates: false}), "������������");
			assert.deepStrictEqual       (utf8Encode(input, {allowSurrogates: true}), "𒀻𒀰");
			assert.throws          (() => utf8Encode(input, {allowSurrogates: false, strict: true}), RangeError);
			assert.doesNotThrow    (() => utf8Encode(input, {allowSurrogates: true,  strict: true}));
		});
		
		it("retains byte-order marks", () => {
			const bom = [0xEF, 0xBB, 0xBF];
			assert.strictEqual(utf8Encode(bom,             {stripBOM: false}), "\u{FEFF}");
			assert.strictEqual(utf8Encode(bom,             {stripBOM: true}),  "");
			assert.strictEqual(utf8Encode([...bom, 0x45],  {stripBOM: false}), "\u{FEFF}E");
			assert.strictEqual(utf8Encode([...bom, 0x45],  {stripBOM: true}),  "E");
			assert.strictEqual(utf8Encode([0x45, ...bom],  {stripBOM: true}),  "E\u{FEFF}");
			assert.strictEqual(utf8Encode(bom.concat(bom), {stripBOM: true}),  "\u{FEFF}");
			assert.strictEqual(utf8Encode(bom.concat(bom), {stripBOM: false}), "\u{FEFF}".repeat(2));
		});
		
		it("returns codepoints if requested", () => {
			const input = [0xD0, 0x94, 0xD0, 0xB6, 0xD0, 0xBE, 0xD0, 0xBD];
			const codes = [0x414, 0x436, 0x43E, 0x43D];
			assert.deepStrictEqual(utf8Encode(input), "Джон");
			assert.deepStrictEqual(utf8Encode(input, {codePoints: false}), "Джон");
			assert.deepStrictEqual(utf8Encode(input, {codePoints: true}), codes);
		});
		
		it("clamps codepoints to U+10FFFF", () => {
			const input = [0xF7, 0xBD, 0xBD, 0xBD, 0xBD];
			const codes = [0xFFFD, 0xFFFD, 0xFFFD, 0xFFFD, 0xFFFD];
			encode(input, "�����");
			assert.deepStrictEqual(utf8Encode(input, {codePoints: true}), codes);
			assert.deepStrictEqual(utf8Encode(input, {codePoints: true}), codes);
			assert.deepStrictEqual(utf8Encode(input, {allowOverlong: true}), "�����");
			assert.deepStrictEqual(utf8Encode(input, {allowOverlong: true, codePoints: true}), codes);
		});
	});
	
	describe("utf16Decode()", () => {
		const {utf16Decode} = utils;
		
		it("raises an exception for invalid codepoints", () => {
			const error = {name: "RangeError", message: /^Invalid codepoint: \d+$/};
			assert.throws(() => utf16Decode([-2], error));
			assert.throws(() => utf16Decode([0x7FFFFFFF]), error);
		});
		
		it("returns an empty array for empty input", () => {
			const empty = new Uint8Array();
			assert.deepStrictEqual(utf16Decode(""), empty);
			assert.deepStrictEqual(utf16Decode([]), empty);
		});
		
		describe("Big-endian sequences", () => {
			function decode(input, expected){
				expected = new Uint8Array(expected);
				const codes = [...input].map(x => x.codePointAt(0));
				assert.deepStrictEqual(utf16Decode(input), expected);
				assert.deepStrictEqual(utf16Decode(codes), expected);
				expected = new Uint8Array([0xFE, 0xFF, ...expected]);
				assert.deepStrictEqual(utf16Decode(input, false, true), expected);
				assert.deepStrictEqual(utf16Decode(codes, false, true), expected);
			}
			
			it("decodes 8-bit characters", () => {
				decode("XYZ\0",    [0x00, 0x58, 0x00, 0x59, 0x00, 0x5A, 0x00, 0x00]);
				decode("§º\xAD\n", [0x00, 0xA7, 0x00, 0xBA, 0x00, 0xAD, 0x00, 0x0A]);
				for(let i = 0; i < 255; ++i)
					decode(String.fromCharCode(i), [0x00, i]);
			});
			
			it("decodes multibyte characters", () => {
				decode("€→│λ", [0x20, 0xAC, 0x21, 0x92, 0x25, 0x02, 0x03, 0xBB]);
				decode("Джон", [0x04, 0x14, 0x04, 0x36, 0x04, 0x3E, 0x04, 0x3D]);
			});
			
			it("decodes surrogate pairs", () => {
				decode("𐐷", [0xD8, 0x01, 0xDC, 0x37]);
				decode("😂", [0xD8, 0x3D, 0xDE, 0x02]);
				decode("𤭢", [0xD8, 0x52, 0xDF, 0x62]);
				decode("𒀭𒀰", [0xD8, 0x08, 0xDC, 0x2D, 0xD8, 0x08, 0xDC, 0x30]);
				decode("𐎅𐏏", [0xD8, 0x00, 0xDF, 0x85, 0xD8, 0x00, 0xDF, 0xCF]);
				decode("𐏉\f𐎸", [0xD8, 0x00, 0xDF, 0xC9, 0x00, 0x0C, 0xD8, 0x00, 0xDF, 0xB8]);
			});
			
			it("decodes unpaired surrogates", () => {
				decode("\u{D801}",  [0xD8, 0x01]);
				decode("\u{D801}X", [0xD8, 0x01, 0x00, 0x58]);
				decode("X\u{D801}", [0x00, 0x58, 0xD8, 0x01]);
				decode("𐐷\u{D801}", [0xD8, 0x01, 0xDC, 0x37, 0xD8, 0x01]);
				decode("\u{D801}𐐷", [0xD8, 0x01, 0xD8, 0x01, 0xDC, 0x37]);
				decode("\u{DC37}",  [0xDC, 0x37]);
				decode("\u{DC37}X", [0xDC, 0x37, 0x00, 0x58]);
				decode("X\u{DC37}", [0x00, 0x58, 0xDC, 0x37]);
				decode("𐐷\u{DC37}", [0xD8, 0x01, 0xDC, 0x37, 0xDC, 0x37]);
				decode("\u{DC37}𐐷", [0xDC, 0x37, 0xD8, 0x01, 0xDC, 0x37]);
			});
		});
		
		describe("Little-endian sequences", () => {
			function decode(input, expected){
				expected = new Uint8Array(expected);
				const codes = [...input].map(x => x.codePointAt(0));
				assert.deepStrictEqual(utf16Decode(input, true), expected);
				assert.deepStrictEqual(utf16Decode(codes, true), expected);
				expected = new Uint8Array([0xFF, 0xFE, ...expected]);
				assert.deepStrictEqual(utf16Decode(input, true, true), expected);
				assert.deepStrictEqual(utf16Decode(codes, true, true), expected);
			}
			
			it("decodes 8-bit characters", () => {
				decode("XYZ\0",    [0x58, 0x00, 0x59, 0x00, 0x5A, 0x00, 0x00, 0x00]);
				decode("§º\xAD\n", [0xA7, 0x00, 0xBA, 0x00, 0xAD, 0x00, 0x0A, 0x00]);
				for(let i = 0; i < 255; ++i)
					decode(String.fromCharCode(i), [i, 0x00]);
			});
			
			it("decodes multibyte characters", () => {
				decode("€→│λ", [0xAC, 0x20, 0x92, 0x21, 0x02, 0x25, 0xBB, 0x03]);
				decode("Джон", [0x14, 0x04, 0x36, 0x04, 0x3E, 0x04, 0x3D, 0x04]);
			});
			
			it("decodes surrogate pairs", () => {
				decode("𐐷", [0x01, 0xD8, 0x37, 0xDC]);
				decode("😂", [0x3D, 0xD8, 0x02, 0xDE]);
				decode("𤭢", [0x52, 0xD8, 0x62, 0xDF]);
				decode("𒀭𒀰", [0x08, 0xD8, 0x2D, 0xDC, 0x08, 0xD8, 0x30, 0xDC]);
				decode("𐎅𐏏", [0x00, 0xD8, 0x85, 0xDF, 0x00, 0xD8, 0xCF, 0xDF]);
				decode("𐏉\f𐎸", [0x00, 0xD8, 0xC9, 0xDF, 0x0C, 0x00, 0x00, 0xD8, 0xB8, 0xDF]);
			});
			
			it("decodes unpaired surrogates", () => {
				decode("\u{D801}",  [0x01, 0xD8]);
				decode("\u{D801}X", [0x01, 0xD8, 0x58, 0x00]);
				decode("X\u{D801}", [0x58, 0x00, 0x01, 0xD8]);
				decode("𐐷\u{D801}", [0x01, 0xD8, 0x37, 0xDC, 0x01, 0xD8]);
				decode("\u{D801}𐐷", [0x01, 0xD8, 0x01, 0xD8, 0x37, 0xDC]);
				decode("\u{DC37}",  [0x37, 0xDC]);
				decode("\u{DC37}X", [0x37, 0xDC, 0x58, 0x00]);
				decode("X\u{DC37}", [0x58, 0x00, 0x37, 0xDC]);
				decode("𐐷\u{DC37}", [0x01, 0xD8, 0x37, 0xDC, 0x37, 0xDC]);
				decode("\u{DC37}𐐷", [0x37, 0xDC, 0x01, 0xD8, 0x37, 0xDC]);
			});
		});
	});
	
	describe("utf16Encode()", () => {
		const {utf16Encode} = utils;
		
		describe("Big-endian sequences", () => {
			function encode(input, expected){
				assert.strictEqual(utf16Encode(input), expected);
				assert.strictEqual(utf16Encode(input, {endianness: "big"}), expected);
				assert.strictEqual(utf16Encode(input, {endianness: "auto"}), expected);
				
				// Assert consistency with Node.js/ICU-based implementations
				const decoder = new TextDecoder("utf-16be");
				const encoded = utf16Encode(input);
				assert.strictEqual(encoded, decoder.decode(new Uint8Array(input)));
				
				// Assert identical results with byte-order mark included
				input = [0xFE, 0xFF, ...input];
				assert.strictEqual(utf16Encode(input), expected);
				assert.strictEqual(utf16Encode(input, {endianness: "big"}), expected);
				assert.strictEqual(utf16Encode(input, {endianness: "auto"}), expected);
				assert.strictEqual(utf16Encode(input), decoder.decode(new Uint8Array(input)));
			}
			
			function unpair(input, forbidChars, forbidCodes, allowChars, allowCodes){
				encode(input, forbidChars);
				assert.deepStrictEqual(utf16Encode(input, {codePoints: true}), forbidCodes);
				assert.deepStrictEqual(utf16Encode(input, {codePoints: true, allowUnpaired: true}), allowCodes);
				assert.strictEqual(utf16Encode(input, {allowUnpaired: true}), allowChars);
			}
			
			it("encodes correctly-ordered streams", () => {
				encode([0x00, 0x58, 0x00, 0x59, 0x00, 0x5A, 0x00, 0x00], "XYZ\0");
				encode([0x00, 0xA7, 0x00, 0xBA, 0x00, 0xAD, 0x00, 0x0A], "§º\xAD\n");
				encode([0x20, 0xAC, 0x21, 0x92, 0x25, 0x02, 0x03, 0xBB], "€→│λ");
				encode([0x04, 0x14, 0x04, 0x36, 0x04, 0x3E, 0x04, 0x3D], "Джон");
			});
			
			it("encodes incorrectly-ordered streams", () => {
				encode([0x58, 0x00, 0x59, 0x00, 0x5A, 0x00, 0x00, 0x00], "堀夀娀\0");
				encode([0xA7, 0x00, 0xBA, 0x00, 0xAD, 0x00, 0x0A, 0x00], "꜀먀관਀");
				encode([0xAC, 0x20, 0x92, 0x21, 0x02, 0x25, 0xBB, 0x03], "갠鈡ȥ묃");
				encode([0x14, 0x04, 0x36, 0x04, 0x3E, 0x04, 0x3D, 0x04], "ᐄ㘄㸄㴄");
			});
			
			it("encodes surrogate pairs", () => {
				encode([0xD8, 0x01, 0xDC, 0x37], "𐐷");
				encode([0xD8, 0x3D, 0xDE, 0x02], "😂");
				encode([0xD8, 0x52, 0xDF, 0x62], "𤭢");
				encode([0xD8, 0x08, 0xDC, 0x2D, 0xD8, 0x08, 0xDC, 0x30], "𒀭𒀰");
				encode([0xD8, 0x00, 0xDF, 0x85, 0xD8, 0x00, 0xDF, 0xCF], "𐎅𐏏");
				encode([0xD8, 0x00, 0xDF, 0xC9, 0x00, 0x0C, 0xD8, 0x00, 0xDF, 0xB8], "𐏉\f𐎸");
				const snark = "This file uses too many bytes. 😂\n";
				expect(utf16Encode(file("encoding/utf16be-bom.txt"))).to.equal(snark);
				expect(utf16Encode(file("encoding/utf16be.txt")))    .to.equal(snark);
			});
			
			it("returns codepoints if requested", () => {
				const input = [0xD8, 0x08, 0xDC, 0x2D, 0xD8, 0x08, 0xDC, 0x30, 0x03, 0xBB];
				const codes = [0x1202D, 0x12030, 0x3BB];
				for(let i = 0; i < 2; ++i){
					assert.deepStrictEqual(utf16Encode(input, {codePoints: true}), codes);
					assert.deepStrictEqual(utf16Encode(input, {codePoints: true, endianness: "big"}), codes);
					assert.deepStrictEqual(utf16Encode(input, {codePoints: true, endianness: "auto"}), codes);
					input.unshift(0xFE, 0xFF);
				}
			});
			
			it("rejects unpaired high surrogates", () => {
				unpair([0xD8, 0x01],                         "�",  [0xFFFD],          "\u{D801}",  [0xD801]);
				unpair([0xD8, 0x01, 0x00, 0x58],             "�X", [0xFFFD, 0x58],    "\u{D801}X", [0xD801, 0x58]);
				unpair([0x00, 0x58, 0xD8, 0x01],             "X�", [0x58, 0xFFFD],    "X\u{D801}", [0x58, 0xD801]);
				unpair([0xD8, 0x01, 0xDC, 0x37, 0xD8, 0x01], "𐐷�", [0x10437, 0xFFFD], "𐐷\u{D801}", [0x10437, 0xD801]);
				unpair([0xD8, 0x01, 0xD8, 0x01, 0xDC, 0x37], "�𐐷", [0xFFFD, 0x10437], "\u{D801}𐐷", [0xD801, 0x10437]);
				encode([0xD8, 0x01, 0xD8, 0x01, 0xDC, 0x37, 0x00, 0x58], "�𐐷X");
				encode([0xD8, 0x01, 0xDC, 0x37, 0xD8, 0x01, 0x00, 0x58], "𐐷�X");
			});
			
			it("rejects unpaired low surrogates", () => {
				unpair([0xDC, 0x37],                         "�",  [0xFFFD],          "\u{DC37}",  [0xDC37]);
				unpair([0xDC, 0x37, 0x00, 0x58],             "�X", [0xFFFD, 0x58],    "\u{DC37}X", [0xDC37, 0x58]);
				unpair([0x00, 0x58, 0xDC, 0x37],             "X�", [0x58, 0xFFFD],    "X\u{DC37}", [0x58, 0xDC37]);
				unpair([0xD8, 0x01, 0xDC, 0x37, 0xDC, 0x37], "𐐷�", [0x10437, 0xFFFD], "𐐷\u{DC37}", [0x10437, 0xDC37]);
				unpair([0xDC, 0x37, 0xD8, 0x01, 0xDC, 0x37], "�𐐷", [0xFFFD, 0x10437], "\u{DC37}𐐷", [0xDC37, 0x10437]);
				encode([0xDC, 0x37, 0xD8, 0x01, 0xDC, 0x37, 0x00, 0x58], "�𐐷X");
				encode([0xD8, 0x01, 0xDC, 0x37, 0xDC, 0x37, 0x00, 0x58], "𐐷�X");
			});
			
			it("rejects incomplete code-units", () => {
				encode([], "");
				encode([0x00], "�");
				encode([0xD8], "�");
				encode([0x00, 0x58, 0x00], "X�");
				encode([0x00, 0x58, 0xD8], "X�");
				encode([0x00, 0x58, 0xDC], "X�");
				encode([0xD8, 0x01, 0xDC], "�");
				unpair([],                 "",   [],             "",          []);
				unpair([0x00],             "�",  [0xFFFD],       "�",         [0xFFFD]);
				unpair([0xD8],             "�",  [0xFFFD],       "�",         [0xFFFD]);
				unpair([0x00, 0x58, 0x00], "X�", [0x58, 0xFFFD], "X�",        [0x58, 0xFFFD]);
				unpair([0x00, 0x58, 0xD8], "X�", [0x58, 0xFFFD], "X�",        [0x58, 0xFFFD]);
				unpair([0x00, 0x58, 0xDC], "X�", [0x58, 0xFFFD], "X�",        [0x58, 0xFFFD]);
				unpair([0xD8, 0x01, 0xDC], "�",  [0xFFFD],       "\u{D801}�", [0xD801, 0xFFFD]);
			});
		});
		
		describe("Little-endian sequences", () => {
			function encode(input, expected){
				const result = utf16Encode(input, {endianness: "little"});
				assert.strictEqual(result, expected);
				
				// Assert consistency with Node.js/ICU-based implementations
				const decoder = new TextDecoder("utf-16le");
				assert.strictEqual(result, decoder.decode(new Uint8Array(input)));
				
				input = [0xFF, 0xFE, ...input];
				assert.strictEqual(utf16Encode(input), expected);
				assert.strictEqual(utf16Encode(input, {endianness: "auto"}), expected);
				assert.strictEqual(utf16Encode(input, {endianness: "little"}), expected);
				assert.strictEqual(utf16Encode(input), decoder.decode(new Uint8Array(input)));
			}
			
			function unpair(input, forbidChars, forbidCodes, allowChars, allowCodes){
				encode(input, forbidChars);
				const opts = {endianness: "little", codePoints: true};
				assert.deepStrictEqual(utf16Encode(input, opts), forbidCodes);
				assert.deepStrictEqual(utf16Encode(input, {...opts, allowUnpaired: true}), allowCodes);
				assert.strictEqual(utf16Encode(input, {endianness: "little", allowUnpaired: true}), allowChars);
			}
			
			it("encodes correctly-ordered streams", () => {
				encode([0x58, 0x00, 0x59, 0x00, 0x5A, 0x00, 0x00, 0x00], "XYZ\0");
				encode([0xA7, 0x00, 0xBA, 0x00, 0xAD, 0x00, 0x0A, 0x00], "§º\xAD\n");
				encode([0xAC, 0x20, 0x92, 0x21, 0x02, 0x25, 0xBB, 0x03], "€→│λ");
				encode([0x14, 0x04, 0x36, 0x04, 0x3E, 0x04, 0x3D, 0x04], "Джон");
			});
			
			it("encodes incorrectly-ordered streams", () => {
				encode([0x00, 0x58, 0x00, 0x59, 0x00, 0x5A, 0x00, 0x00], "堀夀娀\0");
				encode([0x00, 0xA7, 0x00, 0xBA, 0x00, 0xAD, 0x00, 0x0A], "꜀먀관਀");
				encode([0x20, 0xAC, 0x21, 0x92, 0x25, 0x02, 0x03, 0xBB], "갠鈡ȥ묃");
				encode([0x04, 0x14, 0x04, 0x36, 0x04, 0x3E, 0x04, 0x3D], "ᐄ㘄㸄㴄");
			});
			
			it("encodes surrogate pairs", () => {
				encode([0x01, 0xD8, 0x37, 0xDC], "𐐷");
				encode([0x3D, 0xD8, 0x02, 0xDE], "😂");
				encode([0x52, 0xD8, 0x62, 0xDF], "𤭢");
				encode([0x08, 0xD8, 0x2D, 0xDC, 0x08, 0xD8, 0x30, 0xDC], "𒀭𒀰");
				encode([0x00, 0xD8, 0x85, 0xDF, 0x00, 0xD8, 0xCF, 0xDF], "𐎅𐏏");
				encode([0x00, 0xD8, 0xC9, 0xDF, 0x0C, 0x00, 0x00, 0xD8, 0xB8, 0xDF], "𐏉\f𐎸");
				const krans = "sihT elif sesu oot ynam setyb. 😂\n";
				expect(utf16Encode(file("encoding/utf16le-bom.txt"), {endianness: "little"})).to.equal(krans);
				expect(utf16Encode(file("encoding/utf16le.txt"),     {endianness: "little"})).to.equal(krans);
			});
			
			it("returns codepoints if requested", () => {
				const input = [0x08, 0xD8, 0x2D, 0xDC, 0x08, 0xD8, 0x30, 0xDC, 0xBB, 0x03];
				const codes = [0x1202D, 0x12030, 0x3BB];
				assert.deepStrictEqual(utf16Encode(input, {codePoints: true, endianness: "little"}), codes);
				input.unshift(0xFF, 0xFE);
				assert.deepStrictEqual(utf16Encode(input, {codePoints: true, endianness: "auto"}), codes);
				assert.deepStrictEqual(utf16Encode(input, {codePoints: true, endianness: "little"}), codes);
			});
			
			it("rejects unpaired high surrogates", () => {
				unpair([0x01, 0xD8],                         "�",  [0xFFFD],          "\u{D801}",  [0xD801]);
				unpair([0x01, 0xD8, 0x58, 0x00],             "�X", [0xFFFD, 0x58],    "\u{D801}X", [0xD801, 0x58]);
				unpair([0x58, 0x00, 0x01, 0xD8],             "X�", [0x58, 0xFFFD],    "X\u{D801}", [0x58, 0xD801]);
				unpair([0x01, 0xD8, 0x37, 0xDC, 0x01, 0xD8], "𐐷�", [0x10437, 0xFFFD], "𐐷\u{D801}", [0x10437, 0xD801]);
				unpair([0x01, 0xD8, 0x01, 0xD8, 0x37, 0xDC], "�𐐷", [0xFFFD, 0x10437], "\u{D801}𐐷", [0xD801, 0x10437]);
				encode([0x01, 0xD8, 0x01, 0xD8, 0x37, 0xDC, 0x58, 0x00], "�𐐷X");
				encode([0x01, 0xD8, 0x37, 0xDC, 0x01, 0xD8, 0x58, 0x00], "𐐷�X");
			});
			
			it("rejects unpaired low surrogates", () => {
				unpair([0x37, 0xDC],                         "�",  [0xFFFD],          "\u{DC37}",  [0xDC37]);
				unpair([0x37, 0xDC, 0x58, 0x00],             "�X", [0xFFFD, 0x58],    "\u{DC37}X", [0xDC37, 0x58]);
				unpair([0x58, 0x00, 0x37, 0xDC],             "X�", [0x58, 0xFFFD],    "X\u{DC37}", [0x58, 0xDC37]);
				unpair([0x01, 0xD8, 0x37, 0xDC, 0x37, 0xDC], "𐐷�", [0x10437, 0xFFFD], "𐐷\u{DC37}", [0x10437, 0xDC37]);
				unpair([0x37, 0xDC, 0x01, 0xD8, 0x37, 0xDC], "�𐐷", [0xFFFD, 0x10437], "\u{DC37}𐐷", [0xDC37, 0x10437]);
				encode([0x37, 0xDC, 0x01, 0xD8, 0x37, 0xDC, 0x58, 0x00], "�𐐷X");
				encode([0x01, 0xD8, 0x37, 0xDC, 0x37, 0xDC, 0x58, 0x00], "𐐷�X");
			});
			
			it("rejects incomplete code-units", () => {
				encode([], "");
				encode([0x00], "�");
				encode([0xD8], "�");
				encode([0x58, 0x00, 0x00], "X�");
				encode([0x58, 0x00, 0xD8], "X�");
				encode([0x58, 0x00, 0xDC], "X�");
				encode([0x01, 0xD8, 0xDC], "�");
				unpair([],                 "",   [],             "",          []);
				unpair([0x00],             "�",  [0xFFFD],       "�",         [0xFFFD]);
				unpair([0xD8],             "�",  [0xFFFD],       "�",         [0xFFFD]);
				unpair([0x58, 0x00, 0x00], "X�", [0x58, 0xFFFD], "X�",        [0x58, 0xFFFD]);
				unpair([0x58, 0x00, 0xD8], "X�", [0x58, 0xFFFD], "X�",        [0x58, 0xFFFD]);
				unpair([0x58, 0x00, 0xDC], "X�", [0x58, 0xFFFD], "X�",        [0x58, 0xFFFD]);
				unpair([0x01, 0xD8, 0xDC], "�",  [0xFFFD],       "\u{D801}�", [0xD801, 0xFFFD]);
			});
		});
	});
	
	describe("utf32Decode()", () => {
		const {utf32Decode} = utils;
		
		it("raises an exception for invalid codepoints", () => {
			const error = {name: "RangeError", message: /^Invalid codepoint: \d+$/};
			assert.throws(() => utf32Decode([-2], error));
			assert.throws(() => utf32Decode([0x7FFFFFFF]), error);
		});
		
		it("returns an empty array for empty input", () => {
			const empty = new Uint8Array();
			assert.deepStrictEqual(utf32Decode(""), empty);
			assert.deepStrictEqual(utf32Decode([]), empty);
		});
		
		describe("Big-endian sequences", () => {
			function decode(input, expected){
				expected = new Uint8Array(expected);
				const codes = [...input].map(x => x.codePointAt(0));
				assert.deepStrictEqual(utf32Decode(input), expected);
				assert.deepStrictEqual(utf32Decode(codes), expected);
				expected = new Uint8Array([0, 0, 0xFE, 0xFF, ...expected]);
				assert.deepStrictEqual(utf32Decode(input, false, true), expected);
				assert.deepStrictEqual(utf32Decode(codes, false, true), expected);
			}
			
			it("decodes 8-bit characters", () => {
				decode("XYZ\0",    [0, 0, 0, 0x58, 0, 0, 0, 0x59, 0, 0, 0, 0x5A, 0, 0, 0, 0x00]);
				decode("§º\xAD\n", [0, 0, 0, 0xA7, 0, 0, 0, 0xBA, 0, 0, 0, 0xAD, 0, 0, 0, 0x0A]);
				for(let i = 0; i < 255; ++i)
					decode(String.fromCharCode(i), [0, 0, 0, i]);
			});
			
			it("decodes multibyte characters", () => {
				decode("€→│λ", [0, 0, 0x20, 0xAC, 0, 0, 0x21, 0x92, 0, 0, 0x25, 0x02, 0, 0, 0x03, 0xBB]);
				decode("Джон", [0, 0, 0x04, 0x14, 0, 0, 0x04, 0x36, 0, 0, 0x04, 0x3E, 0, 0, 0x04, 0x3D]);
				decode("𐐷", [0, 0x01, 0x04, 0x37]);
				decode("😂", [0, 0x01, 0xF6, 0x02]);
				decode("𤭢", [0, 0x02, 0x4B, 0x62]);
				decode("𒀭𒀰", [0, 0x01, 0x20, 0x2D, 0, 0x01, 0x20, 0x30]);
				decode("𐎅𐏏", [0, 0x01, 0x03, 0x85, 0, 0x01, 0x03, 0xCF]);
				decode("𐏉\f𐎸", [0, 0x01, 0x03, 0xC9, 0, 0, 0, 0x0C, 0, 0x01, 0x03, 0xB8]);
			});
			
			it("decodes unpaired surrogates", () => {
				decode("\u{D801}",  [0, 0, 0xD8, 0x01]);
				decode("\u{D801}X", [0, 0, 0xD8, 0x01, 0, 0, 0, 0x58]);
				decode("X\u{D801}", [0, 0, 0, 0x58, 0, 0, 0xD8, 0x01]);
				decode("𐐷\u{D801}", [0, 0x01, 0x04, 0x37, 0, 0, 0xD8, 0x01]);
				decode("\u{D801}𐐷", [0, 0, 0xD8, 0x01, 0, 0x01, 0x04, 0x37]);
				decode("\u{DC37}",  [0, 0, 0xDC, 0x37]);
				decode("\u{DC37}X", [0, 0, 0xDC, 0x37, 0, 0, 0, 0x58]);
				decode("X\u{DC37}", [0, 0, 0, 0x58, 0, 0, 0xDC, 0x37]);
				decode("𐐷\u{DC37}", [0, 0x01, 0x04, 0x37, 0, 0, 0xDC, 0x37]);
				decode("\u{DC37}𐐷", [0, 0, 0xDC, 0x37, 0, 0x01, 0x04, 0x37]);
			});
		});
		
		describe("Little-endian sequences", () => {
			function decode(input, expected){
				expected = new Uint8Array(expected);
				const codes = [...input].map(x => x.codePointAt(0));
				assert.deepStrictEqual(utf32Decode(input, true), expected);
				assert.deepStrictEqual(utf32Decode(codes, true), expected);
				expected = new Uint8Array([0xFF, 0xFE, 0, 0, ...expected]);
				assert.deepStrictEqual(utf32Decode(input, true, true), expected);
				assert.deepStrictEqual(utf32Decode(codes, true, true), expected);
			}
			
			it("decodes 8-bit characters", () => {
				decode("XYZ\0",    [0x58, 0, 0, 0, 0x59, 0, 0, 0, 0x5A, 0, 0, 0, 0x00, 0, 0, 0]);
				decode("§º\xAD\n", [0xA7, 0, 0, 0, 0xBA, 0, 0, 0, 0xAD, 0, 0, 0, 0x0A, 0, 0, 0]);
				for(let i = 0; i < 255; ++i)
					decode(String.fromCharCode(i), [i, 0, 0, 0]);
			});
			
			it("decodes multibyte characters", () => {
				decode("€→│λ", [0xAC, 0x20, 0, 0, 0x92, 0x21, 0, 0, 0x02, 0x25, 0, 0, 0xBB, 0x03, 0, 0]);
				decode("Джон", [0x14, 0x04, 0, 0, 0x36, 0x04, 0, 0, 0x3E, 0x04, 0, 0, 0x3D, 0x04, 0, 0]);
				decode("𐐷", [0x37, 0x04, 0x01, 0]);
				decode("😂", [0x02, 0xF6, 0x01, 0]);
				decode("𤭢", [0x62, 0x4B, 0x02, 0]);
				decode("𒀭𒀰", [0x2D, 0x20, 0x01, 0, 0x30, 0x20, 0x01, 0]);
				decode("𐎅𐏏", [0x85, 0x03, 0x01, 0, 0xCF, 0x03, 0x01, 0]);
				decode("𐏉\f𐎸", [0xC9, 0x03, 0x01, 0, 0x0C, 0, 0, 0, 0xB8, 0x03, 0x01, 0]);
			});
			
			it("decodes unpaired surrogates", () => {
				decode("\u{D801}",  [0x01, 0xD8, 0, 0]);
				decode("\u{D801}X", [0x01, 0xD8, 0, 0, 0x58, 0, 0, 0]);
				decode("X\u{D801}", [0x58, 0, 0, 0, 0x01, 0xD8, 0, 0]);
				decode("𐐷\u{D801}", [0x37, 0x04, 0x01, 0, 0x01, 0xD8, 0, 0]);
				decode("\u{D801}𐐷", [0x01, 0xD8, 0, 0, 0x37, 0x04, 0x01, 0]);
				decode("\u{DC37}",  [0x37, 0xDC, 0, 0]);
				decode("\u{DC37}X", [0x37, 0xDC, 0, 0, 0x58, 0, 0, 0]);
				decode("X\u{DC37}", [0x58, 0, 0, 0, 0x37, 0xDC, 0, 0]);
				decode("𐐷\u{DC37}", [0x37, 0x04, 0x01, 0, 0x37, 0xDC, 0, 0]);
				decode("\u{DC37}𐐷", [0x37, 0xDC, 0, 0, 0x37, 0x04, 0x01, 0]);
			});
		});
	});
	
	describe("utf32Encode()", () => {
		const {utf32Encode} = utils;
		const toHex = x => x.map(x => x.toString(16).padStart(2, "0").toUpperCase()).join(" ");
		it("encodes big-endian sequences", () => {
			const encode = (input, expected) => {
				for(let i = 0; i < 2; ++i){
					let message = `Expected <${toHex(input)}> to be encoded as "${expected}"`;
					assert.deepStrictEqual(utf32Encode(input), expected, message);
					assert.deepStrictEqual(utf32Encode(input, {endianness: "big"}), expected, message);
					assert.deepStrictEqual(utf32Encode(input, {endianness: "auto"}), expected, message);
					
					const codes = [...expected].map(x => x.codePointAt(0));
					message = `Expected <${toHex(input)}> to be encoded as <${toHex(codes)}>`;
					assert.deepStrictEqual(utf32Encode(input, {codePoints: true}), codes, message);
					assert.deepStrictEqual(utf32Encode(input, {codePoints: true, endianness: "big"}), codes, message);
					assert.deepStrictEqual(utf32Encode(input, {codePoints: true, endianness: "auto"}), codes, message);
					input = [0x00, 0x00, 0xFE, 0xFF, ...input];
				}
			};
			for(let i = 0; i < 255; ++i)
				encode([0x00, 0x00, 0x00, i], String.fromCodePoint(i));
			encode([0x00, 0x00, 0x20, 0xAC], "€");
			const name = [
				0x00, 0x00, 0x00, 0x4A,
				0x00, 0x00, 0x00, 0x6F,
				0x00, 0x00, 0x00, 0x68,
				0x00, 0x00, 0x00, 0x6E,
			];
			const symbols = [
				0x00, 0x00, 0x20, 0xAC,
				0x00, 0x00, 0x21, 0x92,
				0x00, 0x00, 0x25, 0x02,
				0x00, 0x00, 0x03, 0xBB,
			];
			const astrals = [
				0x00, 0x01, 0x04, 0x37,
				0x00, 0x01, 0xF6, 0x02,
				0x00, 0x02, 0x4B, 0x62,
				0x00, 0x01, 0x03, 0xCF,
			];
			encode(name, "John");
			encode(symbols, "€→│λ");
			encode(astrals, "𐐷😂𤭢𐏏");
			encode([...name, ...symbols], "John€→│λ");
			encode([...name, ...astrals], "John𐐷😂𤭢𐏏");
			encode([...name, ...astrals, ...symbols], "John𐐷😂𤭢𐏏€→│λ");
			const ssnnaarrkk = "This file uses WAY too many bytes. 😂\n";
			expect(utf32Encode(file("encoding/utf32be-bom.txt"))).to.equal(ssnnaarrkk);
			expect(utf32Encode(file("encoding/utf32be.txt")))    .to.equal(ssnnaarrkk);
		});
		
		it("encodes little-endian sequences", () => {
			const encode = (input, expected) => {
				let message = `Expected <${toHex(input)}> to be encoded as "${expected}"`;
				assert.deepStrictEqual(utf32Encode(input, {endianness: "little"}), expected, message);
				
				input   = [0xFF, 0xFE, 0x00, 0x00, ...input];
				message = `Expected <${toHex(input)}> to be encoded as "${expected}"`;
				assert.deepStrictEqual(utf32Encode(input), expected, message);
				assert.deepStrictEqual(utf32Encode(input, {endianness: "auto"}), expected, message);
				assert.deepStrictEqual(utf32Encode(input, {endianness: "little"}), expected, message);
			};
			for(let i = 0; i < 255; ++i)
				encode([i, 0x00, 0x00, 0x00], String.fromCodePoint(i));
			encode([0xAC, 0x20, 0x00, 0x00], "€");
			const name = [
				0x4A, 0x00, 0x00, 0x00,
				0x6F, 0x00, 0x00, 0x00,
				0x68, 0x00, 0x00, 0x00,
				0x6E, 0x00, 0x00, 0x00,
			];
			const symbols = [
				0xAC, 0x20, 0x00, 0x00,
				0x92, 0x21, 0x00, 0x00,
				0x02, 0x25, 0x00, 0x00,
				0xBB, 0x03, 0x00, 0x00,
			];
			const astrals = [
				0x37, 0x04, 0x01, 0x00,
				0x02, 0xF6, 0x01, 0x00,
				0x62, 0x4B, 0x02, 0x00,
				0xCF, 0x03, 0x01, 0x00,
			];
			encode(name, "John");
			encode(symbols, "€→│λ");
			encode(astrals, "𐐷😂𤭢𐏏");
			encode([...name, ...symbols], "John€→│λ");
			encode([...name, ...astrals], "John𐐷😂𤭢𐏏");
			encode([...name, ...astrals, ...symbols], "John𐐷😂𤭢𐏏€→│λ");
			const kkrraannss = "sihT elif sesu YAW oot ynam setyb. 😂\n";
			expect(utf32Encode(file("encoding/utf32le-bom.txt"), {endianness: "auto"}))  .to.equal(kkrraannss);
			expect(utf32Encode(file("encoding/utf32le.txt"),     {endianness: "little"})).to.equal(kkrraannss);
		});
		
		it("encodes incomplete code-units as U+FFFD", () => {
			assert.deepStrictEqual(utf32Encode([0, 0, 0x20]), "�");
			assert.deepStrictEqual(utf32Encode([0, 0, 0x20, 0xAC, 0]), "€�");
			const opts = {endianness: "little"};
			assert.deepStrictEqual(utf32Encode([0xAC, 0x20, 0], opts), "�");
			assert.deepStrictEqual(utf32Encode([0xAC, 0x20, 0, 0, 0], opts), "€�");
		});
	});
	
	describe("vlqDecode() / vlqEncode()", () => {
		const {vlqDecode, vlqEncode} = utils;
		it("decodes positive quantities", () => {
			expect(vlqDecode("AAAA")).to.eql([0, 0, 0, 0]);
			expect(vlqDecode("IGAM")).to.eql([4, 3, 0, 6]);
			expect(vlqDecode("8Egkh9BwM8EA")).to.eql([78, 1000000, 200, 78, 0]);
		});
		it("decodes negative quantities", () => {
			expect(vlqDecode("7C")).to.eql([-45]);
			expect(vlqDecode("7CA")).to.eql([-45, 0]);
			expect(vlqDecode("/wT")).to.eql([-9999]);
			expect(vlqDecode("h9ub")).to.eql([-450000]);
			expect(vlqDecode("B")).to.eql([-0x80000000]);
		});
		it("encodes positive quantities", () => {
			expect(vlqEncode(0)).to.equal("A");
			expect(vlqEncode(0x1FFFFF)).to.equal("+///D");
		});
		it("encodes negative quantities", () => {
			expect(vlqEncode(-45)).to.equal("7C");
			expect(vlqEncode(-9999)).to.equal("/wT");
			expect(vlqEncode(-450000)).to.equal("h9ub");
			expect(vlqEncode(-0x80000000)).to.equal("B");
		});
		it("throws an exception for invalid base64", () => {
			expect(() => vlqDecode("?")).to.throw(Error, "Bad character: ?");
			expect(() => vlqDecode("A~")).to.throw(Error, "Bad character: ~");
		});
	});
	
	describe("wsDecodeFrame()", () => {
		const {wsDecodeFrame} = utils;
		it("decodes single-frame unmasked text messages", () => {
			const input = [0x81, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    null,
				opcode:  1,
				opname:  "text",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
		});
		it("decodes single-frame masked text messages", () => {
			const input = [0x81, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58];
			const masked = [0x7F, 0x9F, 0x4D, 0x51, 0x58];
			const unmasked = [0x48, 0x65, 0x6C, 0x6C, 0x6F];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    0x37FA213D,
				opcode:  1,
				opname:  "text",
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql({...frame, payload: unmasked});
			expect(wsDecodeFrame(input, true)).to.eql({...frame, payload: masked});
		});
		it("decodes unmasked ping requests", () => {
			const input = [0x89, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    null,
				opcode:  9,
				opname:  "ping",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
		});
		it("decodes masked ping responses", () => {
			const input = [0x8A, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58];
			const masked = [0x7F, 0x9F, 0x4D, 0x51, 0x58];
			const unmasked = [0x48, 0x65, 0x6C, 0x6C, 0x6F];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    0x37FA213D,
				opcode:  10,
				opname:  "pong",
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql({...frame, payload: unmasked});
			expect(wsDecodeFrame(input, true)).to.eql({...frame, payload: masked});
		});
		it("decodes 256-byte unmasked binary messages", () => {
			const bytes = new Array(256).fill(0xFF);
			const input = [0x82, 0x7E, 0x01, 0x00, ...bytes];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  256n,
				mask:    null,
				opcode:  2,
				opname:  "binary",
				payload: bytes,
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
		});
		it("decodes 64-KiB unmasked binary messages", () => {
			const bytes = new Array(65536).fill(0xFF);
			const input = [0x82, 0x7F, 0, 0, 0, 0, 0, 1, 0, 0, ...bytes];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  65536n,
				mask:    null,
				opcode:  2,
				opname:  "binary",
				payload: bytes,
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
		});
		it("decodes fragmented unmasked text messages", () => {
			let input = [0x01, 0x03, 0x48, 0x65, 0x6C];
			let frame = {
				isFinal: false,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				mask:    null,
				length:  3n,
				opcode:  1,
				opname:  "text",
				payload: [0x48, 0x65, 0x6C],
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
			input = [0x80, 0x02, 0x6C, 0x6F];
			frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  2n,
				mask:    null,
				opcode:  0,
				opname:  "continue",
				payload: [0x6C, 0x6F],
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
		});
		it("decodes messages with “reserved” opcodes", () => {
			const input = [0x83, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    null,
				opcode:  3,
				opname:  "reserved",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
		});
		it("decodes messages with “reserved” flags", () => {
			const input = [0xF9, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F];
			const frame = {
				isFinal: true,
				isRSV1:  true,
				isRSV2:  true,
				isRSV3:  true,
				length:  5n,
				mask:    null,
				opcode:  9,
				opname:  "ping",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
				trailer: [],
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
		});
		it("decodes messages with excess bytes", () => {
			const input = [0x81, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58];
			const masked = [0x7F, 0x9F, 0x4D, 0x51, 0x58];
			const unmasked = [0x48, 0x65, 0x6C, 0x6C, 0x6F];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    0x37FA213D,
				opcode:  1,
				opname:  "text",
				trailer: [0x11, 0x22, 0x33, 0x44, 0x55, 0x66],
			};
			input.push(...frame.trailer);
			for(let i = 0; i < 2; ++i){
				expect(wsDecodeFrame(input)).to.eql({...frame, payload: unmasked});
				expect(wsDecodeFrame(input, true)).to.eql({...frame, payload: masked});
				frame.trailer.push(...input);
				input.push(...input);
			}
		});
		it("decodes messages of insufficient length", () => {
			const input = [0x81, 0x8A, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58];
			const masked = [0x7F, 0x9F, 0x4D, 0x51, 0x58];
			const unmasked = [0x48, 0x65, 0x6C, 0x6C, 0x6F];
			const frame = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  10n,
				mask:    0x37FA213D,
				opcode:  1,
				opname:  "text",
				trailer: [],
			};
			for(let i = 0; i < 2; ++i){
				expect(wsDecodeFrame(input)).to.eql({...frame, payload: unmasked});
				expect(wsDecodeFrame(input, true)).to.eql({...frame, payload: masked});
				frame.length = 15n;
				input[1] = 0x8F;
			}
		});
	});
	
	describe("wsEncodeFrame()", () => {
		const {wsEncodeFrame} = utils;
		it("encodes single-frame unmasked text messages", () => {
			const frame = new Uint8Array([0x81, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
			const input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    null,
				opcode:  1,
				opname:  "text",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			expect(wsEncodeFrame(input, true)).to.eql(frame);
		});
		it("encodes single-frame masked text messages", () => {
			const frame = new Uint8Array([0x81, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58]);
			const input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    0x37FA213D,
				opcode:  1,
				opname:  "text",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			input.payload = [0x7F, 0x9F, 0x4D, 0x51, 0x58];
			expect(wsEncodeFrame(input, true)).to.eql(frame);
		});
		it("encodes unmasked ping requests", () => {
			const frame = new Uint8Array([0x89, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
			const input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    null,
				opcode:  9,
				opname:  "ping",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			expect(wsEncodeFrame(input, true)).to.eql(frame);
		});
		it("encodes masked ping responses", () => {
			const frame = new Uint8Array([0x8A, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58]);
			const input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    0x37FA213D,
				opcode:  10,
				opname:  "pong",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
			};
			expect(wsEncodeFrame({...input})).to.eql(frame);
			input.payload = [0x7F, 0x9F, 0x4D, 0x51, 0x58];
			expect(wsEncodeFrame({...input}, true)).to.eql(frame);
		});
		it("encodes 256-byte unmasked binary messages", () => {
			const bytes = new Array(256).fill(0xFF);
			const frame = new Uint8Array([0x82, 0x7E, 0x01, 0x00, ...bytes]);
			const input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  256n,
				mask:    null,
				opcode:  2,
				opname:  "binary",
				payload: bytes,
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			expect(wsEncodeFrame(input, true)).to.eql(frame);
		});
		it("encodes 64-KiB unmasked binary messages", () => {
			const bytes = new Array(65536).fill(0xFF);
			const frame = new Uint8Array([0x82, 0x7F, 0, 0, 0, 0, 0, 1, 0, 0, ...bytes]);
			const input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  65536n,
				mask:    null,
				opcode:  2,
				opname:  "binary",
				payload: bytes,
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			expect(wsEncodeFrame(input, true)).to.eql(frame);
		});
		it("encodes fragmented unmasked text messages", () => {
			let frame = new Uint8Array([0x01, 0x03, 0x48, 0x65, 0x6C]);
			let input = {
				isFinal: false,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				mask:    null,
				length:  3n,
				opcode:  1,
				opname:  "text",
				payload: [0x48, 0x65, 0x6C],
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			expect(wsEncodeFrame(input, true)).to.eql(frame);
			frame = new Uint8Array([0x80, 0x02, 0x6C, 0x6F]);
			input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  2n,
				mask:    null,
				opcode:  0,
				opname:  "continue",
				payload: [0x6C, 0x6F],
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			expect(wsEncodeFrame(input, true)).to.eql(frame);
		});
		it("encodes messages with “reserved” opcodes", () => {
			const frame = new Uint8Array([0x83, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
			const input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    null,
				opcode:  3,
				opname:  "reserved",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			expect(wsEncodeFrame(input, true)).to.eql(frame);
		});
		it("encodes messages with “reserved” flags", () => {
			const frame = new Uint8Array([0xF9, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F]);
			const input = {
				isFinal: true,
				isRSV1:  true,
				isRSV2:  true,
				isRSV3:  true,
				length:  5n,
				mask:    null,
				opcode:  9,
				opname:  "ping",
				payload: [0x48, 0x65, 0x6C, 0x6C, 0x6F],
			};
			expect(wsEncodeFrame(input)).to.eql(frame);
			expect(wsEncodeFrame(input, true)).to.eql(frame);
		});
		it("throws an error for oversized payloads", () => {
			const input = {
				isFinal: true,
				isRSV1:  false,
				isRSV2:  false,
				isRSV3:  false,
				length:  5n,
				mask:    0x37FA213D,
				opcode:  1,
				opname:  "text",
				payload: {...[0x48, 0x65, 0x6C, 0x6C, 0x6F]},
			};
			Object.defineProperty(input.payload, "length", {get: () => Number(0xFFFFFFFFFFFFFFFFn + 1n)});
			expect(() => wsEncodeFrame(input)).to.throw(RangeError, /^Payload too large$/);
		});
	});

	describe("wsHandshake()", () => {
		const {wsHandshake} = utils;
		it("generates headers from client-submitted keys", () =>
			expect(wsHandshake("dGhlIHNhbXBsZSBub25jZQ==")).to.equal("s3pPLMBiTxaQ9kYGzzhZRbK+xOo="));
		it("generates headers from empty strings", () =>
			expect(wsHandshake("")).to.equal("Kfh9QIsMVZcl6xEPYxPHzW8SZ8w="));
	});
});
