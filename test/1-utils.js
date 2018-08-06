"use strict";

const {expect} = require("chai");


describe("Utility functions", () => {
	const utils = require("../index.js");
	
	describe("Objects", () => {
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
			it("identifies objects",    () => void expect(isRegExp(new RegExp("A"))).to.be.true);
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
							get: () => source
						});
					}
				}
				const regexp = new ExtendedRegExp("^ A B C $");
				expect("ABC").to.match(regexp);
				expect(isRegExp(regexp)).to.be.true;
			});
		});
		
		describe("isNumeric()", () => {
			const {isNumeric} = utils;
			it("allows numeric arguments",      () => void expect(isNumeric(0xBABEFACE)).to.be.true);
			it("recognises positive integers",  () => void expect(isNumeric("45")).to.be.true);
			it("recognises negative integers",  () => void expect(isNumeric("-5")).to.be.true);
			it("recognises positive floats",    () => void expect(isNumeric("2.5")).to.be.true);
			it("recognises negative floats",    () => void expect(isNumeric("-2.5")).to.be.true);
			it("recognises basic numbers only", () => {
				expect(isNumeric("0b10100100")).to.be.false;
				expect(isNumeric("0xBABEFACE")).to.be.false;
				expect(isNumeric("3.1536e+10")).to.be.false;
				expect(isNumeric("0xAF")).to.be.false;
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
				await wait(duration / 3).then(() => expect(target.prop).to.be.within(10, 50));
				await wait(duration / 2).then(() => expect(target.prop).to.be.within(50, 100));
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
				const target = {foo: 0, bar: 0};
				const tweenA = tween(target, "foo", 100, {duration, curve: [[0,0],[1,0],[1,0],[1,1]]});
				const tweenB = tween(target, "bar", 100, {duration, curve: [[0,0],[0,1],[0,1],[1,1]]});
				await wait(duration / 4);
				expect(target.foo).to.be.below(5);
				expect(target.bar).to.be.above(35);
				await wait(duration / 2);
				expect(target.foo).to.be.below(50);
				expect(target.bar).to.be.above(85);
				await tweenA.then(() => expect(target.foo).to.equal(100));
				await tweenB.then(() => expect(target.bar).to.equal(100));
			});
			
			it("supports early cancellation of playback", async () => {
				const valuesWhenStopped = {A: 0, B: 0};
				const target = {foo: 0, bar: 0};
				const tweenA = tween(target, "foo", 10, {duration});
				const tweenB = tween(target, "bar", 10, {duration});
				await wait(duration / 4).then(() => expect(target.foo).to.be.above(0));
				await wait(duration / 2).then(() => tweenA.stop());
				valuesWhenStopped.A = target.foo;
				valuesWhenStopped.B = target.bar;
				expect(valuesWhenStopped.A).to.be.above(0).and.below(10);
				expect(valuesWhenStopped.B).to.be.above(0).and.below(10);
				await wait(duration / 1.5);
				expect(target.foo).to.equal(valuesWhenStopped.A);
				expect(target.bar).to.be.above(valuesWhenStopped.B).and.to.equal(10);
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
	});

	describe("Regular expressions", () => {
		describe("escapeRegExp()", () => {
			const {escapeRegExp} = utils;
			it("escapes backslashes",       () => void expect(escapeRegExp("\\")).to.equal("\\\\"));
			it("escapes metacharacters",    () => void expect(escapeRegExp("$")).to.equal("\\$"));
			it("escapes character classes", () => void expect(escapeRegExp("[ABC]")).to.equal("\\[ABC\\]"));
			it("escapes capturing groups",  () => void expect(escapeRegExp("(A)")).to.equal("\\(A\\)"));
			it("escapes source accurately", () => {
				const pattern = /^ember(?:\.|(?:-[^.]+)?-(?:\d+\.)+(?:debug\.)?)js$/i;
				const source = escapeRegExp(pattern.source);
				expect(new RegExp(source).test(pattern.source)).to.be.true;
			});
		});
		
		describe("fuzzyRegExp()", () => {
			const fuzz = utils.fuzzyRegExp;
			it("returns case-insensitive patterns",          () => void expect("abc")    .to.match(fuzz("aBc")));
			it('fuzzes the letter "O" to match zeroes',      () => void expect("f0o")    .to.match(fuzz("foo")));
			it("fuzzes word boundaries to match hyphens",    () => void expect("abc-xyz").to.match(fuzz("abc xyz")));
			it("fuzzes word boundaries to match whitespace", () => void expect("abc xyz").to.match(fuzz("abc-xyz")));
			it("treats camelCase/PascalCase as boundaries",  () => void expect("abc xyz").to.match(fuzz("abcXyz")));
			it("treats stylised caps as word boundaries",    () => void expect("d-base") .to.match(fuzz("dBASE")));
			it("makes boundary separators optional",         () => void expect("abcxyz") .to.match(fuzz("ABC-XYZ")));
			it("makes punctuation optional",                 () => void expect("abc")    .to.match(fuzz("A.B.C.")));
		});

		describe("forceNonCapturing()", () => {
			const force = utils.forceNonCapturing;
			it("converts capturing groups into non-capturing", () => expect(force(/AA(BB)AA/)).to.eql(/AA(?:BB)AA/));
			it("normalises existing non-capturing groups",     () => expect(force(/AA(?:BB)AA/)).to.eql(/AA(?:BB)AA/));
			it("retains the original expression's flags",      () => expect(force(/B(ie)n/muy)).to.eql(/B(?:ie)n/muy));
			it("retains lookaheads/lookbehinds",               () => expect(force(/A(?=B)C/)).to.eql(/A(?=B)C/));
			it("avoids changing brackets that are escaped",    () => expect(force(/AA\(BB\)AA/)).to.eql(/AA\(BB\)AA/));
			it("can handle escaped brackets inside groups",    () => expect(force(/A(\(B\)\\)D/)).to.eql(/A(?:\(B\)\\)D/));
			it("can handle trailing escapes",                  () => expect(force(/AA\\\(BB\)\\/)).to.eql(/AA\\\(BB\)\\/));
			it("can handle escaped non-capturing groups",      () => expect(force(/AA\(\?:BB\)C/)).to.eql(/AA\(\?:BB\)C/));
			it('doesn\'t suffer "leaning toothpick syndrome"', () => {
				expect(force(/A\\(\(B\\)\)C/)).to.eql(/A\\(?:\(B\\)\)C/);
				expect(force(/A\\(\(B\\)\)C/)).to.eql(/A\\(?:\(B\\)\)C/);
				expect(force(/A\\\\\(B\)\\\\/)).to.eql(/A\\\\\(B\)\\\\/);
				expect(force(/A\\\\\\\(B\)\\\\\\/)).to.eql(/A\\\\\\\(B\)\\\\\\/);
				expect(force(/A\\(B\\)C/)).to.eql(/A\\(?:B\\)C/);
				expect(force(/A\\\\(B\\\\)C/)).to.eql(/A\\\\(?:B\\\\)C/);
				expect(force(/A\\\\\\(B\\\\\\)C/)).to.eql(/A\\\\\\(?:B\\\\\\)C/);
				expect(force(/A\\\\\\\\(B\\\\\\)C/)).to.eql(/A\\\\\\\\(?:B\\\\\\)C/);
				expect(force(/A\\(\(\\)\)C/)).to.eql(/A\\(?:\(\\)\)C/);
				expect(force(/A\\(\(\\)\)C/)).to.eql(/A\\(?:\(\\)\)C/);
				expect(force(/A\\\\\(\)\\\\/)).to.eql(/A\\\\\(\)\\\\/);
				expect(force(/A\\\\\\\(\)\\\\\\/)).to.eql(/A\\\\\\\(\)\\\\\\/);
				expect(force(/\\(\\)/)).to.eql(/\\(?:\\)/);
				expect(force(/\\\\(\\\\)/)).to.eql(/\\\\(?:\\\\)/);
				expect(force(/\\\\\\(\\\\\\)/)).to.eql(/\\\\\\(?:\\\\\\)/);
				expect(force(/\\\\\\\\(\\\\\\)/)).to.eql(/\\\\\\\\(?:\\\\\\)/);
				expect(force(/\(\\(\\)/)).to.eql(/\(\\(?:\\)/);
				expect(force(/\\(\\(\\(\\\(\\\\(\\)\)\\)\\)\\)\\\/\)/)).to.eql(/\\(?:\\(?:\\(?:\\\(\\\\(?:\\)\)\\)\\)\\)\\\/\)/);
			});
		});
		
		describe("caseKludge()", () => {
			const {caseKludge} = utils;
			it("generates case-insensitive regex source", () => {
				const pattern = new RegExp(`^(ABC|${caseKludge("DEF")})`);
				expect("dEf").to.match(pattern);
				expect("aBc").not.to.match(pattern);
			});
			
			it("fuzzes word boundaries", () => {
				const source = caseKludge("camelCase", true);
				const pattern = new RegExp(`^abc: ${source}$`);
				expect("abc: camelCASE").to.match(pattern);
				expect("abc: camel-CASE").to.match(pattern);
				expect("ABC: camel-CASE").not.to.match(pattern);
			});
			
			it("allows multiple separators between fuzzed boundaries", () => {
				const source = caseKludge("camelCase", true);
				const pattern = new RegExp(`^abc: ${source}$`);
				expect("abc: camel----CASE").to.match(pattern);
				expect("abc: camel--CA").not.to.match(pattern);
			});
		});
	});
	
	describe("Function-related", () => {
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
	
	describe("Node-specific", () => {
		const fs = require("fs");

		describe("exec()", function(){
			const {exec, wait} = utils;
			this.slow(1000);

			it("executes external commands asynchronously", () =>
				expect(exec("true")).to.be.a("promise"));

			it("captures their standard output streams", async () =>
				expect(await exec("printf", ["<%03x>\\n", "255"]))
				.	to.have.property("stdout")
				.	that.is.a("string")
				.	and.that.equals("<0ff>\n"));

			it("captures their standard error streams", async () =>
				expect(await exec("node", ["-e", `process.stderr.write("Foo")`]))
				.	to.have.property("stderr")
				.	that.is.a("string")
				.	and.that.equals("Foo"));

			it("captures the command's exit code", async () =>
				expect(await exec("node", ["-e", "process.exit(3)"]))
				.	to.have.property("code")
				.	that.is.a("number")
				.	and.that.equals(3));

			it("resolves with an object that includes each property", async () =>
				expect(await exec("node", ["-e", `
					process.stdout.write("ABC");
					process.stderr.write("XYZ");
					process.exit(1);
				`])).to.eql({
					stdout: "ABC",
					stderr: "XYZ",
					code: 1,
				}));

			it("always includes each property with the resolved object", async () => {
				expect(await exec("echo"))  .to.eql({stdout: "\n", stderr: "", code: 0});
				expect(await exec("true"))  .to.eql({stdout: "",   stderr: "", code: 0});
				expect(await exec("false")) .to.eql({stdout: "",   stderr: "", code: 1});
			});

			it("can pipe arbitrary data to standard input", async () =>
				expect(await exec("sed", ["-e", "s/in/out/"], "input")).to.eql({
					stdout: "output",
					stderr: "",
					code: 0,
				}));

			it("can pipe empty input without hanging process", () =>
				Promise.race([
					wait(750).then(() => Promise.reject()),
					exec("sed", ["-e", "s/A/B/g"], ""),
				]));
		});
		
		describe("statify()", () => {
			const {statify} = utils;
			const plainStats = {
				dev: 16777220,
				mode: 33188,
				nlink: 1,
				uid: 501,
				gid: 20,
				rdev: 0,
				blksize: 4096,
				ino: 175025642,
				size: 1104,
				blocks: 8,
				atime: 1481195566000,
				mtime: 1481195249000,
				ctime: 1481195249000,
				birthtime: 1481192516000
			};
			
			it("converts plain objects into fs.Stats instances", () => {
				const obj = statify(plainStats);
				expect(obj.constructor).to.equal(fs.Stats);
			});
			
			it("leaves actual fs.Stats instances untouched", () => {
				const realStats = Object.freeze(fs.lstatSync(__filename));
				const statified = statify(realStats);
				expect(realStats).to.equal(statified);
			});
			
			it("retains accurate timestamps", () => {
				const obj = statify(plainStats);
				expect(obj.atime).to.be.a("date");
				expect(obj.mtime).to.be.a("date");
				expect(obj.ctime).to.be.a("date");
				expect(obj.birthtime).to.be.a("date");
				expect(obj.atime.getTime()).to.equal(1481195566000);
				expect(obj.mtime.getTime()).to.equal(1481195249000);
				expect(obj.ctime.getTime()).to.equal(1481195249000);
				expect(obj.ctime.getTime()).not.to.equal(1481195249001);
				expect(obj.birthtime.getTime()).to.equal(1481192516000);
			});
			
			it("retains accurate mode-checking methods", () => {
				const modeChecks = {
					isBlockDevice:     0b0110000110100000,
					isCharacterDevice: 0b0010000110110110,
					isDirectory:       0b0100000111101101,
					isFIFO:            0b0001000110100100,
					isFile:            0b1000000111101101,
					isSocket:          0b1100000111101101,
					isSymbolicLink:    0b1010000111101101
				};
				
				for(const methodName in modeChecks){
					const mode = modeChecks[methodName];
					const stat = statify(Object.assign({}, plainStats, {mode}));
					expect(stat.mode, methodName).to.equal(mode);
					expect(stat[methodName], methodName).to.be.a("function");
					expect(stat[methodName](), `${methodName}(${mode})`).to.be.a("boolean");
				}
			});
		});
		
		describe("sipFile()", () => {
			const {sipFile} = utils;
			const path = require("path");
			
			it("reads partial data from the filesystem", () => {
				const [dataSample] = sipFile(__filename, 10);
				expect(dataSample).to.equal('"use stric');
			});
			
			it("indicates if a file was fully-loaded", () => {
				const results = sipFile(__filename, 1);
				expect(results).to.be.an("array");
				expect(results).to.have.lengthOf(2);
				expect(results[1]).to.be.false;
			});
			
			it("allows reading from an arbitrary offset", () => {
				const [dataSample] = sipFile(__filename, 10, 1);
				expect(dataSample).to.equal("use strict");
			});
			
			it("trims extra bytes if content is shorter than sample limit", () => {
				const imagePath = path.resolve(__dirname, "fixtures/image.gif");
				const [dataSample] = sipFile(imagePath, 100);
				expect(dataSample).to.have.lengthOf(42);
			});
		});

		describe("which()", () => {
			const {which} = utils;
			let firstNode = "";

			it("returns the path of the first matching executable", async () => {
				expect(firstNode = await which("node")).to.not.be.empty;
				const stats = fs.lstatSync(firstNode);
				expect(stats.isFile()).to.be.true;
				expect(!!(0o111 & stats.mode)).to.be.true;
			});

			it("returns an empty value if nothing was matched", async () =>
				expect(await which("wegfjekrwg")).to.equal(""));

			describe("when the `all` parameter is set", () => {
				it("returns an array of every match", async () => {
					const result = await which("node", true);
					expect(result).to.be.an("array");
					expect(result[0]).to.be.a("string").and.to.equal(firstNode);
				});

				it("returns an empty array if nothing was found", async () => {
					const result = await which("wegfjekrwg", true);
					expect(result).to.be.an("array").with.lengthOf(0);
				});
			});
		});
	});
});
