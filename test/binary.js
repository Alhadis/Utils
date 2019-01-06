"use strict";

describe("Byte-level functions", () => {
	const utils  = require("../index.js");
	const {join} = require("path");
	const fs     = require("fs");
	const file   = path =>
		fs.readFileSync(join(__dirname, "fixtures", ...path.split("/")), {encoding: "binary"});
	
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
});
