"use strict";

describe("Node-specific functions", () => {
	const utils = require("../index.js");
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
