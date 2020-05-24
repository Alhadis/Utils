import * as utils from "../index.mjs";
import {endianness} from "os";

describe("Miscellaneous functions", () => {
	const htmlAllFn = "function HTMLAllCollection() { [native code] }";
	const haveHTMLAll = (
		"object"    === typeof window &&
		"undefined" === typeof module &&
		"function"  === typeof window.HTMLAllCollection &&
		htmlAllFn   === Function.prototype.toString.call(window.HTMLAllCollection)
	);
	
	describe("collectStrings()", () => {
		const {collectStrings} = utils;
		it("splits strings by whitespace", () => {
			expect(collectStrings("foo bar"))     .to.eql(["foo", "bar"]);
			expect(collectStrings("foo bar baz")) .to.eql(["foo", "bar", "baz"]);
		});
		it("trims strings before splitting them", () => {
			expect(collectStrings("foo "))        .to.eql(["foo"]);
			expect(collectStrings(" foo"))        .to.eql(["foo"]);
			expect(collectStrings(" foo bar "))   .to.eql(["foo", "bar"]);
		});
		it("flattens simple arrays", () => {
			expect(collectStrings(["foo", ["bar"]]))          .to.eql(["foo", "bar"]);
			expect(collectStrings(["foo", ["bar"], ["baz"]])) .to.eql(["foo", "bar", "baz"]);
			expect(collectStrings(["foo", ["bar", "baz"]]))   .to.eql(["foo", "bar", "baz"]);
		});
		it("flattens nested arrays", () => {
			expect(collectStrings(["foo", ["bar", ["baz"]], "qux"]))   .to.eql(["foo", "bar", "baz", "qux"]);
			expect(collectStrings(["foo", ["bar", ["baz", "qux"]]]))   .to.eql(["foo", "bar", "baz", "qux"]);
			expect(collectStrings(["foo", ["bar", ["baz", ["qux"]]]])) .to.eql(["foo", "bar", "baz", "qux"]);
		});
		it("splits strings in arrays", () => {
			expect(collectStrings(["foo bar"]))                 .to.eql(["foo", "bar"]);
			expect(collectStrings(["foo", "bar baz", "qux"]))   .to.eql(["foo", "bar", "baz", "qux"]);
			expect(collectStrings(["foo", ["bar baz"], "qux"])) .to.eql(["foo", "bar", "baz", "qux"]);
		});
		it("ignores empty values", () => {
			expect(collectStrings([])).to.eql([]);
			expect(collectStrings("")).to.eql([]);
			expect(collectStrings(" ")).to.eql([]);
			expect(collectStrings(["", []])).to.eql([]);
			expect(collectStrings(["", [""]])).to.eql([]);
		});
		it("handles circular references", () => {
			const a = ["foo", ["bar"]];
			const b = [["baz"], "qux"];
			a.push(b);
			b.push(a);
			expect(collectStrings(a)).to.eql(["foo", "bar", "baz", "qux"]);
			expect(collectStrings(b)).to.eql(["baz", "qux", "foo", "bar"]);
			expect(collectStrings([b, b, b, a])).to.eql(["baz", "qux", "foo", "bar"]);
		});
	});
	
	describe("getProperties()", () => {
		const {getProperties} = utils;
		it("returns properties defined on an object", () => {
			const obj = Object.create(null);
			const foo = {enumerable: false, configurable: false, writable: false, value: "Foo"};
			const bar = {enumerable: true,  configurable: true,  writable: true,  value: "Bar"};
			Object.defineProperties(obj, {foo, bar});
			expect(getProperties(obj)).to.eql(new Map([["foo", foo], ["bar", bar]]));
		});
		it("returns properties inherited from a prototype", () => {
			class A { foo(){} }
			class B extends A {}
			expect(getProperties(new B()).get("foo")).to.eql({
				value: A.prototype.foo,
				enumerable: false,
				configurable: true,
				writable: true,
			});
		});
		it("gives precedence to locally-defined properties", () => {
			class A { foo(){} }
			class B extends A { foo(){} }
			expect(getProperties(new B()).get("foo")).to.eql({
				value: B.prototype.foo,
				enumerable: false,
				configurable: true,
				writable: true,
			});
		});
		it("returns Symbol-keyed properties", () => {
			const obj = Object.create(null);
			const fn  = () => true;
			obj[Symbol.iterator] = fn;
			const props = getProperties(obj);
			expect(props).to.eql(new Map([[Symbol.iterator, {
				value: fn,
				configurable: true,
				enumerable: true,
				writable: true,
			}]]));
		});
	});
	
	describe("hex()", () => {
		const {hex} = utils;
		it("formats numbers as hexadecimal", () => {
			expect(hex(0))            .to.equal("00");
			expect(hex(5))            .to.equal("05");
			expect(hex(12))           .to.equal("0C");
			expect(hex(127))          .to.equal("7F");
			expect(hex(1, 2))         .to.equal("01 02");
			expect(hex(30, 31, 32))   .to.equal("1E 1F 20");
			expect(hex(-7))           .to.equal("-07");
			expect(hex(-15))          .to.equal("-0F");
			expect(hex(256, 1020))    .to.equal("100 3FC");
		});
		it("formats bigints as hexadecimal", () => {
			expect(hex(5n))           .to.equal("05");
			expect(hex(12n))          .to.equal("0C");
			expect(hex(127n))         .to.equal("7F");
			expect(hex(1n, 2n))       .to.equal("01 02");
			expect(hex(30n, 31n, 32n)).to.equal("1E 1F 20");
		});
		it("formats strings as a list of codepoints", () => {
			expect(hex("ABC"))        .to.equal("41 42 43");
			expect(hex("A Z"))        .to.equal("41 20 5A");
			expect(hex("ABC", "XYZ")) .to.equal("41 42 43 58 59 5A");
		});
		it("formats arrays of numbers", () => {
			expect(hex([20, 35, 4]))   .to.equal("14 23 04");
			expect(hex([-10, 512]))    .to.equal("-0A 200");
			expect(hex([4], [6]))      .to.equal("04 06");
		});
		it("formats arrays of bigints", () => {
			expect(hex([20n, 35n, 4n])).to.equal("14 23 04");
			expect(hex([-10n, 512n]))  .to.equal("-0A 200");
			expect(hex([4n], [6n]))    .to.equal("04 06");
		});
		it("formats booleans", () => {
			expect(hex(false))         .to.equal("00");
			expect(hex(true))          .to.equal("01");
			expect(hex(true, false))   .to.equal("01 00");
			expect(hex(false, true))   .to.equal("00 01");
		});
		it("formats typed arrays", () => {
			expect(hex(new Int8Array([24, -5, 0]))) .to.equal("18 -05 00");
			expect(hex(new Int16Array([125, -256]))).to.equal("7D -100");
			expect(hex(new Uint8Array([4, 0, 255]))).to.equal("04 00 FF");
			expect(hex(new Uint16Array([10, 512]))) .to.equal("0A 200");
		});
		it("formats array buffers", () => {
			const {buffer} = new Uint8Array([0, 1, 2, 3, 4]);
			expect(hex(buffer)).to.equal("00 01 02 03 04");
		});
		it("formats boxed primitives", () => {
			expect(hex(new Number(65)))   .to.equal("41");
			expect(hex(new String("ABC"))).to.equal("41 42 43");
			expect(hex(new Boolean(true))).to.equal("01");
			expect(hex(new Boolean(false))).to.equal("00");
		});
		it("formats subclassed boxed primitives", () => {
			class Metric extends Number  {}
			class Name   extends String  {}
			class Switch extends Boolean {}
			expect(hex(new Metric(65)))   .to.equal("41");
			expect(hex(new Name("ABC")))  .to.equal("41 42 43");
			expect(hex(new Switch(true))) .to.equal("01");
			expect(hex(new Switch(false))).to.equal("00");
		});
		it("formats non-numeric values as `--`", () => {
			expect(hex(NaN))          .to.equal("--");
			expect(hex({}))           .to.equal("--");
			expect(hex(1, NaN, 3))    .to.equal("01 -- 03");
			expect(hex([1, NaN, 3]))  .to.equal("01 -- 03");
			expect(hex(NaN, NaN))     .to.equal("-- --");
			expect(hex([NaN, NaN]))   .to.equal("-- --");
		});
	});
	
	describe("isBrowser()", () => {
		const {isBrowser} = utils;
		if(haveHTMLAll)
			it("returns `true` for browser environments", () =>
				expect(isBrowser()).to.be.true);
		else{
			afterEach(() => unspoofBrowser());
			it("returns `false` for non-browser environments", () =>
				expect(isBrowser()).to.be.false);
			it("isn't fooled by user-created globals", () => {
				spoofBrowser();
				expect(isBrowser()).to.be.false;
			});
		}
	});
	
	describe("isByteArray()", () => {
		const {isByteArray} = utils;
		it("returns true for arrays of 8-bit integers", () => {
			expect(isByteArray([0, 45])).to.be.true;
			expect(isByteArray([255, 128])).to.be.true;
			expect(isByteArray([256])).to.be.false;
			expect(isByteArray([-1, 128])).to.be.false;
			expect(isByteArray([1, -128])).to.be.false;
			expect(isByteArray(new Int8Array([1, 8, -27]))).to.be.false;
			expect(isByteArray(new Int8Array([1, 8, 127]))).to.be.true;
			expect(isByteArray(new Uint8Array([145, 225]))).to.be.true;
			expect(isByteArray(new Uint8ClampedArray([0]))).to.be.true;
			expect(isByteArray(new ArrayBuffer([1, 2, 3]))).to.be.true;
		});
		it("returns false for arrays with floating-points", () => {
			expect(isByteArray([0, 45.3])).to.be.false;
			expect(isByteArray([255, 12.8])).to.be.false;
			expect(isByteArray([2.56])).to.be.false;
			expect(isByteArray([-1.5, 128])).to.be.false;
			expect(isByteArray([-1.5, 128])).to.be.false;
		});
		it("returns false for empty arrays", () => {
			expect(isByteArray([])).to.be.false;
			expect(isByteArray(new Array(10))).to.be.false;
		});
		it("returns false for non-arrays", () => {
			expect(isByteArray({})).to.be.false;
			expect(isByteArray(null)).to.be.false;
			expect(isByteArray(true)).to.be.false;
			expect(isByteArray(undefined)).to.be.false;
		});
	});
	
	describe("isLittleEndian()", () => {
		const {isLittleEndian} = utils;
		it("accurately identifies the host's endianness", () =>
			expect(isLittleEndian()).to.equal("LE" === endianness()));
	});
	
	describe("isNegativeNaN()", () => {
		const {isNegativeNaN} = utils;
		
		it("returns true if `-NaN` contains a sign bit", () => {
			// NB: Results ultimately depend on the engine's implementation details
			const view = new DataView(new ArrayBuffer(8));
			const sNaN = -NaN;
			view.setFloat64(0, sNaN);
			const isSigned = 0xFF === view.getUint8(0);
			expect(isNegativeNaN(sNaN)).to.equal(isSigned);
		});
		
		it("returns false for `NaN`", () =>
			expect(isNegativeNaN(NaN)).to.be.false);
		
		it("returns false for other numbers", () => {
			expect(isNegativeNaN(45)).to.be.false;
			expect(isNegativeNaN(-4)).to.be.false;
			expect(isNegativeNaN(Infinity)).to.be.false;
			expect(isNegativeNaN(-Infinity)).to.be.false;
			expect(isNegativeNaN(-0)).to.be.false;
		});
		
		it("returns false for non-numeric values", () => {
			expect(isNegativeNaN("foo")).to.be.false;
			expect(isNegativeNaN({})).to.be.false;
		});
	});
	
	describe("isPrimitive()", () => {
		const {isPrimitive} = utils;
		it("identifies `undefined`", () => {
			expect(isPrimitive(undefined)).to.be.true;
			expect(isPrimitive()).to.be.true;
		});
		it("identifies `null`", () => {
			expect(isPrimitive(null)).to.be.true;
			expect(isPrimitive(Object.create(null))).to.be.false;
		});
		it("identifies booleans", () => {
			expect(isPrimitive(false)).to.be.true;
			expect(isPrimitive(true)) .to.be.true;
			expect(isPrimitive(new Boolean(false))).to.be.false;
			expect(isPrimitive(new Boolean(true))) .to.be.false;
		});
		it("identifies numbers", () => {
			expect(isPrimitive(0)).to.be.true;
			expect(isPrimitive(1)).to.be.true;
			expect(isPrimitive(85)).to.be.true;
			expect(isPrimitive(4.5)).to.be.true;
			expect(isPrimitive(-0)).to.be.true;
			expect(isPrimitive(-2)).to.be.true;
			expect(isPrimitive(-4.53)).to.be.true;
			expect(isPrimitive(NaN)).to.be.true;
			expect(isPrimitive(Infinity)).to.be.true;
			expect(isPrimitive(-Infinity)).to.be.true;
			expect(isPrimitive(Number.POSITIVE_INFINITY)).to.be.true;
			expect(isPrimitive(Number.NEGATIVE_INFINITY)).to.be.true;
			expect(isPrimitive(new Number(54))).to.be.false;
			expect(isPrimitive(new Number(0))).to.be.false;
			expect(isPrimitive(new Number(NaN))).to.be.false;
		});
		it("identifies bigints", () => {
			expect(isPrimitive(450n)).to.be.true;
			expect(isPrimitive(-450n)).to.be.true;
		});
		it("identifies strings", () => {
			expect(isPrimitive("")).to.be.true;
			expect(isPrimitive("abc")).to.be.true;
			expect(isPrimitive("xyz")).to.be.true;
			expect(isPrimitive(new String(""))).to.be.false;
			expect(isPrimitive(new String("abc"))).to.be.false;
			expect(isPrimitive(new String("xyz"))).to.be.false;
			class ExtendedString extends String {}
			expect(isPrimitive(new ExtendedString(""))).to.be.false;
			expect(isPrimitive(new ExtendedString("abc"))).to.be.false;
			expect(isPrimitive(new ExtendedString("xyz"))).to.be.false;
		});
		it("identifies symbols", () => {
			expect(isPrimitive(Symbol("foo"))).to.be.true;
			expect(isPrimitive(Symbol.iterator)).to.be.true;
			expect(isPrimitive(Symbol.toStringTag)).to.be.true;
			expect(isPrimitive(new Object(Symbol("bar")))).to.be.false;
			expect(isPrimitive(new Object(Symbol.iterator))).to.be.false;
			expect(isPrimitive(new Object(Symbol.toStringTag))).to.be.false;
		});
		it("identifies objects", () => {
			expect(isPrimitive({})).to.be.false;
			expect(isPrimitive([])).to.be.false;
			expect(isPrimitive([1, 3])).to.be.false;
			expect(isPrimitive({a: 1})).to.be.false;
			expect(isPrimitive({valueOf: () => true})).to.be.false;
			expect(isPrimitive(Object.create(null))).to.be.false;
			expect(isPrimitive(new Object(false))).to.be.false;
			expect(isPrimitive(new Array(500))).to.be.false;
			expect(isPrimitive(Number.prototype)).to.be.false;
			expect(isPrimitive(/abc/)).to.be.false;
			expect(isPrimitive(new Date())).to.be.false;
			expect(isPrimitive(new Date("1975-04-02T00:00:00Z"))).to.be.false;
			expect(isPrimitive(new Date("Invalid date"))).to.be.false;
			expect(isPrimitive(new Error("Whoops"))).to.be.false;
			expect(isPrimitive(Promise.resolve())).to.be.false;
			class ExtendedObject extends Object {}
			class ExtendedDate extends Date {}
			expect(isPrimitive(new ExtendedObject())).to.be.false;
			expect(isPrimitive(new ExtendedDate())).to.be.false;
			expect(isPrimitive(new ExtendedDate(40))).to.be.false;
		});
		it("identifies functions", () => {
			expect(isPrimitive(function(){ return this; })).to.be.false;
			expect(isPrimitive(function foo(){ return this; })).to.be.false;
			expect(isPrimitive(function * foo(){ yield 520; })).to.be.false;
			expect(isPrimitive(async function(){ return this; })).to.be.false;
			expect(isPrimitive(async function foo(){ return 86; })).to.be.false;
			expect(isPrimitive(async function * foo(){ yield 52; })).to.be.false;
			expect(isPrimitive(() => 4 + 62 * -150)).to.be.false;
			expect(isPrimitive(() => { console.log("Foo"); })).to.be.false;
			expect(isPrimitive(async () => undefined)).to.be.false;
			expect(isPrimitive(async () => { console.log("Foo"); })).to.be.false;
			expect(isPrimitive(class {})).to.be.false;
			expect(isPrimitive(Function)).to.be.false;
			expect(isPrimitive(Object)).to.be.false;
			expect(isPrimitive(Number)).to.be.false;
			expect(isPrimitive(Number.prototype)).to.be.false;
			expect(isPrimitive(Function.prototype)).to.be.false;
			class ExtendedFunction extends Function {}
			expect(isPrimitive(ExtendedFunction)).to.be.false;
			expect(isPrimitive(new ExtendedFunction())).to.be.false;
			expect(isPrimitive(new ExtendedFunction("4 + 2"))).to.be.false;
		});
		
		// NOTE: The following suite contains weird-looking tests, because `document.all`
		// is impossible to reliably test without a host-provided exotic object (meaning
		// the function won't be fooled by spoofed or emulated browser globals).
		describe("When identifying `document.all`", () => {
			if(!haveHTMLAll){
				before(() => spoofBrowser());
				after(() => unspoofBrowser());
			}
			it("uses its [[IsHTMLDDA]] internal slot", () => {
				if(haveHTMLAll){
					expect(isPrimitive(document.all)).to.be.false;
					expect("undefined" === typeof document.all).to.be.true;
					expect(window.HTMLAllCollection === document.all.constructor).to.be.true;
				}
				else{
					expect(isPrimitive(document.all)).to.be.false;
					expect("object" === typeof document.all).to.be.true;
					expect(window.HTMLAllCollection === document.all.constructor).to.be.true;
				}
			});
		});
	});
	
	describe("isString()", () => {
		const {isString} = utils;
		it("identifies literals", () => {
			expect(isString("foo")).to.be.true;
			expect(isString("")).to.be.true;
			expect(isString(0xF00)).to.be.false;
			expect(isString(null)).to.be.false;
			expect(isString(undefined)).to.be.false;
		});
		it("identifies objects", () => {
			expect(isString(new String("foo"))).to.be.true;
			expect(isString(new String(""))).to.be.true;
			expect(isString({})).to.be.false;
			expect(isString(/a/)).to.be.false;
			expect(isString({[Symbol.toStringTag]: "String"})).to.be.false;
		});
		it("identifies subclasses", () => {
			class IndentedString extends String {
				constructor(source){
					super((source + "").replace(/^/g, "\t"));
				}
			}
			const str = new IndentedString("A");
			expect(str).to.match(/^\tA$/);
			expect(isString(str)).to.be.true;
		});
	});
	
	describe("isTypedArray()", () => {
		const {isTypedArray} = utils;
		it("identifies Int8Arrays",         () => expect(isTypedArray(new Int8Array([1]))).to.be.true);
		it("identifies Uint8Arrays",        () => expect(isTypedArray(new Uint8Array([1]))).to.be.true);
		it("identifies Uint8ClampedArrays", () => expect(isTypedArray(new Uint8ClampedArray([1]))).to.be.true);
		it("identifies Int16Arrays",        () => expect(isTypedArray(new Int16Array([1]))).to.be.true);
		it("identifies Uint16Arrays",       () => expect(isTypedArray(new Uint16Array([1]))).to.be.true);
		it("identifies Int32Arrays",        () => expect(isTypedArray(new Int32Array([1]))).to.be.true);
		it("identifies Uint32Arrays",       () => expect(isTypedArray(new Uint32Array([1]))).to.be.true);
		it("identifies Float32Arrays",      () => expect(isTypedArray(new Float32Array([1]))).to.be.true);
		it("identifies Float64Arrays",      () => expect(isTypedArray(new Float64Array([1]))).to.be.true);
		it("identifies BigInt64Arrays",     () => expect(isTypedArray(new BigInt64Array([1n]))).to.be.true);
		it("identifies BigUint64Arrays",    () => expect(isTypedArray(new BigUint64Array([1n]))).to.be.true);
		it("identifies ArrayBuffers",       () => expect(isTypedArray(new ArrayBuffer([1]))).to.be.false);
		it("identifies Node's buffers",     () => expect(isTypedArray(Buffer.from([1]))).to.be.true);
		it("identifies ordinary arrays",    () => expect(isTypedArray([1, 2, 3])).to.be.false);
		it("identifies non-array values",   () => expect(isTypedArray(true)).to.be.false);
	});
	
	describe("keyGrep()", () => {
		const {keyGrep} = utils;
		it("filters properties that match a pattern", () => {
			const obj = {foo: true, bar: false, 1: "one", 2: "two", footer: ""};
			expect(keyGrep(obj, /^foo/)).to.eql({foo: true, footer: ""});
			expect(keyGrep(obj, /\d/))  .to.eql({1: "one", 2: "two"});
			expect(keyGrep(obj, /\t/))  .to.eql({});
		});
		it("matches string-type patterns literally", () => {
			expect(keyGrep({".": true}, ".")).to.eql({".": true});
			expect(keyGrep({"\\d+": true, 1: false}, "\\d+")).to.eql({"\\d+": true});
		});
		it("returns an object with a null prototype", () => {
			const obj = keyGrep({}, /./);
			expect(obj).to.eql({});
			expect(obj).not.to.have.property("constructor");
			expect(obj).not.to.have.property("__proto__");
		});
		it("ignores non-enumerable properties", () => {
			let calls = 0;
			const obj = {};
			Object.defineProperty(obj, "bar", {configurable: true, get: () => ++calls});
			expect(keyGrep(obj, /bar/)).to.eql({});
			expect(calls).to.equal(0);
			Object.defineProperty(obj, "bar", {enumerable: true});
			expect(keyGrep(obj, /bar/)).to.eql({bar: 1});
		});
		it("doesn't mutate the subject", () => {
			const obj = {foo: 1, bar: 2, baz: 3};
			expect(keyGrep(obj, /^.a/)).to.eql({bar: 2, baz: 3}).and.not.equal(obj);
			expect(obj).to.eql({foo: 1, bar: 2, baz: 3});
		});
	});
	
	describe("parseKeywords()", () => {
		const {parseKeywords} = utils;
		it("populates an object with boolean properties", () => {
			expect(parseKeywords("top"))          .to.eql({top: true});
			expect(parseKeywords(["top"]))        .to.eql({top: true});
			expect(parseKeywords("top left"))     .to.eql({top: true, left: true});
			expect(parseKeywords(["top left"]))   .to.eql({top: true, left: true});
			expect(parseKeywords(["top", "left"])).to.eql({top: true, left: true});
		});
		it("returns an object with a null prototype", () => {
			const keys = parseKeywords("one two three");
			expect(keys).to.eql({one: true, two: true, three: true});
			expect(keys).not.to.have.property("__proto__");
			expect(keys).not.to.have.property("constructor");
		});
		it("returns null for empty input", () => {
			expect(parseKeywords("")).to.be.null;
			expect(parseKeywords(null)).to.be.null;
		});
	});
	
	describe("partition()", () => {
		const {partition} = utils;
		it("divides arrays", () => {
			expect(partition(["A", "B", "C", "D"], 2)).to.eql([["A", "B"], ["C", "D"]]);
			expect(partition(["A", "B", "C"], [2, 1])).to.eql([["A", "B"], ["C"]]);
		});
		
		it("divides strings", () => {
			expect(partition("ABCD", [2])).to.eql(["AB", "CD"]);
			expect(partition("ABCD", [3, 1])).to.eql(["ABC", "D"]);
		});
		
		it("uses sparse arrays for incomplete sections", () => {
			const parts = partition("AAAABB".split(""), [4]);
			expect(parts).to.eql([["A", "A", "A", "A"], ["B", "B",,,]]);
			let index = 0;
			parts.pop().forEach(() => ++index);
			expect(index).to.equal(2);
		});
		
		it("divides generic iterables", () => {
			expect(partition(new (class{
				[Symbol.iterator](){
					let i = 0;
					return {next: () => ({value: ++i, done: i > 5})};
				}
			})(), [2])).to.eql([[1, 2], [3, 4], [5,,]]);
		});
		
		it("throws an error for invalid sizes", () => {
			const message = /^At least one positive, non-zero size is required$/;
			expect(() => partition(["A", "B"], [-1])).to.throw(RangeError, message);
			expect(() => partition(["A", "B"],  [0])).to.throw(RangeError, message);
		});
	});
	
	describe("resolveProperty()", () => {
		const {resolveProperty} = utils;
		it("resolves property names", () => {
			expect(resolveProperty("foo", {foo: "bar"})).to.equal("bar");
			expect(resolveProperty("foo", {foo: ["bar"]})).to.eql(["bar"]);
		});
		it("resolves nested property names", () => {
			expect(resolveProperty("foo.bar",     {foo: {bar: "baz"}})).to.equal("baz");
			expect(resolveProperty("foo.bar",     {foo: {bar: ["baz"]}})).to.eql(["baz"]);
			expect(resolveProperty("foo.bar",     {foo: {bar: {baz: "qux"}}})).to.eql({baz: "qux"});
			expect(resolveProperty("foo.bar.baz", {foo: {bar: {baz: "qux"}}})).to.equal("qux");
		});
		it("returns values by reference", () => {
			const bar = {baz: [1, 2]};
			const foo = {bar};
			expect(resolveProperty("foo",     {foo})).to.equal(foo);
			expect(resolveProperty("foo.bar", {foo})).to.equal(bar);
		});
		it("returns `undefined` for nonexistent properties", () => {
			expect(resolveProperty("foo.bar.baz", {foo: {bar: []}})).to.be.undefined;
			expect(resolveProperty("foo.bar.baz", {foo: {}})).to.be.undefined;
			expect(resolveProperty("foo.bar.baz", {})).to.be.undefined;
		});
		it("returns `undefined` for empty accessors", () => {
			expect(resolveProperty("", {foo: 1})).to.be.undefined;
		});
		it("returns the last value if `usePrevious` is set", () => {
			const obj = {foo: {bar: []}};
			expect(resolveProperty("foo.bar.baz", obj, true)).to.equal(obj.foo.bar);
			expect(resolveProperty("foo.qux.baz", obj, true)).to.equal(obj.foo);
			expect(resolveProperty("qul.bar.baz", obj, true)).to.equal(obj);
		});
		it("can handle circular structures", () => {
			const foo = {name: "Foo"};
			const bar = {baz: foo};
			foo.bar = bar;
			expect(resolveProperty("foo.bar.baz.name", {foo})).to.equal("Foo");
			expect(resolveProperty("foo.bar.baz.bar",  {foo})).to.equal(bar);
		});
		it("supports array-like accessors", () => {
			expect(resolveProperty("[0]",           ["foo"])).to.equal("foo");
			expect(resolveProperty("[0][1]",        [[, "foo"]])).to.equal("foo");
			expect(resolveProperty("foo[0]",        {foo: ["bar"]})).to.equal("bar");
			expect(resolveProperty("foo[1]",        {foo: [0, [1]]})).to.eql([1]);
			expect(resolveProperty("foo[1][0]",     {foo: [0, [1]]})).to.equal(1);
			expect(resolveProperty("foo.bar[1]",    {foo: {bar: [1, 2]}})).to.equal(2);
			expect(resolveProperty("foo[0].bar[1]", {foo: [{bar: [1, 2]}]})).to.equal(2);
		});
		it("supports numeric accessors", () => {
			expect(resolveProperty("0",             ["foo"])).to.equal("foo");
			expect(resolveProperty("0.1",           [[, "foo"]])).to.equal("foo");
			expect(resolveProperty("foo.0",         {foo: ["bar"]})).to.equal("bar");
			expect(resolveProperty("foo.1",         {foo: [0, [1]]})).to.eql([1]);
			expect(resolveProperty("foo.1.0",       {foo: [0, [1]]})).to.equal(1);
			expect(resolveProperty("foo.bar.1",     {foo: {bar: [1, 2]}})).to.equal(2);
			expect(resolveProperty("foo.0.bar.1",   {foo: [{bar: [1, 2]}]})).to.equal(2);
		});
		it("supports single-quoted accessors", () => {
			expect(resolveProperty("['0']",           ["foo"])).to.equal("foo");
			expect(resolveProperty("['0']['1']",      [[, "foo"]])).to.equal("foo");
			expect(resolveProperty("foo['0']",        {foo: ["bar"]})).to.equal("bar");
			expect(resolveProperty("foo['1']",        {foo: [0, [1]]})).to.eql([1]);
			expect(resolveProperty("foo['1']['0']",   {foo: [0, [1]]})).to.equal(1);
			expect(resolveProperty("foo.bar['1']",    {foo: {bar: [1, 2]}})).to.equal(2);
			expect(resolveProperty("foo['0'].b['1']", {foo: [{b: [1, 2]}]})).to.equal(2);
		});
		it("supports double-quoted accessors", () => {
			expect(resolveProperty('["0"]',           ["foo"])).to.equal("foo");
			expect(resolveProperty('["0"]["1"]',      [[, "foo"]])).to.equal("foo");
			expect(resolveProperty('foo["0"]',        {foo: ["bar"]})).to.equal("bar");
			expect(resolveProperty('foo["1"]',        {foo: [0, [1]]})).to.eql([1]);
			expect(resolveProperty('foo["1"]["0"]',   {foo: [0, [1]]})).to.equal(1);
			expect(resolveProperty('foo.bar["1"]',    {foo: {bar: [1, 2]}})).to.equal(2);
			expect(resolveProperty('foo["0"].b["1"]', {foo: [{b: [1, 2]}]})).to.equal(2);
		});
		it("supports quoted property names", () => {
			expect(resolveProperty('["foo"]',           {foo: {bar: 1}})).to.eql({bar: 1});
			expect(resolveProperty('["foo"]["bar"]',    {foo: {bar: 4}})).to.equal(4);
			expect(resolveProperty('foo["bar"]',        {foo: {bar: 2}})).to.equal(2);
			expect(resolveProperty('foo["bar"].baz',    {foo: {bar: {baz: 3}}})).to.equal(3);
			expect(resolveProperty('foo["bar"]["baz"]', {foo: {bar: {baz: 3}}})).to.equal(3);
		});
		it("doesn't interpret dots in quoted regions", () => {
			const obj = {foo: {"bar.baz": 3, bar: {baz: 4}}, "foo.bar.baz": 5};
			expect(resolveProperty('foo["bar.baz"]',     obj)).to.equal(3);
			expect(resolveProperty("foo['bar.baz']",     obj)).to.equal(3);
			expect(resolveProperty("'foo.bar.baz'",      obj)).to.equal(5);
			expect(resolveProperty('"foo.bar.baz"',      obj)).to.equal(5);
			expect(resolveProperty('["foo.bar.baz"]',    obj)).to.equal(5);
			expect(resolveProperty("['foo.bar.baz']",    obj)).to.equal(5);
			expect(resolveProperty('["foo"]["bar.baz"]', obj)).to.equal(3);
			expect(resolveProperty("['foo']['bar.baz']", obj)).to.equal(3);
		});
		it("doesn't interpret quotes within other quotes", () => {
			const obj = {
				foo: {
					"'bar.baz'": 1,
					'"bar.baz"': 2,
					bar: {
						baz: 3,
						"'baz'": 4,
						'"baz"': 5,
					},
				},
				"'foo.bar.baz'": 6,
				'"foo.bar.baz"': 7,
				"foo.'bar'.baz": 8,
				'foo."bar".baz': 9,
			};
			expect(resolveProperty("foo[\"'bar.baz'\"]",    obj)).to.equal(1);
			expect(resolveProperty("foo['\"bar.baz\"']",    obj)).to.equal(2);
			expect(resolveProperty("foo['bar']['baz']",     obj)).to.equal(3);
			expect(resolveProperty("foo['bar'][\"'baz'\"]", obj)).to.equal(4);
			expect(resolveProperty("foo['bar']['\"baz\"']", obj)).to.equal(5);
			expect(resolveProperty("[\"foo.'bar'.baz\"]",   obj)).to.equal(8);
			expect(resolveProperty("['foo.\"bar\".baz']",   obj)).to.equal(9);
			expect(resolveProperty("\"foo.'bar'.baz\"",     obj)).to.equal(8);
			expect(resolveProperty("'foo.\"bar\".baz'",     obj)).to.equal(9);
		});
		it("resolves primitive properties", () => {
			expect(resolveProperty("[0]", "foo")).to.equal("f");
			expect(resolveProperty("[1]", "foo")).to.equal("o");
			expect(resolveProperty("length", "foo")).to.equal(3);
			expect(resolveProperty("length.constructor", "foo")).to.equal(Number);
			expect(resolveProperty("length.constructor.name", "foo")).to.equal("Number");
			expect(resolveProperty("[0]",      undefined)).to.equal(undefined);
			expect(resolveProperty("foo",      undefined)).to.equal(undefined);
			expect(resolveProperty("[0].name", undefined)).to.equal(undefined);
			expect(resolveProperty("foo.name", undefined)).to.equal(undefined);
			expect(resolveProperty("[0]",      null))     .to.equal(undefined);
			expect(resolveProperty("foo",      null))     .to.equal(undefined);
			expect(resolveProperty("[0].name", null))     .to.equal(undefined);
			expect(resolveProperty("foo.name", null))     .to.equal(undefined);
		});
	});

	describe("sortn()", () => {
		const {sortn} = utils;
		it("sorts case-insensitively", () => {
			expect(["X", "z", "A", "x"]  .sort(sortn)).to.eql(["A", "X", "x", "z"]);
			expect(["abcXYZ2", "abcxyz1"].sort(sortn)).to.eql(["abcxyz1", "abcXYZ2"]);
		});
		it("sorts numeric segments", () => {
			expect(["foo128", "foo8"]                  .sort(sortn)).to.eql(["foo8", "foo128"]);
			expect(["xyz2", "foo8", "xyz1", "foo123"]  .sort(sortn)).to.eql(["foo8", "foo123", "xyz1", "xyz2"]);
			expect(["foo128", "foo16", "foo32", "foo8"].sort(sortn)).to.eql(["foo8", "foo16", "foo32", "foo128"]);
			expect(["foo123bar456", "foo123bar90"]     .sort(sortn)).to.eql(["foo123bar90", "foo123bar456"]);
		});
		it("ignores whitespace", () => {
			expect([" foo", "bar", " "]  .sort(sortn)).to.eql([" ", "bar", " foo"]);
			expect(["f1", "f   3", "f 2"].sort(sortn)).to.eql(["f1", "f 2", "f   3"]);
			expect(["f3", "f 2", " f1"]  .sort(sortn)).to.eql([" f1", "f 2", "f3"]);
		});
		it("picks shorter strings when tied", () => {
			expect(["foo123", "foo", "bar4a", "bar4"].sort(sortn)).to.eql(["bar4", "bar4a", "foo", "foo123"]);
			expect(["foo", "foo123", "bar4", "bar4a"].sort(sortn)).to.eql(["bar4", "bar4a", "foo", "foo123"]);
			expect(["foo123bar", "foo456", "foo123"] .sort(sortn)).to.eql(["foo123", "foo123bar", "foo456"]);
		});
		it("sorts by length as a last-resort", () => {
			expect(["foo1 ", "foo1"].sort(sortn)).to.eql(["foo1", "foo1 "]);
			expect([" ", ""].sort(sortn)).to.eql(["", " "]);
		});
	});

	describe("tween()", function(){
		const {tween, wait} = utils;
		const duration = 600;
		this.timeout(duration * 2);
		this.slow(duration * 4);
		
		it("interpolates property values over time", async () => {
			const target = {prop: 0};
			const tweenValue = tween(target, "prop", 100, {duration});
			await wait(duration / 3)  .then(() => expect(target.prop).to.be.within(10, 50));
			await wait(duration / 1.5).then(() => expect(target.prop).to.be.within(50, 100));
			await tweenValue.then(() => expect(target.prop).to.equal(100));
		});
		
		it("begins tweening from the existing value", async () => {
			const target = {prop: 90};
			const tweenValue = tween(target, "prop", 100, {duration});
			await wait(duration / 3).then(() => expect(target.prop).to.be.within(90, 100));
			await tweenValue.then(() => expect(target.prop).to.equal(100));
		});
		
		it("invokes callback functions for each frame", async () => {
			let callCount  = 0;
			const fps      = 5;
			const target   = {prop: 0};
			const previous = {value: -1, progress: -1};
			const callback = (value, progress) => {
				expect(value).to.be.above(previous.value);
				expect(progress).to.be.above(previous.progress).and.within(0, 1);
				previous.value = value;
				previous.progress = progress;
				++callCount;
			};
			await tween(target, "prop", 10, {duration, callback, fps});
			expect(callCount).to.be.at.least(duration / 60 / fps);
			expect(previous.progress).to.equal(1);
		});
		
		it("supports custom easing curves", async () => {
			const curve = [[0, 0], [1, 0], [1, 0], [1, 1]];
			const target = {prop: 0};
			const tweenValue = tween(target, "prop", 100, {duration, curve});
			await wait(duration / 4);
			expect(target.prop).to.be.below(5);
			await wait(duration / 2);
			expect(target.prop).to.be.below(50);
			await tweenValue.then(() => expect(target.prop).to.equal(100));
		});
		
		it("supports early cancellation of playback", async () => {
			const valuesWhenStopped = {A: 0, B: 0};
			const target = {foo: 0, bar: 0};
			const tweenA = tween(target, "foo", 10, {duration});
			tween(target, "bar", 10, {duration});
			await wait(duration / 4).then(() => expect(target.foo).to.be.above(0));
			await wait(duration / 2).then(() => tweenA.stop());
			valuesWhenStopped.A = target.foo;
			valuesWhenStopped.B = target.bar;
			expect(valuesWhenStopped.A).to.be.above(0).and.below(10);
			expect(valuesWhenStopped.B).to.be.above(0).and.below(10);
			await wait(duration / 1.5);
			expect(target.foo).to.equal(valuesWhenStopped.A);
			expect(target.bar).to.be.above(valuesWhenStopped.B);
		});
		
		it("defines presets for common easing functions", () => {
			expect(tween.LINEAR).to.be.an("array");
			expect(tween.EASE).to.be.an("array");
			expect(tween.EASE_IN).to.be.an("array");
			expect(tween.EASE_IN_OUT).to.be.an("array");
			expect(tween.EASE_OUT).to.be.an("array");
		});
		
		it("lets durations be specified", async () => {
			const target = {foo: 0, bar: 0};
			const result = [];
			const tweenA = tween(target, "foo", 5, {duration: 500}).then(() => result.push("A"));
			const tweenB = tween(target, "bar", 5, {duration: 250}).then(() => result.push("B"));
			await Promise.all([tweenA, tweenB]);
			expect(result).to.eql(["B", "A"]);
		});
		
		it("lets frame rates be specified", async () => {
			const counts = {A: 0, B: 0};
			const target = {foo: 0, bar: 0};
			const tweenA = tween(target, "foo", 5, {duration, fps: 50, callback: () => ++counts.A});
			const tweenB = tween(target, "bar", 5, {duration, fps: 25, callback: () => ++counts.B});
			await Promise.all([tweenA, tweenB]);
			expect(counts.A).to.be.above(counts.B);
			expect(target.foo).to.equal(target.bar);
		});
		
		it("lets interpolated values be overridden by a filter", async () => {
			const target = {prop: 0};
			const filter = (value, progress) => {
				expect(progress).to.be.within(0, 1);
				return `Size: ${value}cm × ${value / 2}cm`;
			};
			await tween(target, "prop", 30, {duration, filter});
			expect(target.prop).to.equal("Size: 30cm × 15cm");
		});
	});
	
	describe("uint()", () => {
		const {uint} = utils;
		
		it("coerces values to integers", () => {
			const obj = {valueOf: () => 630};
			expect(uint(obj)) .to.equal(630);
			expect(uint("48")).to.equal(48);
			expect(uint(null)).to.equal(0);
		});
		
		it("discards decimal components", () => {
			expect(uint(2.4)).to.equal(2);
			expect(uint(3.6)).to.equal(3);
		});
		
		it("clamps negative values to zero", () => {
			expect(uint(-1)).to.equal(0);
			expect(uint(-4)).to.equal(0);
			expect(uint(Number.NEGATIVE_INFINITY)).to.equal(0);
		});
		
		it("returns NaN for non-numeric input", () => {
			expect(uint(NaN)).to.be.NaN;
			expect(uint({})).to.be.NaN;
			expect(uint("Invalid")).to.be.NaN;
		});
		
		it("strips the sign from negative zero", () => {
			const sign = Math.sign(uint(-0));
			expect(Object.is(sign,  0)).to.equal(true);
			expect(Object.is(sign, -0)).to.equal(false);
		});
	});
	
	
	/**
	 * Globalise a fake `document.all` for non-browser environments.
	 * @internal
	 */
	function spoofBrowser(){
		if(haveHTMLAll) return;
		class HTMLAllCollection{
			constructor(){ return undefined; }
			valueOf(){ return undefined; }
		}
		HTMLAllCollection.toString = function toString(){ return htmlAllFn; };
		const document = {all: new HTMLAllCollection()};
		globalThis.HTMLAllCollection = HTMLAllCollection;
		globalThis.window = {HTMLAllCollection, document};
		globalThis.document = document;
	}
	
	/**
	 * Undo the effects of calling {@link spoofBrowser}.
	 * @internal
	 */
	function unspoofBrowser(){
		if(haveHTMLAll) return;
		delete globalThis.HTMLAllCollection;
		delete globalThis.window;
		delete globalThis.document;
	}
});
