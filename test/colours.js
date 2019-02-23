"use strict";

describe("Colour-related functions", function(){
	this.slow(1000);
	const utils = require("../index.js");
	
	describe("Colour conversion", () => {
		const cmykTests  = require("./fixtures/colours/cmyk-tests.js");
		const hslTests   = require("./fixtures/colours/hsl-tests.js");
		const hsvTests   = require("./fixtures/colours/hsv-tests.js");
		const mixedTests = require("./fixtures/colours/mixed-tests.js");
		
		it("converts CMYK to CMY", () => {
			const {cmykToCMY} = utils;
			cmykTests.map((test, index) => {
				const cmy = cmykToCMY(test.cmyk);
				expect(cmy[0], `Line ${index + 3}: Cyan`)   .to.be.closeTo(test.cmy[0], 0.01);
				expect(cmy[1], `Line ${index + 3}: Magenta`).to.be.closeTo(test.cmy[1], 0.01);
				expect(cmy[2], `Line ${index + 3}: Yellow`) .to.be.closeTo(test.cmy[2], 0.01);
			});
		});
		
		it("converts CMYK to RGB", () => {
			const {cmykToRGB} = utils;
			cmykTests.map((test, index) => {
				const rgb = cmykToRGB(test.cmyk);
				expect(rgb[0], `Line ${index + 3}: Red`)  .to.be.closeTo(test.rgb[0], 2);
				expect(rgb[1], `Line ${index + 3}: Green`).to.be.closeTo(test.rgb[1], 2);
				expect(rgb[2], `Line ${index + 3}: Blue`) .to.be.closeTo(test.rgb[2], 2);
			});
		});
		
		it("converts CMY to CMYK", () => {
			const {cmyToCMYK} = utils;
			cmykTests.map((test, index) => {
				const cmyk = cmyToCMYK(test.cmy);
				expect(cmyk[0], `Line ${index + 3}: Cyan`)   .to.be.closeTo(test.cmyk[0], 0.01);
				expect(cmyk[1], `Line ${index + 3}: Magenta`).to.be.closeTo(test.cmyk[1], 0.01);
				expect(cmyk[2], `Line ${index + 3}: Yellow`) .to.be.closeTo(test.cmyk[2], 0.01);
				expect(cmyk[3], `Line ${index + 3}: Black`)  .to.be.closeTo(test.cmyk[3], 0.01);
			});
		});
		
		it("converts CMY to RGB", () => {
			const {cmyToRGB} = utils;
			cmykTests.map((test, index) => {
				const rgb = cmyToRGB(test.cmy);
				expect(rgb[0], `Line ${index + 3}: Red`)  .to.be.closeTo(test.rgb[0], 2);
				expect(rgb[1], `Line ${index + 3}: Green`).to.be.closeTo(test.rgb[1], 2);
				expect(rgb[2], `Line ${index + 3}: Blue`) .to.be.closeTo(test.rgb[2], 2);
			});
		});
		
		it("converts hex to RGB", () => {
			const {hexToRGB} = utils;
			mixedTests.map(test => expect(hexToRGB(test.hexInt)).to.eql(test.rgb));
		});
		
		it("converts HSL to HSV", () => {
			const {hslToHSV} = utils;
			hsvTests.map((test, index) => {
				const hsv = hslToHSV(hslTests[index].hsl);
				expect(hsv[0], `Line ${index + 3}: Hue`).to.be.closeTo(test.hsv[0], 1);
				expect(hsv[1], `Line ${index + 3}: Sat`).to.be.closeTo(test.hsv[1], 0.01);
				expect(hsv[2], `Line ${index + 3}: Val`).to.be.closeTo(test.hsv[2], 0.01);
			});
		});
		
		it("converts HSL to RGB", () => {
			const {hslToRGB} = utils;
			hslTests.map((test, index) => {
				const rgb = hslToRGB(test.hsl);
				expect(rgb[0], `Line ${index + 3}: Red}`)  .to.be.closeTo(test.rgb[0], 1);
				expect(rgb[1], `Line ${index + 3}: Green}`).to.be.closeTo(test.rgb[1], 1);
				expect(rgb[2], `Line ${index + 3}: Blue}`) .to.be.closeTo(test.rgb[2], 1);
			});
		});
		
		it("converts HSV to HSL", () => {
			const {hsvToHSL} = utils;
			hslTests.map((test, index) => {
				const hsl = hsvToHSL(hsvTests[index].hsv);
				expect(hsl[0], `Line ${index + 3}: Hue`).to.be.closeTo(test.hsl[0], 1);
				expect(hsl[1], `Line ${index + 3}: Sat`).to.be.closeTo(test.hsl[1], 0.01);
				expect(hsl[2], `Line ${index + 3}: Lum`).to.be.closeTo(test.hsl[2], 0.01);
			});
		});
		
		it("converts HSV to RGB", () => {
			const {hsvToRGB} = utils;
			hsvTests.map((test, index) => {
				const rgb = hsvToRGB(test.hsv);
				expect(rgb[0], `Line ${index + 3}: Red`)  .to.be.closeTo(test.rgb[0], 1);
				expect(rgb[1], `Line ${index + 3}: Green`).to.be.closeTo(test.rgb[1], 1);
				expect(rgb[2], `Line ${index + 3}: Blue`) .to.be.closeTo(test.rgb[2], 1);
			});
		});
		
		it("converts RGB to CMY", () => {
			const {rgbToCMY} = utils;
			cmykTests.map((test, index) => {
				const cmy = rgbToCMY(test.rgb);
				expect(cmy[0], `Line ${index + 3}: Cyan`)   .to.be.closeTo(test.cmy[0], 0.01);
				expect(cmy[1], `Line ${index + 3}: Magenta`).to.be.closeTo(test.cmy[1], 0.01);
				expect(cmy[2], `Line ${index + 3}: Yellow`) .to.be.closeTo(test.cmy[2], 0.01);
			});
		});
		
		it("converts RGB to CMYK", () => {
			const {rgbToCMYK} = utils;
			cmykTests.map((test, index) => {
				const cmyk = rgbToCMYK(test.rgb);
				expect(cmyk[0], `Line ${index + 3}: Cyan`)   .to.be.closeTo(test.cmyk[0], 1);
				expect(cmyk[1], `Line ${index + 3}: Magenta`).to.be.closeTo(test.cmyk[1], 1);
				expect(cmyk[2], `Line ${index + 3}: Yellow`) .to.be.closeTo(test.cmyk[2], 1);
				expect(cmyk[3], `Line ${index + 3}: Black`)  .to.be.closeTo(test.cmyk[3], 1);
			});
		});
		
		it("converts RGB to hex", () => {
			const {rgbToHex} = utils;
			mixedTests.map(test => expect(rgbToHex(test.rgb, false)).to.eql(test.hexInt));
			mixedTests.map(test => expect(rgbToHex(test.rgb, true)) .to.eql(test.hexStr));
		});
		
		it("converts RGB to HSL", () => {
			const {rgbToHSL} = utils;
			hslTests.map((test, index) => {
				const hsl = rgbToHSL(test.rgb);
				expect(hsl[0], `Line ${index + 3}: Hue`).to.be.closeTo(test.hsl[0], 1);
				expect(hsl[1], `Line ${index + 3}: Sat`).to.be.closeTo(test.hsl[1], 0.01);
				expect(hsl[2], `Line ${index + 3}: Lum`).to.be.closeTo(test.hsl[2], 0.01);
			});
		});
		
		it("converts RGB to HSV", () => {
			const {rgbToHSV} = utils;
			hsvTests.map((test, index) => {
				const hsv = rgbToHSV(test.rgb);
				expect(hsv[0], `Line ${index + 3}: Hue`).to.be.closeTo(test.hsv[0], 1);
				expect(hsv[1], `Line ${index + 3}: Sat`).to.be.closeTo(test.hsv[1], 0.01);
				expect(hsv[2], `Line ${index + 3}: Val`).to.be.closeTo(test.hsv[2], 0.01);
			});
		});
	});
});
