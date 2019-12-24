import * as utils from "../index.mjs";

describe("Miscellaneous functions", () => {
	const htmlAllFn = "function HTMLAllCollection() { [native code] }";
	const isBrowser = (
		"object"    === typeof window &&
		"undefined" === typeof module &&
		"function"  === typeof window.HTMLAllCollection &&
		htmlAllFn   === Function.prototype.toString.call(window.HTMLAllCollection)
	);
	
	describe("isNativeDOM()", () => {
		const {isNativeDOM} = utils;
		if(isBrowser)
			it("returns `true` for browser environments", () =>
				expect(isNativeDOM()).to.be.true);
		else{
			afterEach(() => unspoofBrowser());
			it("returns `false` for non-browser environments", () =>
				expect(isNativeDOM()).to.be.false);
			it("isn't fooled by user-created globals", () => {
				spoofBrowser();
				expect(isNativeDOM()).to.be.false;
			});
		}
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
			if(!isBrowser){
				before(() => spoofBrowser());
				after(() => unspoofBrowser());
			}
			it("uses its [[IsHTMLDDA]] internal slot", () => {
				if(isBrowser){
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
		it("identifies literals",   () => void expect(isString("foo")).to.be.true);
		it("identifies objects",    () => void expect(isString(new String("foo"))).to.be.true);
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
	
	describe("isRegExp()", () => {
		const {isRegExp} = utils;
		it("identifies literals",   () => void expect(isRegExp(/A/)).to.be.true);
		it("identifies subclasses", () => {
			class ExtendedRegExp extends RegExp {
				constructor(source, flags){
					source = source
						.replace(/\[[^\]]+\]/g, s => s
							.replace(/ /, "\\x20")
							.replace(/\t/, "\\t"))
						.replace(/\s+/g, "");
					super(source, flags);
					
					Object.defineProperty(this, "source", {
						get: () => source,
					});
				}
			}
			const regexp = new ExtendedRegExp("^ A B C $");
			expect("ABC").to.match(regexp);
			expect(isRegExp(regexp)).to.be.true;
		});
	});
	
	describe("partition()", () => {
		const {partition} = utils;
		it("divides arrays", () => {
			expect(partition(["A", "B", "C", "D"], [2])).to.eql([["A", "B"], ["C", "D"]]);
			expect(partition(["A", "B", "C"], [2, 1]))  .to.eql([["A", "B"], ["C"]]);
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
		if(isBrowser) return;
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
		if(isBrowser) return;
		delete globalThis.HTMLAllCollection;
		delete globalThis.window;
		delete globalThis.document;
	}
});
