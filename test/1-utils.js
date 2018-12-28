"use strict";

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
				const tween = tween(target, "foo", 10, {duration});
				tween(target, "bar", 10, {duration});
				await wait(duration / 4).then(() => expect(target.foo).to.be.above(0));
				await wait(duration / 2).then(() => tween.stop());
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
					.to.have.property("stdout")
					.that.is.a("string")
					.and.that.equals("<0ff>\n"));

			it("captures their standard error streams", async () =>
				expect(await exec("node", ["-e", 'process.stderr.write("Foo")']))
					.to.have.property("stderr")
					.that.is.a("string")
					.and.that.equals("Foo"));

			it("captures the command's exit code", async () =>
				expect(await exec("node", ["-e", "process.exit(3)"]))
					.to.have.property("code")
					.that.is.a("number")
					.and.that.equals(3));

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
				expect(await exec("sed", ["-e", "s/in/out/"], "input\n")).to.eql({
					stdout: "output\n",
					stderr: "",
					code: 0,
				}));

			it("can pipe empty input without hanging process", () =>
				Promise.race([
					wait(750).then(() => Promise.reject()),
					exec("sed", ["-e", "s/A/B/g"], ""),
				]));
		});

		describe("execString()", () => {
			const {execString:$} = utils;
			
			it("executes ordinary arguments", async () =>
				expect(await $("echo Foo")).to.eql("Foo\n"));

			it("joins multiple arguments together before executing", async () =>
				expect(await $("echo", "Foo", "Bar")).to.eql("Foo Bar\n"));

			it("executes tagged template literals", async () =>
				expect(await $ `echo Foo Bar`).to.eql("Foo Bar\n"));

			it("executes tagged templates with interpolation", async () => {
				expect(await $ `echo Foo ${2 + 4} Baz`).to.eql("Foo 6 Baz\n");
				expect(await $ `echo F${2}o Bar ${"Baz"}`).to.eql("F2o Bar Baz\n");
				expect(await $ `${"echo"} Foo`).to.eql("Foo\n");
			});

			it("executes multiple commands", async () =>
				expect(await $ `echo Foo; echo Bar;`).to.eql("Foo\nBar\n"));

			it("executes piped commands", async () =>
				expect(await $ `echo Foo | sed s/Foo/Bar/ | tr B b`).to.eql("bar\n"));

			it("stores stdout and stderr on thrown error objects", async () => {
				let error = null;
				try      { await $ `echo Foo; echo >&2 Bar; false`; }
				catch(e) { error = e; }
				expect(error).to.be.an.instanceOf(Error);
				expect(error).to.have.property("stdout", "Foo\n");
				expect(error).to.have.property("stderr", "Bar\n");
			});
		});

		describe("which()", () => {
			const {which} = utils;
			let firstNode = "";

			it("returns the path of the first matching executable", async () => {
				expect(firstNode = await which("node")).to.not.be.empty;
				const stats = fs.statSync(firstNode);
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

	describe("Text processing", () => {
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
		
		describe("smartSplit()", () => {
			const {smartSplit} = utils;
			describe("Delimiters", () => {
				const list = ["foo", "bar", "baz"];
				it("uses space, tab and newline as defaults", () => {
					expect(smartSplit("foo bar baz")).to.eql(list);
					expect(smartSplit("foo\tbar\tbaz")).to.eql(list);
					expect(smartSplit("foo\nbar\nbaz")).to.eql(list);
				});
				it("allows them to be changed", () => {
					expect(smartSplit("foo|bar|baz", {delimiters: "|"})).to.eql(list);
					expect(smartSplit("foo.bar|baz", {delimiters: "|."})).to.eql(list);
					expect(smartSplit("foo bar|baz", {delimiters: "|"})).to.eql(["foo bar", "baz"]);
				});
				it("treats contiguous delimiters as one", () => {
					expect(smartSplit("foo  bar   baz")).to.eql(list);
					expect(smartSplit("foo\t\tbar\t\t\tbaz")).to.eql(list);
					expect(smartSplit("foo\n\nbar\n\n\nbaz")).to.eql(list);
				});
				it("allows different delimiters to be used interchangeably", () => {
					expect(smartSplit("foo \tbar \tbaz")).to.eql(list);
					expect(smartSplit("foo\t\nbar\t\nbaz")).to.eql(list);
					expect(smartSplit("foo \t\n \n\t\n bar \n\t\tbaz")).to.eql(list);
					expect(smartSplit("foo | . bar . | . baz", {delimiters: ".| "})).to.eql(list);
				});
				it("skips leading and trailing delimiters", () => {
					expect(smartSplit(" foo")).to.eql(["foo"]);
					expect(smartSplit("  foo")).to.eql(["foo"]);
					expect(smartSplit("foo ")).to.eql(["foo"]);
					expect(smartSplit("foo  ")).to.eql(["foo"]);
					expect(smartSplit(" foo ")).to.eql(["foo"]);
					expect(smartSplit("|foo", {delimiters: "|"})).to.eql(["foo"]);
					expect(smartSplit("| foo", {delimiters: "|"})).to.eql([" foo"]);
					expect(smartSplit("||foo||bar||", {delimiters: "|"})).to.eql(["foo", "bar"]);
				});
			});
			
			describe("Quotes", () => {
				it("defaults to single-quotes, double-quotes and backticks", () => {
					expect(smartSplit("'foo'")).to.eql(["foo"]);
					expect(smartSplit('"foo"')).to.eql(["foo"]);
					expect(smartSplit("`foo`")).to.eql(["foo"]);
					expect(smartSplit('"foo bar" baz')).to.eql(["foo bar", "baz"]);
					expect(smartSplit("'foo bar' baz")).to.eql(["foo bar", "baz"]);
					expect(smartSplit("`foo bar` baz")).to.eql(["foo bar", "baz"]);
				});
				
				it("avoids splitting on delimiters between quote pairs", () => {
					expect(smartSplit("foo 'bar baz' qux")).to.eql(["foo", "bar baz", "qux"]);
					expect(smartSplit("'foo bar ' baz qux")).to.eql(["foo bar ", "baz", "qux"]);
					expect(smartSplit("foo bar ' baz qux'")).to.eql(["foo", "bar", " baz qux"]);
					expect(smartSplit("foo 'bar baz qux'")).to.eql(["foo", "bar baz qux"]);
				});
				
				it("includes quotes if `keepQuotes` is set", () =>
					expect(smartSplit("'foo'", {keepQuotes: true})).to.eql(["'foo'"]));
				
				it("recognises them without an adjacent delimiter", () => {
					const list = ["foo", "bar baz", "qux"];
					expect(smartSplit("foo b'ar ba'z qux")).to.eql(list);
					expect(smartSplit("foo b'ar baz' qux")).to.eql(list);
					expect(smartSplit("foo 'bar ba'z qux")).to.eql(list);
				});
				
				it("allows the quote characters to be changed", () => {
					const opts = {quoteChars: "/"};
					expect(smartSplit("foo /bar baz/ qux", opts)).to.eql(["foo", "bar baz", "qux"]);
					expect(smartSplit("/foo bar  baz / qux", opts)).to.eql(["foo bar  baz ", "qux"]);
					expect(smartSplit("/foo bar/ 'baz qux'", opts)).to.eql(["foo bar", "'baz", "qux'"]);
					expect(smartSplit("~foo bar~ /baz qux/", {quoteChars: "~/"})).to.eql(["foo bar", "baz qux"]);
				});

				it("doesn't get confused by nested quotes", () => {
					let test = "a 'b `c' `d e'` f";
					expect(smartSplit(test)).to.eql(["a", "b `c", "d e'", "f"]);
					expect(smartSplit(test, {keepQuotes: true})).to.eql(["a", "'b `c'", "`d e'`", "f"]);
					test = "a /b `c/ `d e/` f";
					expect(smartSplit(test, {quoteChars: "/`"})).to.eql(["a", "b `c", "d e/", "f"]);
					expect(smartSplit(test, {quoteChars: "/`", keepQuotes: true})).to.eql(["a", "/b `c/", "`d e/`", "f"]);
				});
				
				it("treats empty quote pairs as empty elements", () => {
					expect(smartSplit("foo '' bar")).to.eql(["foo", "", "bar"]);
					expect(smartSplit("foo '''' bar")).to.eql(["foo", "", "bar"]);
					expect(smartSplit("foo ''`` bar")).to.eql(["foo", "", "bar"]);
					expect(smartSplit("foo '' `` bar")).to.eql(["foo", "", "", "bar"]);
					expect(smartSplit("foo ''' bar")).to.eql(["foo", " bar"]);
					expect(smartSplit("foo '' ``")).to.eql(["foo", "", ""]);
					expect(smartSplit("''")).to.eql([""]);
					expect(smartSplit(" '' ")).to.eql([""]);
					expect(smartSplit("''' ")).to.eql([" "]);
					expect(smartSplit("'' ``")).to.eql(["", ""]);
					expect(smartSplit("'' `` ")).to.eql(["", ""]);
					expect(smartSplit("'' `` foo")).to.eql(["", "", "foo"]);
					expect(smartSplit("''", {keepQuotes: true})).to.eql(["''"]);
					expect(smartSplit("foo '' bar", {keepQuotes: true})).to.eql(["foo", "''", "bar"]);
					expect(smartSplit("foo '''' bar", {keepQuotes: true})).to.eql(["foo", "''''", "bar"]);
					expect(smartSplit("foo ''`` bar", {keepQuotes: true})).to.eql(["foo", "''``", "bar"]);
					expect(smartSplit("foo '' `` bar", {keepQuotes: true})).to.eql(["foo", "''", "``", "bar"]);
				});
			});
		
			describe("Escapes", () => {
				it("ignores delimiters preceded by an escape", () =>
					expect(smartSplit("foo\\ bar")).to.eql(["foo bar"]));
				
				it("ignores quotes preceded by an escape", () =>
					expect(smartSplit("foo \\'bar baz\\' qux")).to.eql(["foo", "'bar", "baz'", "qux"]));
				
				it("ignores escape characters preceded by another escape", () =>
					expect(smartSplit("foo\\\\ bar")).to.eql(["foo\\", "bar"]));
				
				it("doesn't require escapes to be used on special characters", () =>
					expect(smartSplit("foo\\bar")).to.eql(["foobar"]));
				
				it("includes them if `keepEscapes` is set", () =>
					expect(smartSplit("foo\\ bar", {keepEscapes: true})).to.eql(["foo\\ bar"]));
			
				it("allows different escape characters to be used", () => {
					expect(smartSplit("foo% bar", {escapeChars: "%"})).to.eql(["foo bar"]);
					expect(smartSplit("foo% bar", {escapeChars: "%", keepEscapes: true})).to.eql(["foo% bar"]);
				});
				
				it("allows different escape characters to be mixed", () => {
					expect(smartSplit("foo%\\ bar", {escapeChars: "%\\"})).to.eql(["foo\\", "bar"]);
					expect(smartSplit("foo%\\ bar", {escapeChars: "%\\", keepEscapes: true})).to.eql(["foo%\\", "bar"]);
				});
				
				it("recognises them inside quoted regions", () => {
					expect(smartSplit("foo 'bar\\'s baz' qux")).to.eql(["foo", "bar's baz", "qux"]);
					expect(smartSplit("foo 'bar\\\\'s baz qux'")).to.eql(["foo", "bar\\s", "baz", "qux"]);
				});
				
				it("does nothing if input terminates early", () =>
					expect(smartSplit("foo \\")).to.eql(["foo"]));
			});
		});
	
		describe("timeSince()", () => {
			const {timeSince} = utils;
			const SEC  = 1000;
			const MIN  = SEC  * 60;
			const HOUR = MIN  * 60;
			const DAY  = HOUR * 24;
			const WEEK = DAY  * 7;
			const MON  = WEEK * 4.345238;
			const YEAR = MON  * 12;
			const DEC  = YEAR * 10;
			const CENT = DEC  * 10;
			const MILL = CENT * 10;
			
			describe("Seconds", () => {
				describe("Past intervals", () => {
					it("formats 1 second",   () => expect(timeSince(SEC * 1)).to.equal("Just now"));
					it("formats 2 seconds",  () => expect(timeSince(SEC * 2)).to.equal("2 seconds ago"));
					it("formats 10 seconds", () => expect(timeSince(SEC * 10)).to.equal("10 seconds ago"));
					it("formats 35 seconds", () => expect(timeSince(SEC * 35)).to.equal("35 seconds ago"));
					it("formats 49 seconds", () => expect(timeSince(SEC * 49)).to.equal("49 seconds ago"));
					it("formats 59 seconds", () => expect(timeSince(SEC * 59)).to.equal("59 seconds ago"));
					it("includes fractions", () => {
						expect(timeSince(SEC * 1.1))  .to.equal("Just now");
						expect(timeSince(SEC * 1.9))  .to.equal("Just now");
						expect(timeSince(SEC * 2.5))  .to.equal("2.5 seconds ago");
						expect(timeSince(SEC * 2.05)) .to.equal("2.05 seconds ago");
						expect(timeSince(SEC * 59.5)) .to.equal("59.5 seconds ago");
					});
				});
				
				describe("Future intervals", () => {
					it("formats 1 second",   () => expect(timeSince(SEC * -1)).to.equal("Just now"));
					it("formats 2 seconds",  () => expect(timeSince(SEC * -2)).to.equal("2 seconds from now"));
					it("formats 10 seconds", () => expect(timeSince(SEC * -10)).to.equal("10 seconds from now"));
					it("formats 35 seconds", () => expect(timeSince(SEC * -35)).to.equal("35 seconds from now"));
					it("formats 49 seconds", () => expect(timeSince(SEC * -49)).to.equal("49 seconds from now"));
					it("formats 59 seconds", () => expect(timeSince(SEC * -59)).to.equal("59 seconds from now"));
					it("includes fractions", () => {
						expect(timeSince(SEC * -1.1))  .to.equal("Just now");
						expect(timeSince(SEC * -1.9))  .to.equal("Just now");
						expect(timeSince(SEC * -2.5))  .to.equal("2.5 seconds from now");
						expect(timeSince(SEC * -2.05)) .to.equal("2.05 seconds from now");
						expect(timeSince(SEC * -59.5)) .to.equal("59.5 seconds from now");
					});
				});
			});
			
			describe("Minutes", () => {
				describe("Past intervals", () => {
					it("formats 1 minute",   () => expect(timeSince(MIN * 1)).to.equal("A minute ago"));
					it("formats 2 minutes",  () => expect(timeSince(MIN * 2)).to.equal("2 minutes ago"));
					it("formats 10 minutes", () => expect(timeSince(MIN * 10)).to.equal("10 minutes ago"));
					it("formats 35 minutes", () => expect(timeSince(MIN * 35)).to.equal("35 minutes ago"));
					it("formats 59 minutes", () => expect(timeSince(MIN * 59)).to.equal("59 minutes ago"));
					it("ignores fractions",  () => {
						expect(timeSince(MIN * 1.5))  .to.equal("A minute ago");
						expect(timeSince(MIN * 1.95)) .to.equal("A minute ago");
						expect(timeSince(MIN * 2.5))  .to.equal("2 minutes ago");
						expect(timeSince(MIN * 2.05)) .to.equal("2 minutes ago");
						expect(timeSince(MIN * 59.5)) .to.equal("59 minutes ago");
					});
				});
				
				describe("Future intervals", () => {
					it("formats 1 minute",   () => expect(timeSince(MIN * -1)).to.equal("A minute from now"));
					it("formats 2 minutes",  () => expect(timeSince(MIN * -2)).to.equal("2 minutes from now"));
					it("formats 10 minutes", () => expect(timeSince(MIN * -10)).to.equal("10 minutes from now"));
					it("formats 35 minutes", () => expect(timeSince(MIN * -35)).to.equal("35 minutes from now"));
					it("formats 59 minutes", () => expect(timeSince(MIN * -59)).to.equal("59 minutes from now"));
					it("ignores fractions",  () => {
						expect(timeSince(MIN * -1.5))  .to.equal("A minute from now");
						expect(timeSince(MIN * -1.95)) .to.equal("A minute from now");
						expect(timeSince(MIN * -2.5))  .to.equal("2 minutes from now");
						expect(timeSince(MIN * -2.05)) .to.equal("2 minutes from now");
						expect(timeSince(MIN * -59.5)) .to.equal("59 minutes from now");
					});
				});
			});
			
			describe("Hours", () => {
				describe("Past intervals", () => {
					it("formats 1 hour",     () => expect(timeSince(HOUR * 1)).to.equal("An hour ago"));
					it("formats 2 hours",    () => expect(timeSince(HOUR * 2)).to.equal("2 hours ago"));
					it("formats 6 hours",    () => expect(timeSince(HOUR * 6)).to.equal("6 hours ago"));
					it("formats 18 hours",   () => expect(timeSince(HOUR * 18)).to.equal("18 hours ago"));
					it("formats 23 hours",   () => expect(timeSince(HOUR * 23)).to.equal("23 hours ago"));
					it("ignores fractions",  () => {
						expect(timeSince(HOUR * 1.5))   .to.equal("An hour ago");
						expect(timeSince(HOUR * 1.95))  .to.equal("An hour ago");
						expect(timeSince(HOUR * 2.5))   .to.equal("2 hours ago");
						expect(timeSince(HOUR * 2.05))  .to.equal("2 hours ago");
						expect(timeSince(HOUR * 11.9))  .to.equal("11 hours ago");
						expect(timeSince(HOUR * 12.01)) .to.equal("12 hours ago");
						expect(timeSince(HOUR * 23.9))  .to.equal("23 hours ago");
					});
				});
				
				describe("Future intervals", () => {
					it("formats 1 hour",     () => expect(timeSince(HOUR * -1)).to.equal("An hour from now"));
					it("formats 2 hours",    () => expect(timeSince(HOUR * -2)).to.equal("2 hours from now"));
					it("formats 6 hours",    () => expect(timeSince(HOUR * -6)).to.equal("6 hours from now"));
					it("formats 18 hours",   () => expect(timeSince(HOUR * -18)).to.equal("18 hours from now"));
					it("formats 23 hours",   () => expect(timeSince(HOUR * -23)).to.equal("23 hours from now"));
					it("ignores fractions",  () => {
						expect(timeSince(HOUR * -1.5))   .to.equal("An hour from now");
						expect(timeSince(HOUR * -1.95))  .to.equal("An hour from now");
						expect(timeSince(HOUR * -2.5))   .to.equal("2 hours from now");
						expect(timeSince(HOUR * -2.05))  .to.equal("2 hours from now");
						expect(timeSince(HOUR * -11.9))  .to.equal("11 hours from now");
						expect(timeSince(HOUR * -12.01)) .to.equal("12 hours from now");
						expect(timeSince(HOUR * -23.9))  .to.equal("23 hours from now");
					});
				});
			});
			
			describe("Days", () => {
				describe("Past intervals", () => {
					it("formats 1 day",      () => expect(timeSince(DAY * 1)).to.equal("Yesterday"));
					it("formats 2 days",     () => expect(timeSince(DAY * 2)).to.equal("2 days ago"));
					it("formats 3 days",     () => expect(timeSince(DAY * 3)).to.equal("3 days ago"));
					it("formats 6 days",     () => expect(timeSince(DAY * 6)).to.equal("6 days ago"));
					it("ignores fractions",  () => {
						expect(timeSince(DAY * 1.1)).to.equal("Yesterday");
						expect(timeSince(DAY * 1.8)).to.equal("Yesterday");
						expect(timeSince(DAY * 2.2)).to.equal("2 days ago");
						expect(timeSince(DAY * 5.5)).to.equal("5 days ago");
						expect(timeSince(DAY * 6.9)).to.equal("6 days ago");
					});
				});
				
				describe("Future intervals", () => {
					it("formats 1 day",      () => expect(timeSince(DAY * -1)).to.equal("Tomorrow"));
					it("formats 2 days",     () => expect(timeSince(DAY * -2)).to.equal("2 days from now"));
					it("formats 3 days",     () => expect(timeSince(DAY * -3)).to.equal("3 days from now"));
					it("formats 6 days",     () => expect(timeSince(DAY * -6)).to.equal("6 days from now"));
					it("ignores fractions",  () => {
						expect(timeSince(DAY * -1.1)).to.equal("Tomorrow");
						expect(timeSince(DAY * -1.8)).to.equal("Tomorrow");
						expect(timeSince(DAY * -2.2)).to.equal("2 days from now");
						expect(timeSince(DAY * -5.5)).to.equal("5 days from now");
						expect(timeSince(DAY * -6.9)).to.equal("6 days from now");
					});
				});
			});
			
			describe("Weeks", () => {
				describe("Past intervals", () => {
					it("formats 1 week",     () => expect(timeSince(WEEK * 1)).to.equal("Last week"));
					it("formats 2 weeks",    () => expect(timeSince(WEEK * 2)).to.equal("2 weeks ago"));
					it("formats 3 weeks",    () => expect(timeSince(WEEK * 3)).to.equal("3 weeks ago"));
					it("formats 4 weeks",    () => expect(timeSince(WEEK * 4)).to.equal("4 weeks ago"));
					it("ignores fractions",  () => {
						expect(timeSince(WEEK * 1.1)).to.equal("Last week");
						expect(timeSince(WEEK * 1.8)).to.equal("Last week");
						expect(timeSince(WEEK * 2.2)).to.equal("2 weeks ago");
						expect(timeSince(WEEK * 4.3)).to.equal("4 weeks ago");
					});
				});
				
				describe("Future intervals", () => {
					it("formats 1 week",     () => expect(timeSince(WEEK * -1)).to.equal("Next week"));
					it("formats 2 weeks",    () => expect(timeSince(WEEK * -2)).to.equal("2 weeks from now"));
					it("formats 3 weeks",    () => expect(timeSince(WEEK * -3)).to.equal("3 weeks from now"));
					it("formats 4 weeks",    () => expect(timeSince(WEEK * -4)).to.equal("4 weeks from now"));
					it("ignores fractions",  () => {
						expect(timeSince(WEEK * -1.1)).to.equal("Next week");
						expect(timeSince(WEEK * -1.8)).to.equal("Next week");
						expect(timeSince(WEEK * -2.2)).to.equal("2 weeks from now");
						expect(timeSince(WEEK * -4.3)).to.equal("4 weeks from now");
					});
				});
			});
			
			describe("Months", () => {
				describe("Past intervals", () => {
					it("formats 1 month",    () => expect(timeSince(MON * 1)).to.equal("Last month"));
					it("formats 2 months",   () => expect(timeSince(MON * 2)).to.equal("2 months ago"));
					it("formats 3 months",   () => expect(timeSince(MON * 3)).to.equal("3 months ago"));
					it("formats 6 months",   () => expect(timeSince(MON * 6)).to.equal("6 months ago"));
					it("formats 11 months",  () => expect(timeSince(MON * 11)).to.equal("11 months ago"));
					it("ignores fractions",  () => {
						expect(timeSince(MON * 1.1)).to.equal("Last month");
						expect(timeSince(MON * 1.8)).to.equal("Last month");
						expect(timeSince(MON * 2.2)).to.equal("2 months ago");
						expect(timeSince(MON * 4.3)).to.equal("4 months ago");
					});
				});
				
				describe("Future intervals", () => {
					it("formats 1 month",    () => expect(timeSince(MON * -1)).to.equal("Next month"));
					it("formats 2 months",   () => expect(timeSince(MON * -2)).to.equal("2 months from now"));
					it("formats 3 months",   () => expect(timeSince(MON * -3)).to.equal("3 months from now"));
					it("formats 6 months",   () => expect(timeSince(MON * -6)).to.equal("6 months from now"));
					it("formats 11 months",  () => expect(timeSince(MON * -11)).to.equal("11 months from now"));
					it("ignores fractions",  () => {
						expect(timeSince(MON * -1.1)).to.equal("Next month");
						expect(timeSince(MON * -1.8)).to.equal("Next month");
						expect(timeSince(MON * -2.2)).to.equal("2 months from now");
						expect(timeSince(MON * -4.3)).to.equal("4 months from now");
					});
				});
			});
			
			describe("Years", () => {
				describe("Past intervals", () => {
					it("formats 1 year",    () => expect(timeSince(YEAR * 1)).to.equal("Last year"));
					it("formats 2 years",   () => expect(timeSince(YEAR * 2)).to.equal("2 years ago"));
					it("formats 3 years",   () => expect(timeSince(YEAR * 3)).to.equal("3 years ago"));
					it("formats 6 years",   () => expect(timeSince(YEAR * 6)).to.equal("6 years ago"));
					it("formats 9 years",   () => expect(timeSince(YEAR * 9)).to.equal("9 years ago"));
					it("ignores fractions",  () => {
						expect(timeSince(YEAR * 1.1)).to.equal("Last year");
						expect(timeSince(YEAR * 1.8)).to.equal("Last year");
						expect(timeSince(YEAR * 2.2)).to.equal("2 years ago");
						expect(timeSince(YEAR * 3.3)).to.equal("3 years ago");
						expect(timeSince(YEAR * 4.3)).to.equal("4 years ago");
						expect(timeSince(YEAR * 9.9)).to.equal("9 years ago");
					});
				});
				
				describe("Future intervals", () => {
					it("formats 1 year",    () => expect(timeSince(YEAR * -1)).to.equal("Next year"));
					it("formats 2 years",   () => expect(timeSince(YEAR * -2)).to.equal("2 years from now"));
					it("formats 3 years",   () => expect(timeSince(YEAR * -3)).to.equal("3 years from now"));
					it("formats 6 years",   () => expect(timeSince(YEAR * -6)).to.equal("6 years from now"));
					it("formats 9 years",   () => expect(timeSince(YEAR * -9)).to.equal("9 years from now"));
					it("ignores fractions",  () => {
						expect(timeSince(YEAR * -1.1)).to.equal("Next year");
						expect(timeSince(YEAR * -1.8)).to.equal("Next year");
						expect(timeSince(YEAR * -2.2)).to.equal("2 years from now");
						expect(timeSince(YEAR * -3.3)).to.equal("3 years from now");
						expect(timeSince(YEAR * -4.3)).to.equal("4 years from now");
						expect(timeSince(YEAR * -9.9)).to.equal("9 years from now");
					});
				});
			});
			
			describe("Decades", () => {
				describe("Past intervals", () => {
					describe("When `maxYear = false`", () => {
						it("formats 1 decade",  () => expect(timeSince(DEC * 1)).to.equal("A decade ago"));
						it("formats 2 decades", () => expect(timeSince(DEC * 2)).to.equal("2 decades ago"));
						it("formats 5 decades", () => expect(timeSince(DEC * 5)).to.equal("5 decades ago"));
						it("formats 9 decades", () => expect(timeSince(DEC * 9)).to.equal("9 decades ago"));
					});
					
					describe("When `maxYear = true`", () => {
						it("formats 10 years", () => expect(timeSince(DEC * 1, true)).to.equal("10 years ago"));
						it("formats 20 years", () => expect(timeSince(DEC * 2, true)).to.equal("20 years ago"));
						it("formats 50 years", () => expect(timeSince(DEC * 5, true)).to.equal("50 years ago"));
						it("formats 90 years", () => expect(timeSince(DEC * 9, true)).to.equal("90 years ago"));
					});
				});
				
				describe("Future intervals", () => {
					describe("When `maxYear = false`", () => {
						it("formats 1 decade",  () => expect(timeSince(DEC * -1)).to.equal("A decade from now"));
						it("formats 2 decades", () => expect(timeSince(DEC * -2)).to.equal("2 decades from now"));
						it("formats 5 decades", () => expect(timeSince(DEC * -5)).to.equal("5 decades from now"));
						it("formats 9 decades", () => expect(timeSince(DEC * -9)).to.equal("9 decades from now"));
					});
					
					describe("When `maxYear = true`", () => {
						it("formats 10 years", () => expect(timeSince(DEC * -1, true)).to.equal("10 years from now"));
						it("formats 20 years", () => expect(timeSince(DEC * -2, true)).to.equal("20 years from now"));
						it("formats 50 years", () => expect(timeSince(DEC * -5, true)).to.equal("50 years from now"));
						it("formats 90 years", () => expect(timeSince(DEC * -9, true)).to.equal("90 years from now"));
					});
				});
			});
			
			describe("Centuries", () => {
				describe("Past intervals", () => {
					describe("When `maxYear = false`", () => {
						it("formats 1 century",   () => expect(timeSince(CENT * 1)).to.equal("A century ago"));
						it("formats 2 centuries", () => expect(timeSince(CENT * 2)).to.equal("2 centuries ago"));
						it("formats 5 centuries", () => expect(timeSince(CENT * 5)).to.equal("5 centuries ago"));
						it("formats 9 centuries", () => expect(timeSince(CENT * 9.1)).to.equal("9 centuries ago"));
					});
					
					describe("When `maxYear = true`", () => {
						it("formats 100 years", () => expect(timeSince(CENT * 1, true)).to.equal("100 years ago"));
						it("formats 200 years", () => expect(timeSince(CENT * 2, true)).to.equal("200 years ago"));
						it("formats 500 years", () => expect(timeSince(CENT * 5, true)).to.equal("500 years ago"));
						it("formats 909 years", () => expect(timeSince(CENT * 9.1, true)).to.equal("909 years ago"));
					});
				});
				
				describe("Future intervals", () => {
					describe("When `maxYear = false`", () => {
						it("formats 1 century",   () => expect(timeSince(CENT * -1)).to.equal("A century from now"));
						it("formats 2 centuries", () => expect(timeSince(CENT * -2)).to.equal("2 centuries from now"));
						it("formats 5 centuries", () => expect(timeSince(CENT * -5)).to.equal("5 centuries from now"));
						it("formats 9 centuries", () => expect(timeSince(CENT * -9.1)).to.equal("9 centuries from now"));
					});
					
					describe("When `maxYear = true`", () => {
						it("formats 100 years", () => expect(timeSince(CENT * -1, true)).to.equal("100 years from now"));
						it("formats 200 years", () => expect(timeSince(CENT * -2, true)).to.equal("200 years from now"));
						it("formats 500 years", () => expect(timeSince(CENT * -5, true)).to.equal("500 years from now"));
						it("formats 909 years", () => expect(timeSince(CENT * -9.1, true)).to.equal("909 years from now"));
					});
				});
			});
			
			describe("Millennia", () => {
				describe("Past intervals", () => {
					describe("When `maxYear = false`", () => {
						it("formats 1 millennium",  () => expect(timeSince(MILL * 1)).to.equal("A millennium ago"));
						it("formats 2 millennia",   () => expect(timeSince(MILL * 2)).to.equal("2 millennia ago"));
						it("formats 5 millennia",   () => expect(timeSince(MILL * 5)).to.equal("5 millennia ago"));
						it("formats 9 millennia",   () => expect(timeSince(MILL * 9)).to.equal("9 millennia ago"));
						it("formats 50 millennia",  () => expect(timeSince(MILL * 50.1)).to.equal("50 millennia ago"));
						it("formats 100 millennia", () => expect(timeSince(MILL * 100.1)).to.equal("100 millennia ago"));
					});
					
					describe("When `maxYear = true`", () => {
						it("formats 1000 years",   () => expect(timeSince(MILL * 1, true)).to.equal("1000 years ago"));
						it("formats 2000 years",   () => expect(timeSince(MILL * 2, true)).to.equal("2000 years ago"));
						it("formats 5000 years",   () => expect(timeSince(MILL * 5, true)).to.equal("5000 years ago"));
						it("formats 9000 years",   () => expect(timeSince(MILL * 9, true)).to.equal("9000 years ago"));
						it("formats 50100 years",  () => expect(timeSince(MILL * 50.1, true)).to.equal("50100 years ago"));
						it("formats 100100 years", () => expect(timeSince(MILL * 100.1, true)).to.equal("100100 years ago"));
					});
				});
				
				describe("Future intervals", () => {
					describe("When `maxYear = false`", () => {
						it("formats 1 millennium",  () => expect(timeSince(MILL * -1)).to.equal("A millennium from now"));
						it("formats 2 millennia",   () => expect(timeSince(MILL * -2)).to.equal("2 millennia from now"));
						it("formats 5 millennia",   () => expect(timeSince(MILL * -5)).to.equal("5 millennia from now"));
						it("formats 9 millennia",   () => expect(timeSince(MILL * -9)).to.equal("9 millennia from now"));
						it("formats 50 millennia",  () => expect(timeSince(MILL * -50.1)).to.equal("50 millennia from now"));
						it("formats 100 millennia", () => expect(timeSince(MILL * -100.1)).to.equal("100 millennia from now"));
					});
					
					describe("When `maxYear = true`", () => {
						it("formats 1000 years",   () => expect(timeSince(MILL * -1, true)).to.equal("1000 years from now"));
						it("formats 2000 years",   () => expect(timeSince(MILL * -2, true)).to.equal("2000 years from now"));
						it("formats 5000 years",   () => expect(timeSince(MILL * -5, true)).to.equal("5000 years from now"));
						it("formats 9000 years",   () => expect(timeSince(MILL * -9, true)).to.equal("9000 years from now"));
						it("formats 50100 years",  () => expect(timeSince(MILL * -50.1, true)).to.equal("50100 years from now"));
						it("formats 100100 years", () => expect(timeSince(MILL * -100.1, true)).to.equal("100100 years from now"));
					});
				});
			});
		});
	});
});
