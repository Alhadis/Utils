import * as utils from "../index.mjs";

describe("Colour-related functions", function(){
	this.slow(1000);
	
	describe("Blending modes", () => {
		// NB: Subtract is omitted because it's inconsistent with Photoshop's behaviour
		const {BlendModes} = utils;
		const {alphaF} = BlendModes;
		
		describe("normal()", () => {
			const {normal} = BlendModes;
			it("blends opaque values", () => {
				expect(normal(128, 48)).to.equal(128);
				expect(normal(48, 128)).to.equal(48);
				expect(normal(0,  255)).to.equal(0);
				expect(normal(255,  0)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, normal, 0.4))  .to.be.closeTo(80, 1);
				expect(alphaF(48, 128, normal, 0.4))  .to.be.closeTo(96, 1);
				expect(alphaF(48, 128, normal, 0))    .to.be.closeTo(128, 1);
				expect(alphaF(128, 48, normal, 0))    .to.be.closeTo(48, 1);
				expect(BlendModes.alpha(128, 48, 0.4)).to.be.closeTo(80, 1);
				expect(BlendModes.alpha(48, 128, 0.4)).to.be.closeTo(96, 1);
				expect(BlendModes.alpha(48, 128, 0))  .to.be.closeTo(128, 1);
				expect(BlendModes.alpha(128, 48, 0))  .to.be.closeTo(48, 1);
			});
		});
		
		describe("lighten()", () => {
			const {lighten} = BlendModes;
			it("blends opaque values", () => {
				expect(lighten(128, 48)).to.equal(128);
				expect(lighten(48, 128)).to.equal(128);
				expect(lighten(0,  255)).to.equal(255);
				expect(lighten(255,  0)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, lighten, 0.4)).to.equal(80);
				expect(alphaF(48, 128, lighten, 0.4)).to.equal(128);
				expect(alphaF(0,  255, lighten, 0))  .to.equal(255);
				expect(alphaF(255,  0, lighten, 0))  .to.equal(0);
			});
		});
		
		describe("darken()", () => {
			const {darken} = BlendModes;
			it("blends opaque values", () => {
				expect(darken(128, 48)).to.equal(48);
				expect(darken(48, 128)).to.equal(48);
				expect(darken(0,  255)).to.equal(0);
				expect(darken(255,  0)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, darken, 0.4)).to.equal(48);
				expect(alphaF(48, 128, darken, 0.4)).to.equal(96);
				expect(alphaF(0,  255, darken, 0))  .to.equal(255);
				expect(alphaF(255,  0, darken, 0))  .to.equal(0);
			});
		});
		
		describe("multiply()", () => {
			const {multiply} = BlendModes;
			it("blends opaque values", () => {
				expect(multiply(128, 48)).to.be.closeTo(24, 1);
				expect(multiply(48, 128)).to.be.closeTo(24, 1);
				expect(multiply(0,  255)).to.equal(0);
				expect(multiply(255,  0)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, multiply, 0.4)).to.be.closeTo(38, 1);
				expect(alphaF(48, 128, multiply, 0.4)).to.be.closeTo(86, 1);
				expect(alphaF(0,  255, multiply, 0))  .to.equal(255);
				expect(alphaF(255,  0, multiply, 0))  .to.equal(0);
			});
		});
		
		describe("average()", () => {
			// NB: No way of reproducing this in Photoshop
			const {average} = BlendModes;
			it("blends opaque values", () => {
				expect(average(0, 255)).to.be.closeTo(128, 1);
				expect(average(255, 0)).to.be.closeTo(1, 128);
			});
			it("blends translucent values", () => {
				expect(alphaF(0, 255, average, 0.5)).to.be.closeTo(192, 1);
				expect(alphaF(255, 0, average, 0.5)).to.be.closeTo(64, 1);
				expect(alphaF(0, 255, average, 0))  .to.equal(255);
				expect(alphaF(255, 0, average, 0))  .to.equal(0);
			});
		});
		
		describe("add()", () => {
			const {add} = BlendModes;
			it("blends opaque values", () => {
				expect(add(128, 48)).to.equal(176);
				expect(add(48, 128)).to.equal(176);
				expect(add(0,  255)).to.equal(255);
				expect(add(255,  0)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, add, 0.4)).to.be.closeTo(99, 1);
				expect(alphaF(48, 128, add, 0.4)).to.be.closeTo(147, 1);
				expect(alphaF(0, 255,  add, 0))  .to.equal(255);
				expect(alphaF(255, 0,  add, 0))  .to.equal(0);
			});
		});
		
		describe("difference()", () => {
			const {difference} = BlendModes;
			it("blends opaque values", () => {
				expect(difference(128,  48)).to.equal(80);
				expect(difference(48,  128)).to.equal(80);
				expect(difference(245, 255)).to.equal(10);
				expect(difference(255, 255)).to.equal(0);
				expect(difference(0,   255)).to.equal(255);
				expect(difference(255,   0)).to.equal(255);
				expect(difference(0,     0)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, difference, 0.4)).to.be.closeTo(61, 1);
				expect(alphaF(48,  128, difference, 0.4)).to.be.closeTo(109, 1);
				expect(alphaF(245, 255, difference, 0.4)).to.be.closeTo(157, 1);
				expect(alphaF(255, 255, difference, 0.4)).to.be.closeTo(153, 1);
				expect(alphaF(0,     0, difference, 0.4)).to.equal(0);
				expect(alphaF(0,   255, difference, 0.4)).to.equal(255);
				expect(alphaF(0,   255, difference, 0))  .to.equal(255);
				expect(alphaF(255,   0, difference, 0))  .to.equal(0);
			});
		});
		
		describe("negation()", () => {
			// NB: Not available in Photoshop
			const {negation} = BlendModes;
			it("blends opaque values", () => {
				expect(negation(128, 48)).to.equal(176);
				expect(negation(48, 128)).to.equal(176);
				expect(negation(0,  255)).to.equal(255);
				expect(negation(255,  0)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, negation, 0.4)).to.be.closeTo(99, 1);
				expect(alphaF(48, 128, negation, 0.4)).to.be.closeTo(147, 1);
				expect(alphaF(0,  255, negation, 0))  .to.equal(255);
				expect(alphaF(255,  0, negation, 0))  .to.equal(0);
			});
		});
		
		describe("screen()", () => {
			const {screen} = BlendModes;
			it("blends opaque values", () => {
				expect(screen(128, 48)).to.be.closeTo(152, 1);
				expect(screen(48, 128)).to.be.closeTo(152, 1);
				expect(screen(0,  255)).to.equal(255);
				expect(screen(255,  0)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, screen, 0.4)).to.be.closeTo(90, 1);
				expect(alphaF(48, 128, screen, 0.4)).to.be.closeTo(138, 1);
				expect(alphaF(0,  255, screen, 0))  .to.equal(255);
				expect(alphaF(255,  0, screen, 0))  .to.equal(0);
			});
		});
		
		describe("exclusion()", () => {
			const {exclusion} = BlendModes;
			it("blends opaque values", () => {
				expect(exclusion(128,  48)).to.be.closeTo(128, 1);
				expect(exclusion(128, 200)).to.be.closeTo(128, 1);
				expect(exclusion(0,  255)).to.equal(255);
				expect(exclusion(255,  0)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, exclusion, 0.4)).to.be.closeTo(80, 1);
				expect(alphaF(48, 128, exclusion, 0.4)).to.be.closeTo(128, 1);
				expect(alphaF(0,  255, exclusion, 0))  .to.equal(255);
				expect(alphaF(255,  0, exclusion, 0))  .to.equal(0);
			});
		});
		
		describe("overlay()", () => {
			const {overlay} = BlendModes;
			it("blends opaque values", () => {
				expect(overlay(128,  48)).to.be.closeTo(48, 1);
				expect(overlay(48,  128)).to.be.closeTo(49, 1);
				expect(overlay(108, 198)).to.be.closeTo(189, 1);
				expect(overlay(0,  255)).to.equal(255);
				expect(overlay(255,  0)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, overlay, 0.4)).to.be.closeTo(48, 1);
				expect(alphaF(48,  128, overlay, 0.4)).to.be.closeTo(96, 1);
				expect(alphaF(108, 198, overlay, 0.4)).to.be.closeTo(194, 1);
				expect(alphaF(0,   255, overlay, 0))  .to.equal(255);
				expect(alphaF(255,   0, overlay, 0))  .to.equal(0);
			});
		});
		
		describe("softLight()", () => {
			const {softLight} = BlendModes;
			it("blends opaque values", () => {
				expect(softLight(128,  48)).to.be.closeTo(48, 1);
				expect(softLight(48,  128)).to.be.closeTo(88, 1);
				expect(softLight(108, 198)).to.be.closeTo(193, 1);
				expect(softLight(0,   255)).to.equal(255);
				expect(softLight(255,   0)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, softLight, 0.4)).to.be.closeTo(48, 1);
				expect(alphaF(48,  128, softLight, 0.4)).to.be.closeTo(112, 1);
				expect(alphaF(108, 198, softLight, 0.4)).to.be.closeTo(196, 1);
				expect(alphaF(0,   255, softLight, 0))  .to.equal(255);
				expect(alphaF(255,   0, softLight, 0))  .to.equal(0);
			});
		});
		
		describe("hardLight()", () => {
			const {hardLight} = BlendModes;
			it("blends opaque values", () => {
				expect(hardLight(48,  128)).to.be.closeTo(48, 1);
				expect(hardLight(128,  48)).to.be.closeTo(49, 1);
				expect(hardLight(198, 108)).to.be.closeTo(189, 1);
				expect(hardLight(255,  0)).to.equal(255);
				expect(hardLight(0,  255)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(48,  128, hardLight, 0.4)).to.be.closeTo(96, 1);
				expect(alphaF(128,  48, hardLight, 0.4)).to.be.closeTo(48, 1);
				expect(alphaF(198, 108, hardLight, 0.4)).to.be.closeTo(140, 1);
				expect(alphaF(255,   0, hardLight, 0))  .to.equal(0);
				expect(alphaF(0,   255, hardLight, 0))  .to.equal(255);
			});
		});
		
		describe("colourDodge()", () => {
			const {colourDodge} = BlendModes;
			it("blends opaque values", () => {
				expect(colourDodge(128,  48)).to.be.closeTo(96, 1);
				expect(colourDodge(48,  128)).to.be.closeTo(158, 1);
				expect(colourDodge(108, 198)).to.be.closeTo(255, 1);
				expect(colourDodge(0,  255)).to.equal(255);
				expect(colourDodge(255,  0)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, colourDodge, 0.4)).to.be.closeTo(67, 1);
				expect(alphaF(48,  128, colourDodge, 0.4)).to.be.closeTo(140, 1);
				expect(alphaF(108, 198, colourDodge, 0.4)).to.be.closeTo(221, 1);
				expect(alphaF(0,   255, colourDodge, 0))  .to.equal(255);
				expect(alphaF(255,   0, colourDodge, 0))  .to.equal(0);
			});
		});
		
		describe("colourBurn()", () => {
			const {colourBurn} = BlendModes;
			it("blends opaque values", () => {
				expect(colourBurn(128,  48)).to.equal(0);
				expect(colourBurn(48,  128)).to.equal(0);
				expect(colourBurn(108, 198)).to.be.closeTo(120, 1);
				expect(colourBurn(0,  255)).to.equal(0);
				expect(colourBurn(255,  0)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, colourBurn, 0.4)).to.be.closeTo(29, 1);
				expect(alphaF(48,  128, colourBurn, 0.4)).to.be.closeTo(77, 1);
				expect(alphaF(108, 198, colourBurn, 0.4)).to.be.closeTo(167, 1);
				expect(alphaF(0,   255, colourBurn, 0))  .to.equal(255);
				expect(alphaF(255,   0, colourBurn, 0))  .to.equal(0);
			});
		});
		
		describe("linearDodge()", () => {
			const {linearDodge} = BlendModes;
			it("blends opaque values", () => {
				expect(linearDodge(128, 48)).to.equal(176);
				expect(linearDodge(48, 128)).to.equal(176);
				expect(linearDodge(0,  255)).to.equal(255);
				expect(linearDodge(255,  0)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128, 48, linearDodge, 0.4)).to.be.closeTo(99, 1);
				expect(alphaF(48, 128, linearDodge, 0.4)).to.be.closeTo(147, 1);
				expect(alphaF(0, 255,  linearDodge, 0))  .to.equal(255);
				expect(alphaF(255, 0,  linearDodge, 0))  .to.equal(0);
			});
		});
		
		describe("linearBurn()", () => {
			const {linearBurn} = BlendModes;
			it("blends opaque values", () => {
				expect(linearBurn(128,  48)).to.equal(0);
				expect(linearBurn(48,  128)).to.equal(0);
				expect(linearBurn(128, 159)).to.equal(32);
				expect(linearBurn(0,   255)).to.equal(0);
				expect(linearBurn(255,   0)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, linearBurn, 0.4)).to.be.closeTo(29, 1);
				expect(alphaF(48,  128, linearBurn, 0.4)).to.be.closeTo(77, 1);
				expect(alphaF(128, 159, linearBurn, 0.4)).to.be.closeTo(108, 1);
				expect(alphaF(0,   255, linearBurn, 0))  .to.equal(255);
				expect(alphaF(255,   0, linearBurn, 0))  .to.equal(0);
			});
		});
		
		describe("linearLight()", () => {
			const {linearLight} = BlendModes;
			it("blends opaque values", () => {
				expect(linearLight(128,  48)).to.equal(48);
				expect(linearLight(129,  48)).to.equal(50);
				expect(linearLight(160, 180)).to.equal(244);
				expect(linearLight(48,  128)).to.equal(0);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, linearLight, 0.4)).to.be.closeTo(48, 1);
				expect(alphaF(129,  48, linearLight, 0.4)).to.be.closeTo(49, 1);
				expect(alphaF(160, 180, linearLight, 0.4)).to.be.closeTo(206, 1);
				expect(alphaF(48,  128, linearLight, 0.4)).to.be.closeTo(77, 1);
			});
		});
		
		describe("vividLight()", () => {
			const {vividLight} = BlendModes;
			it("blends opaque values", () => {
				expect(vividLight(128,  48)).to.be.closeTo(48, 1);
				expect(vividLight(134,  48)).to.be.closeTo(50, 1);
				expect(vividLight(160, 180)).to.be.closeTo(241, 1);
				expect(vividLight(48,  128)).to.be.closeTo(0, 1);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, vividLight, 0.4)).to.be.closeTo(48, 1);
				expect(alphaF(134,  48, vividLight, 0.4)).to.be.closeTo(49, 1);
				expect(alphaF(160, 180, vividLight, 0.4)).to.be.closeTo(204, 1);
				expect(alphaF(48,  128, vividLight, 0.4)).to.be.closeTo(77, 1);
			});
		});
		
		describe("pinLight()", () => {
			const {pinLight} = BlendModes;
			it("blends opaque values", () => {
				expect(pinLight(128,  48)).to.be.closeTo(48, 1);
				expect(pinLight(48,  134)).to.be.closeTo(96, 1);
				expect(pinLight(160, 180)).to.be.closeTo(180, 1);
				expect(pinLight(180, 160)).to.be.closeTo(160, 1);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, pinLight, 0.4)).to.be.closeTo(48, 1);
				expect(alphaF(48,  134, pinLight, 0.4)).to.be.closeTo(119, 1);
				expect(alphaF(160, 180, pinLight, 0.4)).to.be.closeTo(180, 1);
				expect(alphaF(180, 160, pinLight, 0.4)).to.be.closeTo(160, 1);
			});
		});
		
		describe("hardMix()", () => {
			const {hardMix} = BlendModes;
			it("blends opaque values", () => {
				expect(hardMix(128,  48)).to.equal(0);
				expect(hardMix(48,  134)).to.equal(0);
				expect(hardMix(160, 180)).to.equal(255);
				expect(hardMix(180, 160)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, hardMix, 0.4)).to.be.closeTo(29, 1);
				expect(alphaF(48,  134, hardMix, 0.4)).to.be.closeTo(80, 1);
				expect(alphaF(160, 180, hardMix, 0.4)).to.be.closeTo(210, 1);
				expect(alphaF(180, 160, hardMix, 0.4)).to.be.closeTo(198, 1);
			});
		});
		
		describe("reflect()", () => {
			const {reflect} = BlendModes;
			it("blends opaque values", () => {
				expect(reflect(128,  48)).to.be.closeTo(79, 1);
				expect(reflect(48,  134)).to.be.closeTo(19, 1);
				expect(reflect(160, 180)).to.equal(255);
				expect(reflect(180, 160)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, reflect, 0.4)).to.be.closeTo(60, 1);
				expect(alphaF(48,  134, reflect, 0.4)).to.be.closeTo(88, 1);
				expect(alphaF(160, 180, reflect, 0.4)).to.be.closeTo(210, 1);
				expect(alphaF(180, 160, reflect, 0.4)).to.be.closeTo(198, 1);
			});
		});
		
		describe("glow()", () => {
			const {glow} = BlendModes;
			it("blends opaque values", () => {
				expect(glow(128,  48)).to.be.closeTo(18, 1);
				expect(glow(48,  134)).to.be.closeTo(86, 1);
				expect(glow(160, 180)).to.equal(255);
				expect(glow(180, 160)).to.equal(255);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, glow, 0.4)).to.be.closeTo(36, 1);
				expect(alphaF(48,  134, glow, 0.4)).to.be.closeTo(115, 1);
				expect(alphaF(160, 180, glow, 0.4)).to.be.closeTo(210, 1);
				expect(alphaF(180, 160, glow, 0.4)).to.be.closeTo(198, 1);
			});
		});
		
		describe("phoenix()", () => {
			const {phoenix} = BlendModes;
			it("blends opaque values", () => {
				expect(phoenix(128,  48)).to.equal(175);
				expect(phoenix(48,  134)).to.equal(169);
				expect(phoenix(160, 180)).to.equal(235);
				expect(phoenix(180, 160)).to.equal(235);
			});
			it("blends translucent values", () => {
				expect(alphaF(128,  48, phoenix, 0.4)).to.be.closeTo(99, 1);
				expect(alphaF(48,  134, phoenix, 0.4)).to.be.closeTo(148, 1);
				expect(alphaF(160, 180, phoenix, 0.4)).to.be.closeTo(202, 1);
				expect(alphaF(180, 160, phoenix, 0.4)).to.be.closeTo(190, 1);
			});
		});
	});
	
	describe("Colour conversion", () => {
		let cmykTests, hslTests, hsvTests, mixedTests;
		before("Loading fixtures", async () => {
			cmykTests  = await import("./fixtures/colours/cmyk-tests.mjs");
			hslTests   = await import("./fixtures/colours/hsl-tests.mjs");
			hsvTests   = await import("./fixtures/colours/hsv-tests.mjs");
			mixedTests = await import("./fixtures/colours/mixed-tests.mjs");
		});
		
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
