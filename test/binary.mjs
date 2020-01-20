import assert          from "assert";
import {readFileSync}  from "fs";
import {dirname, join} from "path";
import {fileURLToPath} from "url";
import * as utils      from "../index.mjs";

describe("Byte-level functions", () => {
	const dir  = dirname(fileURLToPath(import.meta.url));
	const file = path => [...readFileSync(join(dir, "fixtures", ...path.split("/")), {encoding: null})];
	
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
	
	describe("base64Decode()", () => {
		const {base64Decode} = utils;
		it("decodes ASCII",   () => expect(base64Decode("Rm9vQmFy")).to.eql([0x46, 0x6F, 0x6F, 0x42, 0x61, 0x72]));
		it("decodes Latin-1", () => expect(base64Decode("Y+Fm6WLhYuk=")).to.eql([0x63, 0xE1, 0x66, 0xE9, 0x62, 0xE1, 0x62, 0xE9]));
		it("decodes binary",  () => expect(base64Decode("iQEAj//+AA==")).to.eql([0x89, 0x01, 0x00, 0x8F, 0xFF, 0xFE, 0x00]));
		it("decodes UTF-8",   () => expect(base64Decode("8J+Ygg==")).to.eql([0xF0, 0x9F, 0x98, 0x82]));
	});
	
	describe("base64Encode()", () => {
		const {base64Encode} = utils;
		it("encodes ASCII",   () => expect(base64Encode([0x46, 0x6F, 0x6F, 0x42, 0x61, 0x72])).to.equal("Rm9vQmFy"));
		it("encodes Latin-1", () => expect(base64Encode([0x63, 0xE1, 0x66, 0xE9, 0x62, 0xE1, 0x62, 0xE9])).to.equal("Y+Fm6WLhYuk="));
		it("encodes binary",  () => expect(base64Encode([0x89, 0x01, 0x00, 0x8F, 0xFF, 0xFE, 0x00])).to.equal("iQEAj//+AA=="));
		it("encodes PNGs",    () => {
			const json = JSON.parse(String.fromCharCode(...file("base64/rgba.json")));
			for(const [png, encoded] of Object.entries(json))
				expect(base64Encode(file(png))).to.equal(encoded);
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
	
	describe("utf8Decode()", () => {
		const {utf8Decode} = utils;
		
		function decode(input, expected){
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
			assert.deepStrictEqual(utf16Decode(""), []);
			assert.deepStrictEqual(utf16Decode([]), []);
		});
		
		describe("Big-endian sequences", () => {
			function decode(input, expected){
				const codes = [...input].map(x => x.codePointAt(0));
				assert.deepStrictEqual(utf16Decode(input), expected);
				assert.deepStrictEqual(utf16Decode(codes), expected);
				assert.deepStrictEqual(utf16Decode(input, false, true), [0xFE, 0xFF, ...expected]);
				assert.deepStrictEqual(utf16Decode(codes, false, true), [0xFE, 0xFF, ...expected]);
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
				const codes = [...input].map(x => x.codePointAt(0));
				assert.deepStrictEqual(utf16Decode(input, true), expected);
				assert.deepStrictEqual(utf16Decode(codes, true), expected);
				assert.deepStrictEqual(utf16Decode(input, true, true), [0xFF, 0xFE, ...expected]);
				assert.deepStrictEqual(utf16Decode(codes, true, true), [0xFF, 0xFE, ...expected]);
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
			assert.deepStrictEqual(utf32Decode(""), []);
			assert.deepStrictEqual(utf32Decode([]), []);
		});
		
		describe("Big-endian sequences", () => {
			function decode(input, expected){
				const codes = [...input].map(x => x.codePointAt(0));
				assert.deepStrictEqual(utf32Decode(input), expected);
				assert.deepStrictEqual(utf32Decode(codes), expected);
				assert.deepStrictEqual(utf32Decode(input, false, true), [0, 0, 0xFE, 0xFF, ...expected]);
				assert.deepStrictEqual(utf32Decode(codes, false, true), [0, 0, 0xFE, 0xFF, ...expected]);
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
				const codes = [...input].map(x => x.codePointAt(0));
				assert.deepStrictEqual(utf32Decode(input, true), expected);
				assert.deepStrictEqual(utf32Decode(codes, true), expected);
				assert.deepStrictEqual(utf32Decode(input, true, true), [0xFF, 0xFE, 0, 0, ...expected]);
				assert.deepStrictEqual(utf32Decode(codes, true, true), [0xFF, 0xFE, 0, 0, ...expected]);
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
			};
			expect(wsDecodeFrame(input)).to.eql(frame);
			expect(wsDecodeFrame(input, true)).to.eql(frame);
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
