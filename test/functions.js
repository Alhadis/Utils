"use strict";

describe("Higher-order functions", () => {
	const utils = require("../index.js");
	
	describe("punch()", () => {
		const {punch} = utils;
		
		class Example {
			constructor(name){ this.name = name; }
			count(a, b, c){ return a + b + c; }
			getName(){ return this.name; }
		}
		
		it("replaces methods", () => {
			const obj = new Example("A");
			expect(obj.getName()).to.equal("A");
			punch(obj, "getName", () => "B");
			expect(obj.getName()).to.equal("B");
		});
		
		it("allows handlers to call the original method", () => {
			const obj = new Example("A");
			punch(obj, "count", fn => fn() + fn());
			expect(obj.count(1, 2, 3)).to.equal(12);
		});
		
		it("gives handlers access to the original arguments", () => {
			const obj = new Example("A");
			punch(obj, "count", (fn, args) => +([...args].join("")) + fn());
			expect(obj.count(1, 2, 3)).to.equal(129);
		});
		
		it("returns the original method in an array", () => {
			const obj = new Example("A");
			const oldMethod = obj.getName;
			const methods = punch(obj, "getName", () => {});
			expect(methods).to.be.an("array");
			expect(methods).to.have.lengthOf(2);
			expect(methods[0]).to.equal(oldMethod);
		});
	});
});
