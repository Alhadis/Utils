"use strict";

const fs = require("fs");
const {resolve} = require("path");


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
 * @example "C:\User\foo\..\bar" -> "C:/User/bar"
 * @param {String} input
 * @return {String}
 */
function normalisePath(input){
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
		})
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
