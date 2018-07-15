"use strict";

const fs        = require("fs");
const {resolve} = require("path");
const {spawn}   = require("child_process");


/**
 * Execute an external command.
 *
 * TODO: Update function description to explain new polymorphic
 *       behaviour. Also, add test coverage.
 *
 * @example exec("sed", ["-e", "s/in/out/"], "input");
 * @param {String|Array} cmd - Executed command(s)
 * @param {String[]} args - List of arguments/switches
 * @param {String} [inputData=null] - Data piped to stdin
 * @param {String} [outputPath=""] - File to write stdout to
 * @param {String} [encoding="utf8"] - Character encoding
 * @return {Promise} Resolves to an object
 */
async function exec(cmd, args = [], inputData = null, outputPath = "", encoding = "utf8"){
	if(Array.isArray(cmd)){
		const commands = cmd.slice();
		let result = {};
		while(commands.length){
			const [cmd, ...argv] = commands.shift();
			const output = commands.length ? "" : outputPath;
			result = await exec(cmd, argv, inputData, output);
			inputData = result.stdout;
		}
		return result;
	}

	const stdio = outputPath
		? ["pipe", fs.openSync(outputPath, "w"), "pipe"]
		:  "pipe";

	const proc = spawn(cmd, args, {stdio});
	let stdout = "";
	let stderr = "";
	if(null !== inputData){
		proc.stdin.write(inputData, encoding);
		proc.stdin.end();
	}
	if(!outputPath){
		proc.stdout.setEncoding(encoding);
		proc.stdout.on("data", data => stdout += data);
	}
	proc.stderr.setEncoding(encoding);
	proc.stderr.on("data", data => stderr += data);
	return new Promise((resolve, reject) => {
		proc.on("close", code => resolve({code, stdout, stderr}));
		proc.on("error", error => reject(error));
	});
}


/**
 * Asynchronously load a resource.
 *
 * @param {String} url - URL or filesystem path
 * @param {String} [encoding="utf8"]
 * @return {Promise}
 * @public
 */
function load(url, encoding = "utf8"){
	return new Promise((resolve, reject) => {
		const protocol = url.match(/^https?/);
		
		// Remote resource: HTTPS or HTTP
		if(protocol){
			let result = "";
			const {get} = require(protocol[0].toLowerCase());
			const request = get(url, response => {
				if(response.statusMessage !== "OK")
					return reject(response);
				encoding && response.setEncoding(encoding);
				response.on("data", s => result += s);
				response.on("end", () => resolve(result));
			});
			request.on("error", e => reject(e));
		}
		
		// Assume parameter to be a filesystem path
		else{
			const fs = require("fs");
			fs.readFile(url, {encoding}, (error, data) => {
				if(error) return reject(error);
				return resolve(data.toString());
			});
		}
	});
}


/**
 * Normalise path separators.
 *
 * Well-formed URIs (those prefixed by `protocol://`)
 * are returned unmodified unless `clobber` is truthy.
 *
 * @example "C:\User\foo\..\bar" -> "C:/User/bar"
 * @param {String} input
 * @param {Boolean} [clobber=false]
 * @return {String}
 */
function normalisePath(input, clobber = false){
	if(!clobber && /^\w*:\/\//.test(input))
		return input;
	input = resolve(input || "");
	return "win32" === process.platform
		? input.replace(/\\/g, "/")
		: input;
}


/**
 * Asynchronously read the entirety of standard input.
 *
 * @param {String} [encoding="utf8"]
 * @return {Promise}
 */
function readStdin(encoding = "utf8"){
	return new Promise(resolve => {
		let input = "";
		process.stdin.setEncoding(encoding);
		process.stdin.on("readable", () => {
			const chunk = process.stdin.read();
			null !== chunk ? input += chunk : resolve(input);
		});
	});
}


/**
 * Synchronously read a number of bytes from a file.
 *
 * Previously named "sampleFile", renamed to eliminate ambiguity.
 * 
 * @param {String} path   - Path to file
 * @param {Number} length - Maximum number of bytes to read
 * @param {Number} offset - Offset to start reading from
 * @return {Array} An array of two values: the loaded data-string, and a
 * boolean indicating if the file was small enough to be fully loaded.
 */
function sipFile(path, length, offset = 0){
	if(!path || length < 1)
		return [null, false];
	
	let data = Buffer.alloc(length);
	const fd = fs.openSync(path, "r");
	const bytesRead = fs.readSync(fd, data, 0, length, offset);
	
	let isComplete = false;
	
	data = data.toString();
	if(bytesRead < data.length){
		isComplete = true;
		data = data.substring(0, bytesRead);
	}
	
	return [data, isComplete];
}


/**
 * Use a plain object to generate an [fs.Stats instance]{@link https://nodejs.org/api/all.html#fs_class_fs_stats}.
 *
 * Actual {@link fs.Stats} instances are returned unmodified.
 *
 * @see {@link https://nodejs.org/api/all.html#fs_class_fs_stats}
 * @param {Object} input
 * @return {fs.Stats}
 */
function statify(input){
	if(!input) return null;
	
	if("function" === typeof input.isSymbolicLink)
		return input;
	
	const output = Object.create(fs.Stats.prototype);
	for(const key in input){
		const value = input[key];
		
		switch(key){
			case "atime":
			case "ctime":
			case "mtime":
			case "birthtime":
				output[key] = !(value instanceof Date)
					? new Date(value)
					: value;
				break;
			default:
				output[key] = value;
		}
	}
	
	return output;
}


/**
 * Replace any occurrences of `$HOME` with a tilde.
 *
 * @example tildify("/Users/johngardner/Labs/Utils") == "~/Labs/Utils"
 * @param {String} input
 * @return {String}
 */
function tildify(input){
	if("win32" === process.platform)
		return input;
	const home = process.env.HOME + "/";
	return (0 === input.indexOf(home))
		? input.substr(home.length).replace(/^\/?/, "~/")
		: input;
}


/**
 * Locate a program file in the user's $PATH.
 *
 * If found, the returned {@link Promise} resolves to the absolute
 * pathname of the named executable. Otherwise, it resolves to the
 * empty string. Rejects with an error if the execution failed.
 *
 * @example which("curl") == "/usr/bin/curl"
 * @example which("nada") == ""
 * @param {String} name
 * @return {Promise}
 */
function which(name){
	return new Promise((resolve, reject) => {
		if(!name) return resolve("");
		const {exec} = require("child_process");
		const cmdStr = "win32" === process.platform
			? `@for %g in (ECHO ${name.replace(/%/g, "%%")}) do`
				+ " @for %e in (%PATHEXT%) do"
				+ " @for %i in (%g%e) do "
				+ ' @if NOT "%~$PATH:i"=="" echo %~$PATH:i'
			: `command -v '${name.replace(/'/g, `'"'"'`)}' 2>/dev/null`;
		exec(cmdStr, {windowsHide: true}, (error, output) => error
			? reject(error)
			: resolve(output.split(/\r?\n/).filter(Boolean)[0] || ""));
	});
}
