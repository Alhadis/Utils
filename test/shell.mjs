import fs         from "fs";
import path       from "path";
import url        from "url";
import assert     from "assert";
import {homedir}  from "os";
import * as utils from "../index.mjs";

describe("Shell-specific functions", () => {
	const dir = path.dirname(url.fileURLToPath(import.meta.url));
	
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

		describe("Encoding", () => {
			it("encodes streams as UTF-8 by default", async () => {
				const echo = ["-e", "process.stdin.on('data', bytes => process.stdout.write(bytes))"];
				expect((await exec("node", echo, "𒀻")).stdout).to.equal("𒀻");
			});
			
			it("allows default encodings to be overridden", async () => {
				const echo = ["-e", "process.stdout.write('foo')"];
				const result = await exec("node", echo, null, {encoding: "base64"});
				expect(result).to.eql({stdout: "Zm9v", stderr: "", code: 0});
			});
			
			it("allows per-stream encoding assignment", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, {encoding: ["utf8", "utf8", "base64"]})).to.eql({
					stdout: "foo",
					stderr: "Zm9v",
					code: 0,
				});
				expect(await exec("node", echo, null, {encoding: ["utf8", "base64", "utf8"]})).to.eql({
					stdout: "Zm9v",
					stderr: "foo",
					code: 0,
				});
			});
			
			it("treats strings as shorthand for `{encoding: …}`", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, "base64")).to.eql({stdout: "Zm9v", stderr: "Zm9v", code: 0});
			});
			
			it("uses UTF-8 for missing encoding entries", async () => {
				const echo = ["-e", "process.stdout.write('foo'); process.stderr.write('foo')"];
				expect(await exec("node", echo, null, {encoding: ["utf8", "", "base64"]})).to.eql({
					stdout: "foo",
					stderr: "Zm9v",
					code: 0,
				});
				expect(await exec("node", echo, null, {encoding: ["utf8", "base64"]})).to.eql({
					stdout: "Zm9v",
					stderr: "foo",
					code: 0,
				});
				const read = (() => {
					const stdin = [];
					const toHex = a => a.map(x => x.toString(16).toUpperCase().padStart(2, "0"));
					process.stdin.on("readable", () => {
						const data = process.stdin.read();
						null === data ? console.log(toHex(stdin).join(" ")) : stdin.push(...data);
					});
				}).toString().replace(/^.*?=>\s*{|}$/g, "").replace(/[\n\t]+/g, "");
				expect(await exec("node", ["-e", read], "😂", {encoding: ["", "base64"]})).to.eql({
					stdout: "RjAgOUYgOTggODIK",
					stderr: "",
					code: 0,
				});
			});
		});

		describe("Redirection", function(){
			this.slow(5000);
			const tempFile = path.join(dir, "fixtures", "temp.log");
			after("Removing temporary file", () => fs.unlinkSync(tempFile));
			
			it("can write standard output to a file", async () => {
				await exec("node", ["-e", "process.stdout.write('Foo\\nBar')"], null, {outputPath: tempFile});
				expect(fs.existsSync(tempFile)).to.be.true;
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Foo\nBar");
			});
			
			it("replaces a file's existing content", async () => {
				await exec("node", ["-e", "process.stdout.write('Foo\\n')"], null, {outputPath: tempFile});
				expect(fs.existsSync(tempFile)).to.be.true;
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Foo\n");
				await exec("node", ["-e", "process.stdout.write('Bar')"], null, {outputPath: tempFile});
				expect(fs.readFileSync(tempFile, "utf8")).to.equal("Bar");
			});
			
			it("respects the stream's encoding", async () => {
				const data = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
				const emit = ["-e", `process.stdout.write(Buffer.from("${data}", "base64"))`];
				await exec("node", emit, null, {outputPath: tempFile, encoding: "binary"});
				expect(fs.readFileSync(tempFile)).to.eql(Buffer.from(data, "base64"));
			});
		});
	
		describe("Environment", () => {
			const echoEnv = ["-e", "process.stdout.write(JSON.stringify(process.env))"];
			const randomKey = "foo" + Date.now() + Math.random(1e10).toString(16);
			
			it("makes the caller's environment visible to the subprocess", async () =>
				expect(JSON.parse((await exec("node", echoEnv)).stdout)).to.eql(process.env));
			
			it("allows new environment variables to be added", async () => {
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "A"}});
				expect(JSON.parse(stdout)).to.have.property(randomKey).which.equals("A");
			});
			
			it("does not replace the existing environment", async () => {
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "B"}});
				expect(JSON.parse(stdout)).to.include(process.env);
			});
			
			it("overwrites existing variables of the same name", async () => {
				process.env[randomKey] = "C";
				const {stdout} = await exec("node", echoEnv, null, {env: {[randomKey]: "D"}});
				expect(JSON.parse(stdout)).to.have.property(randomKey).which.equals("D");
				delete process.env[randomKey];
			});
		});

		describe("Working directory", () => {
			const echoCwd = ["-e", "process.stdout.write(process.cwd())"];
			
			let cwd = "";
			afterEach(() => cwd && process.chdir(cwd));
			beforeEach(() => { cwd = process.cwd(); process.chdir(dir); });
			
			it("defaults to the parent process's working directory", async () => {
				const {stdout} = await exec("node", echoCwd);
				expect(stdout).to.equal(dir);
			});
			
			it("can change the subprocess's working directory", async () => {
				cwd = path.join(dir, "fixtures");
				const {stdout} = await exec("node", echoCwd, null, {cwd});
				expect(stdout).to.equal(path.join(dir, "fixtures"));
			});
		});
	});

	describe("execChain()", function(){
		const {execChain} = utils;
		this.slow(1000);
		
		it("executes a pipeline of external commands", async () =>
			expect(await execChain([
				["printf", "%s\\n", "foo"],
				["sed", "s/foo/bar/"],
				["tr", "a-z", "A-Z"],
			])).to.eql({code: 0, stdout: "BAR\n", stderr: ""}));
		
		it("executes pipelines asynchronously", async () =>
			expect(execChain([["true"]])).to.be.a("promise"));
		
		it("accepts a string for commands without arguments", async () => {
			const [{code: code0}, {code: code1}] = await Promise.all([
				execChain(["true"]),
				execChain(["false"]),
			]);
			expect(code0).to.equal(0);
			expect(code1).to.equal(1);
		});
		
		it("avoids modifying the original command list", async () => {
			const cmds = [["echo", "Foo"], ["grep", "Foo"]];
			const copy = JSON.parse(JSON.stringify(cmds));
			await execChain(cmds);
			expect(cmds).to.eql(copy);
		});
		
		it("returns the exit status of the last command", async () => {
			expect(await execChain([["true"], ["false"]])).to.eql({stdout: "", stderr: "", code: 1});
			expect(await execChain([["false"], ["true"]])).to.eql({stdout: "", stderr: "", code: 0});
		});
		
		it("concatenates each command's stderr stream", async () =>
			expect(await execChain([
				["node", "-e", 'console.log("ABC"); console.warn("123")'],
				["node", "-e", 'console.log("XYZ"); console.warn("456")'],
			])).to.eql({
				code: 0,
				stderr: "123\n456\n",
				stdout: "XYZ\n",
			}));
		
		it("can pipe input to the first command", async () =>
			expect(await execChain([["sed", "s/foo/bar/"]], "<foo>")).to.eql({
				code: 0,
				stderr: "",
				stdout: "<bar>\n",
			}));
		
		it("can write the last command's output to a file", async () => {
			const tmp = path.join(dir, "fixtures", "temp.log");
			fs.existsSync(tmp) && fs.unlinkSync(tmp);
			expect(await execChain([
				["node", "-e", "console.warn(123); console.log(456)"],
				["sed", "s/456/bar/"],
			], null, {outputPath: tmp})).to.eql({
				code: 0,
				stderr: "123\n",
				stdout: "",
			});
			expect(fs.readFileSync(tmp, "utf8")).to.equal("bar\n");
			fs.unlinkSync(tmp);
		});
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
	
	describe("ls()", () => {
		const {ls, nerf} = utils;
		const fixtures = path.join(dir, "fixtures", "ls");
		const unlink = nerf(fs.unlinkSync);
		
		// Remove date-related filesystem properties; timestamps confuse tests
		function stripTimestamps(subject){
			if(subject instanceof Map){
				subject.forEach(stripTimestamps);
				return subject;
			}
			for(const key of Object.keys(subject))
				if(/^(?:[amc]|birth)time(?:ms)?$/i.test(key) || subject[key] instanceof Date)
					delete subject[key];
			return subject;
		}
		
		describe("Default behaviour", () => {
			const lnk = path.join(fixtures, "file.lnk");
			let expected, result;
			
			before("Loading fixtures", async () => {
				const paths = ".gitignore file.1 file.2 subdir.1".split(" ");
				expected = new Map(paths.map(x => [x = path.join(fixtures, x), fs.lstatSync(x)]));
				stripTimestamps(expected);
				unlink(lnk);
			});
			
			after("Removing symlink", () => fs.existsSync(lnk) && fs.unlinkSync(lnk));
			
			it("runs asynchronously", async () => {
				result = ls(fixtures);
				expect(result).to.be.an.instanceOf(Promise);
				let value = 0;
				result.then(() => ++value); // XXX: Overkill?
				expect(++value).to.equal(1);
				return result;
			});
			
			it("resolves with a Map", async () =>
				expect(result = await result).to.be.an.instanceOf(Map));
			
			it("lists only the immediate directory contents", async () => {
				expect(result.size).to.equal(expected.size);
				stripTimestamps(result);
				expect(result).to.eql(expected);
			});
			
			it("lists paths pointing to regular files", async () => {
				const file1 = path.join(fixtures, "file.1");
				const file2 = path.join(fixtures, "file.2");
				const list1 = stripTimestamps(await ls(file1));
				const list2 = stripTimestamps(await ls([file1, file2]));
				expect(list1).to.eql(new Map([
					[file1, expected.get(file1)],
				]));
				expect(list2).to.eql(new Map([
					[file1, expected.get(file1)],
					[file2, expected.get(file2)],
				]));
			});
			
			it("lists symbolic links without following them", async () => {
				fs.symlinkSync("file.1", lnk);
				const stat = fs.lstatSync(lnk);
				const list = await ls(lnk);
				[...list.values(), stat].forEach(stripTimestamps);
				expect(list).to.eql(new Map([[lnk, stat]]));
			});
		});
		
		describe("Recursion", () => {
			const link1 = path.join(fixtures, "1.lnk");
			const link2 = path.join(fixtures, "subdir.1", "2.lnk");
			const link3 = path.join(fixtures, "subdir.1", "subdir.2", "subdir.3", "3.lnk");
			let levels = [];
			let linked = [];
			
			before("Loading fixtures", async () => {
				const paths = ".gitignore file.1 file.2".split(" ");
				levels.push([...paths, "subdir.1"]);
				for(let s = "", i = 1; i < 5; ++i){
					s += `subdir.${i}`;
					paths.push(s);
					for(let j = 1; j < 5; ++j){
						const str = `${s}/file.${i}.${j}`;
						paths.push(str);
						if(4 === i) linked.push(str);
					}
					levels.push(paths.slice());
					if(i < 4) levels[levels.length - 1].push(`${s}/subdir.${i + 1}`);
					s += "/";
				}
				linked.unshift(...levels[0], ...levels[1]);
				[levels, [linked]] = [levels, [linked]].map(list =>
					list.map(paths => new Map(paths.map(x => [
						x = path.join(fixtures, x),
						stripTimestamps(fs.lstatSync(x)),
					]))));
				unlink(link1);
			});
			
			after("Removing symlinks", () => [link1, link2, link3].map(unlink));
			
			for(let i = 0; i < 5; ++i)
				it(`recurses ${i} subdirectory level(s)`, async () =>
					expect(stripTimestamps(await ls(fixtures, {recurse: i}))).to.eql(levels[i]));
			
			it("recurses indefinitely", async () => {
				const all = levels[levels.length - 1];
				expect(stripTimestamps(await ls(fixtures, {recurse: -1}))).to.eql(all);
				expect(stripTimestamps(await ls(fixtures, {recurse: Infinity}))).to.eql(all);
				expect(stripTimestamps(await ls(fixtures, {recurse: -Infinity}))).to.eql(all);
			});
			
			it("follows symbolic links", async () => {
				fs.symlinkSync("./subdir.1/subdir.2/subdir.3/subdir.4", link1);
				const list = stripTimestamps(await ls(fixtures, {recurse: 1, followSymlinks: true}));
				expect(list).to.eql(new Map([...linked, [link1, stripTimestamps(fs.lstatSync(link1))]]));
			});
			
			it("ignores broken symlinks", async () => {
				const subdir1 = path.join(fixtures, "subdir.1");
				const nothing = path.join(subdir1, "nothing");
				expect(fs.existsSync(nothing)).to.be.false;
				fs.symlinkSync(nothing, link2);
				
				const all = levels[levels.length - 1];
				all.set(link1,   stripTimestamps(fs.lstatSync(link1)));
				all.set(link2,   stripTimestamps(fs.lstatSync(link2)));
				all.set(subdir1, stripTimestamps(fs.lstatSync(subdir1)));
				
				const list = stripTimestamps(await ls(fixtures, {recurse: -1, followSymlinks: true}));
				assert.deepStrictEqual(list, all);
			});
			
			it("never recurses forever", async () => {
				fs.symlinkSync(path.join(fixtures, "subdir.1"), link3);
				const all = levels.pop();
				const sub = path.join(fixtures, "subdir.1", "subdir.2", "subdir.3");
				all.set(sub,   stripTimestamps(fs.lstatSync(sub)));
				all.set(link1, stripTimestamps(fs.lstatSync(link1)));
				all.set(link3, stripTimestamps(fs.lstatSync(link3)));
				expect(stripTimestamps(await ls(fixtures, {recurse: -1, followSymlinks: true}))).to.eql(all);
			});
		});
		
		describe("Inaccessible directories", () => {
			const tmp = path.join(fixtures, "tmp");
			
			before("Creating fixture", () => {
				fs.mkdirSync(tmp);
				fs.chmodSync(tmp, 0);
			});
			
			after("Removing fixture", () => fs.rmdirSync(tmp));
			
			it("raises an exception if accessed directly", async () => {
				let error = null;
				try{ await ls(tmp); }
				catch(e){ error = e; }
				expect(error).to.be.an("error");
			});
			
			it("suppresses errors during recursion", () =>
				ls(path.dirname(tmp), {recurse: 1}));
		});
	
		describe("Filtering", () => {
			let stats = null;
			
			before("Loading fixtures", () =>
				stats = new Map(["file.2", "subdir.1/file.1.2", "subdir.1/subdir.2/file.2.2"]
					.map(x => [x = path.join(fixtures, x), stripTimestamps(fs.lstatSync(x))])));
			
			it("filters lists with regular expressions", async () => {
				const list = await ls(fixtures, {filter: /file(?:\.\d)?\.2$/, recurse: 2});
				assert.deepStrictEqual(stripTimestamps(list), stats);
			});
			
			it("filters lists with predicate functions", async () => {
				let path, file;
				const filter = (...args) => ([path, file] = args, path.endsWith(".2") && file.isFile());
				const list = stripTimestamps(await ls(fixtures, {filter, recurse: 2}));
				assert.deepStrictEqual(list, stats);
				expect(fs.existsSync(path)).to.be.true;
				expect(file).to.be.an.instanceOf(fs.Stats);
			});
			
			it("ignores paths matching a regular expression", async () => {
				const files = ["subdir.1", ".gitignore"].map(x => [x = path.join(fixtures, x), fs.lstatSync(x)]);
				const list = stripTimestamps(await ls(fixtures, {ignore: /file\.[12]$/}));
				assert.deepStrictEqual(list, stripTimestamps(new Map(files)));
			});
			
			it("ignores paths matching a predicate function", async () => {
				let args = [];
				const ignore = (path, file) => (args = [path, file], /([\\/])\.(?:(?!\1).)+$/.test(path) || file.isDirectory());
				const result = ["file.1", "file.2"].map(x => [x = path.join(fixtures, x), fs.lstatSync(x)]);
				const list = stripTimestamps(await ls(fixtures, {ignore}));
				assert.deepStrictEqual(list, stripTimestamps(new Map(result)));
				expect(fs.existsSync(args[0])).to.be.true;
				expect(args[1]).to.be.an.instanceOf(fs.Stats);
			});
			
			it("never scans directories it ignores", async () => {
				const scanned = [];
				const ignore = path => {
					scanned.push(path.substring(fixtures.length + 1));
					return path.endsWith("subdir.2");
				};
				const result = await ls(fixtures, {recurse: -1, ignore});
				expect([...result.keys()]).not.to.include(path.join(fixtures, "subdir.1", "subdir.2"));
				expect(scanned.sort()).to.eql(`
					.gitignore
					file.1
					file.2
					subdir.1
					subdir.1/file.1.1
					subdir.1/file.1.2
					subdir.1/file.1.3
					subdir.1/file.1.4
					subdir.1/subdir.2
				`.split(/\s+/).filter(Boolean).sort());
			});
		});
	});
	
	describe("readStdin()", function(){
		const {exec} = utils;
		const file = path.join(dir, "fixtures", "stdin.mjs");
		this.slow(1000);
		
		it("reads standard input to completion", async () => {
			expect((await exec("node", [file], "Hello")).stdout).to.equal("5\n");
			expect((await exec("node", [file], ", world")).stdout).to.equal("7\n");
		});
	});
	
	describe("rmrf()", function(){
		this.slow(1000);
		const {rmrf, exec, ls} = utils;
		const fixtures = path.join(dir, "fixtures", "rmrf");
		const junk1 = path.join(fixtures, "junk");
		const junk2 = path.join(fixtures, "junk2");
		const rmExe = path.join(fixtures, "rm");
		let cwd, paths;
		
		// Create a bunch of crap to rimraf the hell out of
		async function makeJunk(){
			if("win32" === process.platform){
				// TODO: Write tests for Windows
				return;
			}
			else{
				expect(fs.lstatSync("mkjunk").mode & 0o111).to.be.above(0);
				await exec(path.join(fixtures, "mkjunk"));
				
				// Assert that files were created successfully
				for(const junk of [junk1, junk2])
					expect([...(await ls(junk, {recurse: -1})).keys()].sort()).to.eql([
						"junk.1", "junk.2", "junk.3",
						"foo", "foo/foo.1", "foo/foo.2", "foo/foo.3",
						"bar", "bar/bar.1", "bar/bar.2", "bar/bar.3",
						"bar/baz", "bar/baz/baz.1", "bar/baz/baz.2", "bar/baz/baz.3",
					].map(x => path.join(junk, x)).sort());
			}
		}
		
		// Create a bunch of files whose names contain unsafe characters
		async function makeUnsafe(){
			if("win32" === process.platform){
				// TODO: Handle Windows
				return;
			}
			else{
				await exec(path.join(fixtures, "mkunsafe"));
				expect(fs.lstatSync("junk/$foo").isFile()).to.be.true;
				expect(fs.lstatSync("junk/bar") .isFile()).to.be.true;
			}
		}
		
		// Shadow the rm(1) binary so error-handling can be tested
		async function makeRmHack(){
			fs.writeFileSync(rmExe, "#!/bin/sh\nfalse\n");
			fs.chmodSync(rmExe, 0o755);
			const pathKey = Object.keys(paths).pop();
			process.env[pathKey] = fixtures + path.delimiter + process.env[pathKey];
		}
		
		before(() => {
			cwd = process.cwd();
			paths = "win32" === process.platform
				? {__proto__: null, Path: process.env.Path}
				: {__proto__: null, PATH: process.env.PATH};
		});
		after(() => Object.assign(process.env, paths));
		beforeEach(() => process.chdir(fixtures));
		afterEach(() => {
			fs.existsSync(rmExe) && fs.unlinkSync(rmExe);
			process.chdir(cwd);
		});
		
		it("removes files", async () => {
			await makeJunk();
			const file = path.join(fixtures, "junk", "junk.1");
			expect(fs.existsSync(file)).to.be.true;
			await rmrf(file);
			expect(fs.existsSync(file)).to.be.false;
		});
		
		it("ignores files that don't exist", async () => {
			await makeJunk();
			const file = path.join(fixtures, "junk", "junk.0");
			expect(fs.existsSync(file)).to.be.false;
			await rmrf(file);
			await rmrf([]);
			expect(fs.existsSync(file)).to.be.false;
		});
		
		it("recursively removes directories", async () => {
			await makeJunk();
			expect(fs.existsSync(junk1)).to.be.true;
			expect(fs.existsSync(junk2)).to.be.true;
			await rmrf(junk1);
			await rmrf(junk2);
			expect(fs.existsSync(junk1)).to.be.false;
			expect(fs.existsSync(junk2)).to.be.false;
		});
		
		it("recursively removes multiple directories", async () => {
			await makeJunk();
			expect(fs.existsSync(junk1)).to.be.true;
			expect(fs.existsSync(junk2)).to.be.true;
			await rmrf([junk1, junk2]);
			expect(fs.existsSync(junk1)).to.be.false;
			expect(fs.existsSync(junk2)).to.be.false;
		});
		
		it("safely handles shell metacharacters in filenames", async () => {
			if("win32" === process.platform) return; // TODO: Handle Windows
			await makeUnsafe();
			await exec(path.join(fixtures, "rmunsafe.mjs"), [], null, {env: {foo: "bar"}});
			expect(fs.existsSync("junk/$foo")).to.be.false;
			expect(fs.existsSync("junk/bar")) .to.be.true;
			await makeUnsafe();
			await rmrf(junk1);
			expect(fs.existsSync("junk"))     .to.be.false;
			expect(fs.existsSync("junk/$foo")).to.be.false;
			expect(fs.existsSync("junk/bar")) .to.be.false;
		});
		
		it("raises an exception for non-zero exit-codes", async () => {
			await makeRmHack();
			let error = null;
			try{ await rmrf(junk1); }
			catch(e){ error = e; }
			expect(error).to.be.an("error");
			expect(error.message).to.match(/^(?:rm|CMD\.EXE) .*exited with 1$/);
		});
		
		it("ignores exceptions if `ignoreErrors` is set", async () => {
			await makeRmHack();
			let error = null;
			try{ await rmrf(junk1, true); }
			catch(e){ error = e; }
			expect(error).to.be.null;
		});
	});
	
	describe("sip()", () => {
		const {sip} = utils;
		const fixturePath  = path.join(dir, "fixtures", "stdin.mjs");
		const fixtureText  = fs.readFileSync(fixturePath, "utf8");
		const fixtureBytes = Uint8Array.from(fs.readFileSync(fixturePath));
		
		it("reads the first 80 bytes by default", async () => {
			const expected = fixtureText.substr(0, 80);
			expect(await sip(fixturePath)).to.equal(expected);
		});
		
		it("reads no more than what it needs to", async () =>
			expect(await sip("/dev/zero")).to.equal("\0".repeat(80)));
		
		it("can read portions of arbitrary length", async () => {
			expect(await sip(fixturePath, 6)).to.equal("import");
			for(let i = 0; i < 24; ++i){
				const expected = fixtureText.substr(0, i);
				expect(await sip(fixturePath, i)).to.equal(expected);
			}
		});
		
		it("can read starting at an arbitrary offset", async () => {
			for(let i = 1; i < 5; ++i){
				const expected = fixtureText.substr(i, 24);
				expect(await sip(fixturePath, 24, i)).to.equal(expected);
			}
		});
		
		it("returns a byte-array if requested", async () => {
			expect(await sip(fixturePath, 10, 0, true)).to.eql(fixtureBytes.subarray(0, 10));
			expect(await sip(fixturePath, 10, 5, true)).to.eql(fixtureBytes.subarray(5, 15));
			expect(await sip("/dev/zero", 80, 0, true)).to.eql(new Uint8Array(80));
		});
		
		it("returns empty results for invalid arguments", async () => {
			expect(await sip(null)).to.equal("");
			expect(await sip(fixturePath, -1)).to.equal("");
			expect(await sip(fixturePath, -1, 0, true)).to.eql(new Uint8Array([]));
			expect(await sip(null, 80, 0, true))       .to.eql(new Uint8Array([]));
		});
	});
	
	describe("tildify()", () => {
		const {tildify} = utils;
		const HOME      = process.env.HOME || homedir();
		const env       = Object.getOwnPropertyDescriptor(process, "env");
		const platform  = Object.getOwnPropertyDescriptor(process, "platform");
		
		after(() => Object.defineProperties(process, {platform, env}));
		before(() => Object.defineProperties(process, {
			platform: {...platform, value: "linux", writable: true},
			env:      {...env,      value: {...process.env, HOME}},
		}));
		
		it("replaces $HOME with a tilde", () => {
			expect(tildify(`${HOME}`)).to.equal("~/");
			expect(tildify(`${HOME}/`)).to.equal("~/");
			expect(tildify(`${HOME}/Labs`)).to.equal("~/Labs");
			expect(tildify(`${HOME}/Downloads/`)).to.equal("~/Downloads/");
		});
		
		it("only replaces the start of a string", () => {
			expect(tildify(`/${HOME}`)).to.equal(`/${HOME}`);
			expect(tildify(`/tmp/${HOME}`)).to.equal(`/tmp/${HOME}`);
			expect(tildify(`${HOME}/Desktop/${HOME}`)).to.equal(`~/Desktop/${HOME}`);
			expect(tildify(`${HOME}/Desktop/${HOME}/`)).to.equal(`~/Desktop/${HOME}/`);
		});
		
		it("does nothing on Windows", () => {
			process.platform = "win32";
			for(const path of [HOME, `${HOME}/`, `${HOME}/Labs`, `${HOME}/Downloads/`])
				expect(tildify(path)).to.equal(path);
		});
	});
	
	describe("which()", () => {
		const {which} = utils;
		const pathKey = "win32" === process.platform ? "Path" : "PATH";
		const fixtures = path.join(dir, "fixtures", "which");
		const tmpClean = () => fs.readdirSync(fixtures).forEach(file =>
			/^tmp\./i.test(file) && fs.unlinkSync(path.join(fixtures, file)));
		
		let env, firstNode = "";
		before(() => tmpClean(env = process.env));
		after(() => tmpClean(process.env = env));
		beforeEach(() => process.env = {...env});

		it("returns the path of the first matching executable", async () => {
			expect(firstNode = await which("node")).to.not.be.empty;
			expect(fs.statSync(firstNode).isFile()).to.be.true;
		});
		
		it("returns every matching path if the `all` parameter is set", async () => {
			const result = await which("node", true);
			expect(result).to.be.an("array");
			expect(result[0]).to.be.a("string").and.to.equal(firstNode);
			process.env[pathKey] = fixtures + path.delimiter + process.env[pathKey];
			const nodeExe = "win32" === process.platform ? "node.exe" : "node";
			expect(await which("node", true)).to.eql([path.join(fixtures, nodeExe), ...result]);
		});

		it("returns an empty value if nothing was matched", async () => {
			expect(await which("wegfjekrwg")).to.equal("");
			expect(await which("wegfjekrwg", true)).to.be.an("array").with.lengthOf(0);
		});
		
		it("locates programs with names containing whitespace", async () => {
			process.env[pathKey] = fixtures;
			"win32" === process.platform
				? expect(await which("APP DATA")).to.equal(path.join(fixtures, "APP DATA.bat"))
				: expect(await which("foo bar")).to.equal(path.join(fixtures, "foo bar"));
		});

		it("doesn't break when passed empty input", async () => {
			expect(await which(""))          .to.equal("");
			expect(await which())            .to.equal("");
			expect(await which(null))        .to.equal("");
			expect(await which(false))       .to.equal("");
			expect(await which("",    true)) .to.eql([]);
			expect(await which(null,  true)) .to.eql([]);
			expect(await which(false, true)) .to.eql([]);
		});
		
		it("doesn't break if $PATH is empty", async () => {
			// HACK: CMD.EXE resolves variable-names case-insensitively
			for(const key in process.env)
				if(/^PATH(?:EXT)?$/i.test(key))
					delete process.env[key];
			expect(await which("node"))       .to.equal("");
			expect(await which("node", true)) .to.eql([]);
		});
		
		// Windows-specific specs
		"win32" === process.platform && describe("Windows-specific", () => {
			beforeEach(() => process.env = {...env, Path: fixtures});
			before(async () => {
				process.env.Path    = dir;
				process.env.PATHEXT = ".COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.WSF;.WSH;.MSC";
				expect(await which("bar"))       .to.equal("");
				expect(await which("tmp.1.foo")) .to.equal("");
				expect(await which("tmp.2.foo")) .to.equal("");
			});
			
			it("tests %PATHEXT% case-insensitively", async () => {
				process.env.Path    = fixtures + path.delimiter + dir;
				process.env.PATHEXT += ";.FOO";
				fs.writeFileSync(path.join(fixtures, "tmp.1.foo"), "");
				fs.writeFileSync(path.join(fixtures, "tmp.2.FOO"), "");
				expect(await which("bar"))   .to.equal(path.join(fixtures, "bar.foo"));
				expect(await which("tmp.1")) .to.equal(path.join(fixtures, "tmp.1.foo"));
				expect(await which("tmp.2")) .to.equal(path.join(fixtures, "tmp.2.foo"));
			});
			
			it('defaults to ".COM;.EXE;.BAT" if %PATHEXT% is unset', async () => {
				process.env.PATHEXT = "";
				for(const ext of "vbs vbe js wsf wsh msc".split(" ")){
					fs.writeFileSync(path.join(fixtures, "tmp." + ext), "");
					expect(await which("tmp"))       .to.equal("");
					expect(await which("tmp", true)) .to.eql([]);
				}
				const batFile = path.join(fixtures, "tmp.bat");
				fs.writeFileSync(batFile, "");
				expect(await which("tmp"))       .to.equal(batFile);
				expect(await which("tmp", true)) .to.eql([batFile]);
				
				const exeFile = path.join(fixtures, "tmp.exe");
				fs.writeFileSync(exeFile, "");
				expect(await which("tmp"))       .to.equal(exeFile);
				expect(await which("tmp", true)) .to.eql([exeFile, batFile]);
				
				const comFile = path.join(fixtures, "tmp.com");
				fs.writeFileSync(comFile, "");
				expect(await which("tmp"))       .to.equal(comFile);
				expect(await which("tmp", true)) .to.eql([comFile, exeFile, batFile]);
			});
			
			it("doesn't interpolate variables", async () => {
				expect(await which("%APPDATA%")) .to.equal(path.join(fixtures, "%APPDATA%.bat"));
				expect(await which("%APPDATA%")) .to.equal(path.join(fixtures, "%APPDATA%.bat"));
				expect(await which("%DATE%"))    .to.equal(path.join(fixtures, "%DATE%.bat"));
				expect(await which("%EMPTY%"))   .to.equal("");
				expect(await which("%EMPTY"))    .to.equal("");
			});
			
			it("doesn't split on delimiters", async () =>
				expect(await which("APP;DATA")).to.equal(path.join(fixtures, "APP;DATA.bat")));
			
			it("treats escape sequences literally", async () => {
				expect(await which("^%APPDATA%"))   .to.equal(path.join(fixtures, "^%APPDATA%.bat"));
				expect(await which("^%APPDATA^^%")) .to.equal(path.join(fixtures, "^%APPDATA^^%.bat"));
				expect(await which("%APP DATA%"))   .to.equal(path.join(fixtures, "%APP DATA%.bat"));
			});
		});
	});
});
