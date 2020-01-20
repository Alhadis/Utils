import * as utils from "../index.mjs";

describe("Higher-order functions", () => {
	describe("bindMethods()", () => {
		const {bindMethods} = utils;
		it("binds an object's own methods", () => {
			const obj = bindMethods({foo(){ return this; }});
			const {foo} = obj;
			expect(foo()).to.equal(obj);
		});
		it("binds an object's prototyped methods", () => {
			class A { foo(){ return this; }}
			const a = bindMethods(new A());
			const {foo} = a;
			expect(foo()).to.equal(a);
			expect(foo).not.to.equal(A.prototype.foo);
		});
	});
	
	describe("debounce()", function(){
		const {debounce} = utils;
		this.slow(2000);
		it("limits the rate at which a function can fire", async () => {
			let calls = 0;
			const fn = debounce(() => ++calls, 500);
			for(let i = 0; i < 10; ++i){
				fn();
				await new Promise(resolve => setTimeout(resolve, 10));
				expect(calls).to.equal(0);
			}
			await new Promise(resolve => setTimeout(resolve, 700));
			expect(calls).to.equal(1);
		});
		it("fires the function before waiting if `asap` is set", async () => {
			let calls = 0;
			const fn = debounce(() => ++calls, 250, true);
			for(let i = 0; i < 10; ++i) fn();
			expect(calls).to.equal(1);
			await new Promise(resolve => setTimeout(resolve, 500));
			expect(calls).to.equal(1);
		});
		it("fires it immediately if no limit is given", async () => {
			let calls = 0;
			const fn = debounce(() => ++calls);
			for(let i = 0; i < 10; ++i){
				fn();
				expect(calls).to.equal(i + 1);
			}
		});
	});
	
	describe("nerf()", () => {
		const {nerf} = utils;
		it("silences errors thrown by a function", () => {
			const foo = () => { throw new ReferenceError("Foo"); };
			const bar = nerf(foo);
			expect(foo).to.throw(ReferenceError, "Foo");
			expect(bar).not.to.throw();
		});
		it("returns `undefined` after an error", () => {
			const foo = arg => {
				if(arg) return arg * 2;
				throw new RangeError(`Bad number: ${arg}`);
			};
			const bar = nerf(foo);
			expect(() => foo(0)).to.throw(RangeError, /^Bad number: 0$/);
			expect(bar(1)).to.equal(2);
			expect(bar(2)).to.equal(4);
			expect(bar(0)).to.be.undefined;
		});
		it("stores the most-recently thrown error", () => {
			const error = new RangeError("Bar");
			const gripe = () => { throw error; };
			const shush = nerf(gripe);
			expect(shush).to.have.property("lastError").that.is.null;
			expect(gripe).to.throw(error);
			expect(shush).not.to.throw();
			expect(shush.lastError).to.equal(error);
			shush.lastError = null;
			expect(shush.lastError).to.be.null;
		});
		it("requires the subject to be a function", () => {
			const message = /^Argument must be a function$/;
			expect(() => nerf({}))       .to.throw(TypeError, message);
			expect(() => nerf(true))     .to.throw(TypeError, message);
			expect(() => nerf(null))     .to.throw(TypeError, message);
			expect(() => nerf(undefined)).to.throw(TypeError, message);
		});
		it("lets the function's context be altered", () => {
			let context = null;
			const error = new SyntaxError("BAAAAAAD");
			function foo(){ context = this; throw error; }
			const obj = {};
			const bar = nerf(foo, obj);
			expect(bar).not.to.throw(error);
			expect(context).to.equal(obj);
		});
	});
	
	describe("poll()", function(){
		const {poll} = utils;
		this.timeout(1e4);
		this.slow(1e4);
		
		it("waits for a function to return a truthy value", async () => {
			let calls = 0;
			expect(await poll(() => ++calls > 5 ? 1 : 0)).to.equal(1);
			expect(calls).to.equal(6);
		});
		it("waits for the opposite if `opts.negate` is set", async () => {
			let calls = 5;
			expect(await poll(() => --calls > 0 ? 1 : 0, {negate: true})).to.equal(0);
			expect(calls).to.equal(0);
		});
		it("controls the rate at which polling occurs", async () => {
			for(const [rate, count] of [[100, 5], [50, 10], [100, 1]]){
				let pollCount = 0;
				const started = Date.now();
				await poll(() => { ++pollCount; return Date.now() - started > 600; }, {rate});
				expect(pollCount).to.be.at.least(count);
			}
		});
		it("throws an error after reaching a time-limit", async () => {
			let error = null;
			try{ await poll(() => false, {timeout: 2000}); }
			catch(e){ error = e; }
			expect(error).to.be.an.instanceOf(Error);
			expect(error.message).to.equal("Timed out");
		});
	});
	
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
		
		it("wraps non-callable properties in a method", () => {
			// FIXME: But why??
			const obj = new Example("A");
			punch(obj, "name", fn => fn());
			expect(obj.name).to.be.a("function");
			expect(obj.name()).to.equal("A");
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
	
	describe("wait()", function(){
		this.slow(1000);
		const {wait} = utils;
		it("returns a Promise that auto-resolves after a delay", async () => {
			const started = Date.now();
			await wait(250);
			const ended = Date.now();
			expect(ended - started).to.be.at.least(240);
		});
	});
});
