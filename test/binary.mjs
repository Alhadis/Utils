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
		const $ = s => s.split("").map(x => x.charCodeAt(0));
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
			expect(sha1($(file("rgba/00000000.png")))).to.equal("f8d88e6e02b634ea9cc384d33596c4f590b6ae31");
			expect(sha1($(file("rgba/00000040.png")))).to.equal("fd69eead19d508fa659c6edfe3a0f8681ecf28d0");
			expect(sha1($(file("rgba/000000ff.png")))).to.equal("ec6f28cd5ebed9bc95053fed3a2018bfff3e0596");
			expect(sha1($(file("rgba/00009a89.png")))).to.equal("0fde443c129e30c91d2d6824397bd2fbd06c51a1");
			expect(sha1($(file("rgba/0000ff00.png")))).to.equal("0762f078c0f3014dabe87bad3fe2f35d3dea64b3");
			expect(sha1($(file("rgba/0000ffff.png")))).to.equal("9ee13be59305affc103d687909496822ac40d920");
			expect(sha1($(file("rgba/0085003a.png")))).to.equal("baa685e7cd63395c21daa8c0e18a4ed7975de8d4");
			expect(sha1($(file("rgba/00ff0000.png")))).to.equal("e7702eb43ead2ed16aa9a90b890132b6c76a9db4");
			expect(sha1($(file("rgba/00ff00ff.png")))).to.equal("4b594c3fa919b925992d97255ca29bf1e25c08a6");
			expect(sha1($(file("rgba/3a3b3c00.png")))).to.equal("d86184312b399508e6add30a707ba4ff4e03eb3a");
			expect(sha1($(file("rgba/3a3b3c6f.png")))).to.equal("ecbab7ef0ee4d6402e6bfcdcd10614a3386d0bf6");
			expect(sha1($(file("rgba/7f7f7fff.png")))).to.equal("4f7e15871a7156ee6a0791960ece126bc2f836e6");
			expect(sha1($(file("rgba/af000064.png")))).to.equal("98ea5e764168c160582f0ed9a921ab54b5c5ef84");
			expect(sha1($(file("rgba/bbaaff00.png")))).to.equal("a66ff64d8b139ea7c303850bad114f0bf7b6cb4b");
			expect(sha1($(file("rgba/bbaaff0a.png")))).to.equal("475df629ebbed4296b5b2d20b0eef8f6b603d260");
			expect(sha1($(file("rgba/bbaaffff.png")))).to.equal("094e8d1ff70ae139699a409c086f07964cb2417a");
			expect(sha1($(file("rgba/bbffdd00.png")))).to.equal("b5f2ff741439aa66a2b1c6029c94688a5fe220d0");
			expect(sha1($(file("rgba/bbffdd30.png")))).to.equal("246042095ef802ef3f59b6e46fcf8dbd1a29794e");
			expect(sha1($(file("rgba/bbffddff.png")))).to.equal("65832700005eea524e4eacfd2d1244f50c5c1fbf");
			expect(sha1($(file("rgba/ff000000.png")))).to.equal("75d60144d0907b5d300ec580904ad052e2812d43");
			expect(sha1($(file("rgba/ff0000ff.png")))).to.equal("b31f0478d976ce5749f86344211aeeba41de065e");
			expect(sha1($(file("rgba/ffffff00.png")))).to.equal("950408bcffbed5942be5534b0c6437a46524d617");
			expect(sha1($(file("rgba/ffffff7f.png")))).to.equal("4a068096b7bdc92ac98d1d799e5ebc503691f119");
			expect(sha1($(file("rgba/ffffffff.png")))).to.equal("5372946ce021a6956209135e2426bceb3a47e239");
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
	
	// WebSocket frame tests
	const base = {isFinal: true, isRSV1: false, isRSV2: false, isRSV3: false, mask: null};
	const wsFrames = [
		[[0x81, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F], {...base,
			data:   [72, 101, 108, 108, 111],
			length: 5n,
			opcode: 1,
			opname: "text",
		}],
		[[0x81, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58], {...base,
			data:   [127, 159, 77, 81, 88],
			length: 5n,
			mask:   0x37FA213D,
			opcode: 1,
			opname: "text",
		}],
		[[0x89, 0x05, 0x48, 0x65, 0x6C, 0x6C, 0x6F], {...base,
			data:   [72, 101, 108, 108, 111],
			length: 5n,
			opcode: 9,
			opname: "ping",
		}],
		[[0x8A, 0x85, 0x37, 0xFA, 0x21, 0x3D, 0x7F, 0x9F, 0x4D, 0x51, 0x58], {...base,
			data:   [127, 159, 77, 81, 88],
			length: 5n,
			mask:   0x37FA213D,
			opcode: 10,
			opname: "pong",
		}],
		[[0x82, 0x7E, 0x01, 0x00, ...new Array(256).fill(0xFF)], {...base,
			data:   new Array(256).fill(0xFF),
			length: 256n,
			opcode: 2,
			opname: "binary",
		}],
		[[0x82, 0x7F, 0, 0, 0, 0, 0, 1, 0, 0, ...new Array(65536).fill(0xFF)], {...base,
			data:   new Array(65536).fill(0xFF),
			length: 65536n,
			opcode: 2,
			opname: "binary",
		}],
		[[0x01, 0x03, 0x48, 0x65, 0x6C], {...base,
			data:    [72, 101, 108],
			isFinal: false,
			length:  3n,
			opcode:  1,
			opname:  "text",
		}],
		[[0x80, 0x02, 0x6C, 0x6F], {...base,
			data:    [108, 111],
			length:  2n,
			opcode:  0,
			opname:  "continue",
		}],
	];
	
	describe("wsDecodeFrame()", () => {
		const {wsDecodeFrame} = utils;
		it("decodes single-frame unmasked text messages", () => expect(wsDecodeFrame(wsFrames[0][0])).to.eql(wsFrames[0][1]));
		it("decodes single-frame masked text messages",   () => expect(wsDecodeFrame(wsFrames[1][0])).to.eql(wsFrames[1][1]));
		it("decodes unmasked ping requests",              () => expect(wsDecodeFrame(wsFrames[2][0])).to.eql(wsFrames[2][1]));
		it("decodes masked ping responses",               () => expect(wsDecodeFrame(wsFrames[3][0])).to.eql(wsFrames[3][1]));
		it("decodes 256-byte unmasked binary messages",   () => expect(wsDecodeFrame(wsFrames[4][0])).to.eql(wsFrames[4][1]));
		it("decodes 64-KiB unmasked binary messages",     () => expect(wsDecodeFrame(wsFrames[5][0])).to.eql(wsFrames[5][1]));
		it("decodes fragmented unmasked text messages",   () => {
			expect(wsDecodeFrame(wsFrames[6][0])).to.eql(wsFrames[6][1]);
			expect(wsDecodeFrame(wsFrames[7][0])).to.eql(wsFrames[7][1]);
		});
	});
	
	describe("wsEncodeFrame()", () => {
		const {wsEncodeFrame} = utils;
		it("encodes single-frame unmasked text messages", () => expect(wsEncodeFrame(wsFrames[0][1])).to.eql(wsFrames[0][0]));
		it("encodes single-frame masked text messages",   () => expect(wsEncodeFrame(wsFrames[1][1])).to.eql(wsFrames[1][0]));
		it("encodes unmasked ping requests",              () => expect(wsEncodeFrame(wsFrames[2][1])).to.eql(wsFrames[2][0]));
		it("encodes masked ping responses",               () => expect(wsEncodeFrame(wsFrames[3][1])).to.eql(wsFrames[3][0]));
		it("encodes 256-byte unmasked binary messages",   () => expect(wsEncodeFrame(wsFrames[4][1])).to.eql(wsFrames[4][0]));
		it("encodes 64-KiB unmasked binary messages",     () => expect(wsEncodeFrame(wsFrames[5][1])).to.eql(wsFrames[5][0]));
		it("encodes fragmented unmasked text messages",   () => {
			expect(wsEncodeFrame(wsFrames[6][1])).to.eql(wsFrames[6][0]);
			expect(wsEncodeFrame(wsFrames[7][1])).to.eql(wsFrames[7][0]);
		});
	});
});
