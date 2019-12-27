import {readFileSync}  from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import * as utils      from "../index.mjs";

describe("Byte-level functions", () => {
	const dir  = dirname(fileURLToPath(import.meta.url));
	const file = path => readFileSync(join(dir, "fixtures", ...path.split("/")), {encoding: "binary"});
	
	describe("adler32()", () => {
		const {adler32} = utils;
		it("computes checksums of string values", () => {
			expect(adler32("foo-bar")).to.equal(0xAA402A7);
			expect(adler32("Wikipedia")).to.equal(0x11E60398);
		});
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
	
	// Byte-arrays shared by base64-related functions
	const bytesFoo  = [0x46, 0x6F, 0x6F, 0x42, 0x61, 0x72];
	const bytesCafe = [0x63, 0xE1, 0x66, 0xE9, 0x62, 0xE1, 0x62, 0xE9];
	const bytesRaw  = [0x89, 0x01, 0x00, 0x8F, 0xFF, 0xFE, 0x00];
	const stringRaw = "\x89\x01\0\x8F\xFF\xFE\0";
	
	describe("base64Decode()", () => {
		const {base64Decode} = utils;
		it("decodes 7-bit ASCII strings",    () => expect(base64Decode("Rm9vQmFy")).to.equal("FooBar"));
		it("decodes 7-bit ASCII bytes",      () => expect(base64Decode("Rm9vQmFy", true)).to.eql(bytesFoo));
		it("decodes extended ASCII strings", () => expect(base64Decode("Y+Fm6WLhYuk=")).to.equal("cáfébábé"));
		it("decodes extended ASCII bytes",   () => expect(base64Decode("Y+Fm6WLhYuk=", true)).to.eql(bytesCafe));
		it("decodes raw binary strings",     () => expect(base64Decode("iQEAj//+AA==")).to.equal(stringRaw));
		it("decodes raw binary bytes",       () => expect(base64Decode("iQEAj//+AA==", true)).to.eql(bytesRaw));
		it("decodes UTF-8 as Latin-1",       () => expect(base64Decode("Y8OhZsOpYsOhYsOp")).to.equal("cÃ¡fÃ©bÃ¡bÃ©"));
	});
	
	describe("base64Encode()", () => {
		const {base64Encode} = utils;
		it("encodes 7-bit ASCII strings",    () => expect(base64Encode("FooBar")).to.equal("Rm9vQmFy"));
		it("encodes 7-bit ASCII bytes",      () => expect(base64Encode(bytesFoo)).to.equal("Rm9vQmFy"));
		it("encodes extended ASCII strings", () => expect(base64Encode("cáfébábé")).to.equal("Y+Fm6WLhYuk="));
		it("encodes extended ASCII bytes",   () => expect(base64Encode(bytesCafe)).to.equal("Y+Fm6WLhYuk="));
		it("encodes raw binary strings",     () => expect(base64Encode(stringRaw)).to.equal("iQEAj//+AA=="));
		it("encodes raw binary bytes",       () => expect(base64Encode(bytesRaw)).to.equal("iQEAj//+AA=="));
		it("encodes PNG images correctly",   () => {
			const json = JSON.parse(file("base64/rgba.json"));
			for(const key in json)
				expect(base64Encode(file(key))).to.equal(json[key]);
		});
	});
	
	describe("bytesToUInt16()", () => {
		const {bytesToUInt16} = utils;
		it("encodes bytes in big-endian order", () => {
			expect(bytesToUInt16([0xFF, 0xBB])).to.eql([0xFFBB]);
			expect(bytesToUInt16([0x12, 0x34, 0x56, 0x78])).to.eql([0x1234, 0x5678]);
			expect(bytesToUInt16([0xAA, 0xBB, 0xCC, 0xDD, 0xEE])).to.eql([0xAABB, 0xCCDD, 0xEE00]);
		});
		it("encodes bytes in little-endian order", () => {
			expect(bytesToUInt16([0xFF, 0xBB], true)).to.eql([0xBBFF]);
			expect(bytesToUInt16([0x12, 0x34, 0x56, 0x78], true)).to.eql([0x3412, 0x7856]);
			expect(bytesToUInt16([0xAA, 0xBB, 0xCC, 0xDD, 0xEE], true)).to.eql([0xBBAA, 0xDDCC, 0x00EE]);
		});
		it("encodes typed arrays", () => {
			expect(bytesToUInt16(Uint8Array.from([0xFF, 0xBB, 0xCC]))).to.eql([0xFFBB, 0xCC00]);
			expect(bytesToUInt16(Uint8Array.from([0x12, 0x34]), true)).to.eql([0x3412]);
		});
		it("encodes buffers", () => {
			expect(bytesToUInt16(Buffer.from([0xFF, 0xBB, 0xCC]))).to.eql([0xFFBB, 0xCC00]);
			expect(bytesToUInt16(Buffer.from([0x12, 0x34]), true)).to.eql([0x3412]);
		});
	});
	
	describe("bytesToUInt32()", () => {
		const {bytesToUInt32} = utils;
		it("encodes bytes in big-endian order", () => {
			expect(bytesToUInt32([0xAA, 0xBB, 0xCC, 0xDD])).to.eql([0xAABBCCDD]);
			expect(bytesToUInt32([0xAB, 0xCD, 0xEF, 0x12, 0x34])).to.eql([0xABCDEF12, 0x34000000]);
			expect(bytesToUInt32([0x12, 0x34, 0x56, 0x78, 0xAB, 0xCD, 0xEF, 0x35])).to.eql([0x12345678, 0xABCDEF35]);
		});
		it("encodes bytes in little-endian order", () => {
			expect(bytesToUInt32([0xAA, 0xBB, 0xCC, 0xDD], true)).to.eql([0xDDCCBBAA]);
			expect(bytesToUInt32([0xAB, 0xCD, 0xEF, 0x12, 0x34], true)).to.eql([0x12EFCDAB, 0x34]);
			expect(bytesToUInt32([0x12, 0x34, 0x56, 0x78, 0xAB, 0xCD, 0xEF, 0x35], true)).to.eql([0x78563412, 0x35EFCDAB]);
		});
		it("encodes typed arrays", () => {
			expect(bytesToUInt32(Uint8Array.from([0xAB, 0xCD, 0xEF, 0x12, 0x34]))).to.eql([0xABCDEF12, 0x34000000]);
			expect(bytesToUInt32(Uint8Array.from([0x12, 0x34, 0x56, 0x78, 0x9E]), true)).to.eql([0x78563412, 0x9E]);
			expect(bytesToUInt32(Uint8Array.from([0x12, 0x34, 0x56, 0x78]), true)).to.eql([0x78563412]);
		});
		it("encodes buffers", () => {
			expect(bytesToUInt32(Buffer.from([0xAB, 0xCD, 0xEF, 0x12, 0x34]))).to.eql([0xABCDEF12, 0x34000000]);
			expect(bytesToUInt32(Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9E]), true)).to.eql([0x78563412, 0x9E]);
			expect(bytesToUInt32(Buffer.from([0x12, 0x34, 0x56, 0x78]), true)).to.eql([0x78563412]);
		});
	});
	
	describe("bytesToUInt64()", () => {
		const {bytesToUInt64} = utils;
		const bytes = [
			0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
			0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91,
			0xAB, 0xCD,
		];
		const be = [0x1122334455667788n, 0xABCDEF1234567891n, 0xABCD000000000000n];
		const le = [0x8877665544332211n, 0x9178563412EFCDABn, 0xCDABn];
		it("encodes bytes in big-endian order",    () => expect(bytesToUInt64(bytes)).to.eql(be));
		it("encodes bytes in little-endian order", () => expect(bytesToUInt64(bytes, true)).to.eql(le));
		it("encodes typed arrays", () => {
			expect(bytesToUInt64(Uint8Array.from(bytes))).to.eql(be);
			expect(bytesToUInt64(Uint8Array.from(bytes), true)).to.eql(le);
		});
		it("encodes buffers", () => {
			expect(bytesToUInt64(Buffer.from(bytes))).to.eql(be);
			expect(bytesToUInt64(Buffer.from(bytes), true)).to.eql(le);
		});
	});
	
	describe("crc32()", () => {
		const {crc32} = utils;
		it("computes CRCs of string values", () => {
			expect(crc32("Foo123")).to.equal(0x67EDF5DB);
			expect(crc32("\0\x1B\xA4\0\x07")).to.equal(0x12F479C);
		});
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
	
	describe("rgba()", () => {
		const {rgba} = utils;
		describe("Solid colours", () => {
			it("generates red pixels",     () => expect(rgba(0xFF, 0x00, 0x00, 0xFF)).to.equal(file("rgba/ff0000ff.png")));
			it("generates green pixels",   () => expect(rgba(0x00, 0xFF, 0x00, 0xFF)).to.equal(file("rgba/00ff00ff.png")));
			it("generates blue pixels",    () => expect(rgba(0x00, 0x00, 0xFF, 0xFF)).to.equal(file("rgba/0000ffff.png")));
			it("generates white pixels",   () => expect(rgba(0xFF, 0xFF, 0xFF, 0xFF)).to.equal(file("rgba/ffffffff.png")));
			it("generates black pixels",   () => expect(rgba(0x00, 0x00, 0x00, 0xFF)).to.equal(file("rgba/000000ff.png")));
			it("generates grey pixels",    () => expect(rgba(0x7F, 0x7F, 0x7F, 0xFF)).to.equal(file("rgba/7f7f7fff.png")));
			it("generates #BBFFDD pixels", () => expect(rgba(0xBB, 0xFF, 0xDD, 0xFF)).to.equal(file("rgba/bbffddff.png")));
			it("generates #BBAAFF pixels", () => expect(rgba(0xBB, 0xAA, 0xFF, 0xFF)).to.equal(file("rgba/bbaaffff.png")));
		});
		describe("Translucent colours", () => {
			it("generates red pixels",     () => expect(rgba(0xAF, 0x00, 0x00, 0x64)).to.equal(file("rgba/af000064.png")));
			it("generates green pixels",   () => expect(rgba(0x00, 0x85, 0x00, 0x3A)).to.equal(file("rgba/0085003a.png")));
			it("generates blue pixels",    () => expect(rgba(0x00, 0x00, 0x9A, 0x89)).to.equal(file("rgba/00009a89.png")));
			it("generates white pixels",   () => expect(rgba(0xFF, 0xFF, 0xFF, 0x7F)).to.equal(file("rgba/ffffff7f.png")));
			it("generates black pixels",   () => expect(rgba(0x00, 0x00, 0x00, 0x40)).to.equal(file("rgba/00000040.png")));
			it("generates grey pixels",    () => expect(rgba(0x3A, 0x3B, 0x3C, 0x6F)).to.equal(file("rgba/3a3b3c6f.png")));
			it("generates #BBFFDD pixels", () => expect(rgba(0xBB, 0xFF, 0xDD, 0x30)).to.equal(file("rgba/bbffdd30.png")));
			it("generates #BBAAFF pixels", () => expect(rgba(0xBB, 0xAA, 0xFF, 0x0A)).to.equal(file("rgba/bbaaff0a.png")));
		});
		describe("100% transparency", () => {
			it("generates red pixels",     () => expect(rgba(0xFF, 0x00, 0x00, 0x00)).to.equal(file("rgba/ff000000.png")));
			it("generates green pixels",   () => expect(rgba(0x00, 0xFF, 0x00, 0x00)).to.equal(file("rgba/00ff0000.png")));
			it("generates blue pixels",    () => expect(rgba(0x00, 0x00, 0xFF, 0x00)).to.equal(file("rgba/0000ff00.png")));
			it("generates white pixels",   () => expect(rgba(0xFF, 0xFF, 0xFF, 0x00)).to.equal(file("rgba/ffffff00.png")));
			it("generates black pixels",   () => expect(rgba(0x00, 0x00, 0x00, 0x00)).to.equal(file("rgba/00000000.png")));
			it("generates grey pixels",    () => expect(rgba(0x3A, 0x3B, 0x3C, 0x00)).to.equal(file("rgba/3a3b3c00.png")));
			it("generates #BBFFDD pixels", () => expect(rgba(0xBB, 0xFF, 0xDD, 0x00)).to.equal(file("rgba/bbffdd00.png")));
			it("generates #BBAAFF pixels", () => expect(rgba(0xBB, 0xAA, 0xFF, 0x00)).to.equal(file("rgba/bbaaff00.png")));
		});
	});
	
	describe("uint16ToBytes()", () => {
		const {uint16ToBytes} = utils;
		it("decodes integers in big-endian order", () => {
			const uints = [0xABCD, 0xEF12, 0x34];
			const bytes = [0xAB, 0xCD, 0xEF, 0x12, 0, 0x34];
			expect(uint16ToBytes(uints)).to.eql(bytes);
		});
		it("decodes integers in little-endian order", () => {
			const uints = [0xABCD, 0xEF12, 0x34];
			const bytes = [0xCD, 0xAB, 0x12, 0xEF, 0x34, 0];
			expect(uint16ToBytes(uints, true)).to.eql(bytes);
		});
		it("decodes single-integer arguments", () => {
			expect(uint16ToBytes(0xABCD))  .to.eql([0xAB, 0xCD]);
			expect(uint16ToBytes([0xEF12])).to.eql([0xEF, 0x12]);
			expect(uint16ToBytes(0xABCD,   true)).to.eql([0xCD, 0xAB]);
			expect(uint16ToBytes([0xEF12], true)).to.eql([0x12, 0xEF]);
		});
	});
	
	describe("uint32ToBytes()", () => {
		const {uint32ToBytes} = utils;
		it("decodes integers in big-endian order", () => {
			const uints = [0xABCDEF12, 0x34567891, 0x23];
			const bytes = [0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91, 0, 0, 0, 0x23];
			expect(uint32ToBytes(uints)).to.eql(bytes);
		});
		it("decodes integers in little-endian order", () => {
			const uints = [0xABCDEF12, 0x34567891, 0x23];
			const bytes = [0x12, 0xEF, 0xCD, 0xAB, 0x91, 0x78, 0x56, 0x34, 0x23, 0, 0, 0];
			expect(uint32ToBytes(uints, true)).to.eql(bytes);
		});
		it("decodes single-integer arguments", () => {
			const input = 0xABCDEF12;
			const bytes = [0xAB, 0xCD, 0xEF, 0x12];
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
			expect(uint64ToBytes(uints)).to.eql([
				0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
				0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xAB, 0xCD,
			]);
		});
		it("decodes integers in little-endian order", () => {
			const uints = [0x1122334455667788n, 0xABCDEF1234567891n, 0xABCDn];
			expect(uint64ToBytes(uints, true)).to.eql([
				0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11,
				0x91, 0x78, 0x56, 0x34, 0x12, 0xEF, 0xCD, 0xAB,
				0xCD, 0xAB, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			]);
		});
		it("decodes single-integer arguments", () => {
			const input = 0xABCDEF1234567891n;
			const bytes = [0xAB, 0xCD, 0xEF, 0x12, 0x34, 0x56, 0x78, 0x91];
			expect(uint64ToBytes(input))  .to.eql(bytes);
			expect(uint64ToBytes([input])).to.eql(bytes);
			bytes.reverse();
			expect(uint64ToBytes(input,   true)).to.eql(bytes);
			expect(uint64ToBytes([input], true)).to.eql(bytes);
		});
	});
	
	// Cuneiform sequences shared by UTF8-related functions
	const astralChars    = "𒀻𒀰";
	const decodedAstrals = "\xED\xA0\x88\xED\xB0\xBB\xED\xA0\x88\xED\xB0\xB0";
	
	describe("utf8Decode()", () => {
		const {utf8Decode} = utils;
		it("preserves 7-bit ASCII",     () => expect(utf8Decode("Foo\0Bar")).to.equal("Foo\0Bar"));
		it("decodes extended ASCII",    () => expect(utf8Decode("cáfébábé")).to.equal("cÃ¡fÃ©bÃ¡bÃ©"));
		it("decodes multibyte UTF-8",   () => expect(utf8Decode("→│λ")).to.equal("\xE2\x86\x92\xE2\x94\x82\xCE\xBB"));
		it("decodes astral characters", () => expect(utf8Decode(astralChars)).to.equal(decodedAstrals));
	});
	
	describe("utf8Encode()", () => {
		const {utf8Encode} = utils;
		it("preserves 7-bit ASCII",     () => expect(utf8Encode("Foo\0Bar")).to.equal("Foo\0Bar"));
		it("encodes extended ASCII",    () => expect(utf8Encode("cÃ¡fÃ©bÃ¡bÃ©")).to.equal("cáfébábé"));
		it("encodes multibyte UTF-8",   () => expect(utf8Encode("\xE2\x86\x92\xE2\x94\x82\xCE\xBB")).to.equal("→│λ"));
		it("encodes astral characters", () => expect(utf8Encode(decodedAstrals)).to.equal(astralChars));
	});
	
	describe("wsDecodeFrame()", () => {
		const {wsDecodeFrame} = utils;
		const base = {isFinal: true, isRSV1: false, isRSV2: false, isRSV3: false, mask: null};
		it("decodes single-frame unmasked text messages", () => {
			const frame = [0x81, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F];
			expect(wsDecodeFrame(frame)).to.eql({...base,
				data:   [72, 101, 108, 108, 111],
				length: 5n,
				opcode: 1,
				opname: "text",
			});
		});
		it("decodes single-frame masked text messages", () => {
			const frame = [0x81, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58];
			expect(wsDecodeFrame(frame)).to.eql({...base,
				data:   [127, 159, 77, 81, 88],
				length: 5n,
				mask:   0x37FA213D,
				opcode: 1,
				opname: "text",
			});
		});
		it("decodes fragmented unmasked text messages", () => {
			expect(wsDecodeFrame([0x01, 0x03, 0x48, 0x65, 0x6C])).to.eql({...base,
				data:    [72, 101, 108],
				isFinal: false,
				length:  3n,
				opcode:  1,
				opname:  "text",
			});
			expect(wsDecodeFrame([0x80, 0x02, 0x6C, 0x6F])).to.eql({...base,
				data:    [108, 111],
				length:  2n,
				opcode:  0,
				opname:  "continue",
			});
		});
		it("decodes unmasked ping requests", () => {
			const frame = [0x89, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F];
			expect(wsDecodeFrame(frame)).to.eql({...base,
				data:   [72, 101, 108, 108, 111],
				length: 5n,
				opcode: 9,
				opname: "ping",
			});
		});
		it("decodes masked ping responses", () => {
			const frame = [0x8A, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58];
			expect(wsDecodeFrame(frame)).to.eql({...base,
				data:   [127, 159, 77, 81, 88],
				length: 5n,
				mask:   0x37FA213D,
				opcode: 10,
				opname: "pong",
			});
		});
		it("decodes 256-byte unmasked binary messages", () => {
			const bytes = new Array(256).fill(0xFF);
			const frame = [0x82, 0x7E, 0x01, 0x00, ...bytes];
			expect(wsDecodeFrame(frame)).to.eql({...base,
				data:   bytes,
				length: 256n,
				opcode: 2,
				opname: "binary",
			});
		});
		it("decodes 64-kilobyte unmasked binary messages", () => {
			const bytes = new Array(65536).fill(0xFF);
			const frame = [0x82, 0x7F, 0, 0, 0, 0, 0, 1, 0, 0, ...bytes];
			expect(wsDecodeFrame(frame)).to.eql({...base,
				data:   bytes,
				length: 65536n,
				opcode: 2,
				opname: "binary",
			});
		});
	});
});
