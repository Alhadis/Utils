"use strict";

describe("Object-related functions", () => {
	const utils = require("../index.js");
	
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
});
