/**
 * Execute an external command.
 *
 * @throws {Error} Rejects if the subprocess emits an `error` event.
 * @example exec("sed", ["-e", "s/in/out/"], "input");
 * @param {String}       command     - Name of the command to execute.
 * @param {String[]}     argList     - Arguments/switches passed to command.
 * @param {String}      [input=null] - Data to pipe to standard input, if any.
 * @param {ExecOptions} [options={}] - Additional options. See {@link ExecOptions}.
 * @return {Promise<ExecResult>}
 */
export async function exec(command, argList = [], input = null, options = {}){
	const defaultEncoding = "utf8";
	if("string" === typeof options)
		options = {encoding: options};
	let {encoding = defaultEncoding, outputPath = ""} = options;
	const proc = (await import("child_process")).spawn(command, argList, {
		env: {...process.env, ...options.env},
		cwd: options.cwd,
		windowsHide: true,
		stdio: outputPath
			? ["pipe", (await import("fs")).openSync(outputPath, "w"), "pipe"]
			:  "pipe",
	});
	let stdout = "";
	let stderr = "";
	if("string" === typeof encoding)
		encoding = new Array(3).fill(encoding);
	if(null !== input){
		proc.stdin.write(input, encoding[0] || defaultEncoding);
		proc.stdin.end();
	}
	if(!outputPath){
		proc.stdout.setEncoding(encoding[1] || defaultEncoding);
		proc.stdout.on("data", data => stdout += data);
	}
	proc.stderr.setEncoding(encoding[2] || defaultEncoding);
	proc.stderr.on("data", data => stderr += data);
	return new Promise((resolve, reject) => {
		proc.on("close", code => resolve({code, stdout, stderr}));
		proc.on("error", error => reject(error));
	});
}

/**
 * @typedef {Object|String} ExecOptions
 * @description
 *    Extra options used by {@link exec}. Strings are considered shorthand for `{encoding: "…"}`.
 *
 * @property {String} [cwd]
 *    Current working directory of executed command.
 *
 * @property {String[]|String} [encoding="utf8"]
 *    Character encodings of stdin, stdout and stderr, respectively. Strings are
 *    treated as shorthand for setting the encodings of all three streams at once.
 *
 * @property {Object} [env={}]
 *    Environment variables to include on top of the contents of {@link process.env}.
 *    Matching keys are overwritten; the existing environment is unaffected.
 *
 * @property {String} [outputPath=""]
 *    Path to direct stdout to. Empty values mean standard output will be
 *    captured and returned as the resolved object's `stdout` property.
 */

/**
 * @typedef {Object} ExecResult
 * @description Object returned from a finished {@link exec} call.
 * @property {Number} [code=0] - Exit status
 * @property {String} [stdout=""] - Standard output
 * @property {String} [stderr=""] - Standard error
 */


/**
 * Execute a pipeline of chained {@link exec} calls.
 *
 * @uses {@link exec}
 * @example execChain([["ps", "ax"], ["grep", "ssh"]], stdin);
 * @param {CommandList}  commands    - List of command/argv pairs.
 * @param {String}      [input=null] - Data piped to first command's standard input.
 * @param {ExecOptions} [options={}] - Options passed to {@link exec}.
 *
 * @return {Promise<ExecResult>}
 *    Resolves with the standard output and exit code of the last command.
 *    Standard error is concatenated from each command's stderr stream.
 */
export async function execChain(commands, input = null, options = {}){
	/** @typedef {Array.<(String|String[])>} CommandList */
	commands = commands.slice();
	let result = {};
	let stderr = "";
	while(commands.length){
		let command = commands.shift();
		if("string" === typeof command)
			command = [command];
		const [cmd, ...argv] = command;
		const opts = {...options};
		if(commands.length) opts.outputPath = "";
		result = await exec(cmd, argv, input, opts);
		stderr += result.stderr;
		input = result.stdout;
	}
	result.stderr = stderr;
	return result;
}


/**
 * Execute a string as an unescaped shell command.
 *
 * @public
 * @example <caption>Shell-like invocation with tagged templates</caption>
 *    import {execString as $} from "./utils.js";
 *    const checksums = await $ `git log --oneline | cut -d' ' -f1`;
 *    const forty     = await $ `printf %s "${checksums}" | wc -l`;
 *
 * @param {String} input
 *    Source of the command(s) to execute.
 *
 * @return {Promise<String>}
 *    Resolves with the command's standard output.
 */
export async function execString(input, ...values){
	input = Array.isArray(input) && Array.isArray(input.raw)
		? input.raw.map((string, index) => string + (values[index] || "")).join("")
		: [input, ...values].join(" ");
	const {exec} = await import("child_process");
	return new Promise((resolve, reject) => {
		exec(input, (error, stdout, stderr) => error
			? reject(Object.assign(error, {stdout, stderr}))
			: resolve(stdout));
	});
}


/**
 * List the contents of one or more directories.
 *
 * @param {String[]} [paths=["."]]
 * @param {Object} [options={}]
 * @param {RegExp|Function} [options.filter]
 * @param {RegExp|Function} [options.ignore]
 * @param {Number} [options.recurse=0]
 * @param {Boolean} [options.followSymlinks=false]
 * @return {Promise<Map<String, fs.Stats>>}
 */
export async function ls(paths = ["."], {filter, ignore, recurse = 0, followSymlinks} = {}){
	const {lstat, readdir, realpath} = (await import("fs")).promises;
	const {join, resolve} = await import("path");
	paths = [...new Set(("string" === typeof paths ? [paths] : paths).map(path => resolve(path)))];
	[filter, ignore] = [filter, ignore].map(f => f instanceof RegExp ? x => f.test(x) : f);
	recurse = !Number.isNaN(recurse) && !isFinite(recurse) ? -1 : recurse >> 0;
	
	const results = new Map();
	const history = new Set();
	const ls = async (path, depth = 0) => {
		if(history.has(path)) return;
		history.add(path);
		if(recurse >= 0 && depth > recurse) return;
		let stats = await lstat(path);
		if(ignore && !paths.includes(path) && ignore(path, stats)) return;
		results.set(path, stats);
		if(followSymlinks && stats.isSymbolicLink()) try{
			path = await realpath(path);
			const targetStats = await lstat(path);
			if(targetStats.isDirectory())
				stats = targetStats;
		} catch(e){}
		if(stats.isDirectory()) try{
			const files = await readdir(path);
			return Promise.all(files.map(file => ls(join(path, file), depth + 1)));
		} catch(error){
			if(depth < 0) throw error;
		}
	};
	if(paths.length){
		await Promise.all(paths.map(path => ls(path, -1)));
		paths.forEach(path => results.get(path).isDirectory() && results.delete(path));
		filter && [...results].filter(x => !filter(...x)).forEach(([path]) => results.delete(path));
	}
	return results;
}


/**
 * Asynchronously read the entirety of standard input.
 *
 * @param {String} [encoding="utf8"]
 * @return {Promise<String>}
 */
export function readStdin(encoding = "utf8"){
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
 * Recursively delete a list of files or directories.
 *
 * @example rmrf("/tmp/junk", ".DS_Store");
 * @param {String|String[]} paths
 *    Pathnames of entities to be deleted. Symbolic links are not followed.
 *
 * @param {Boolean} [ignoreErrors=false]
 *    Suppress all output, breaking only on exceptions raised from the main process.
 *    The default behaviour is to throw an {@link Error} for any command that exits
 *    with an error code.
 *
 * @return {Promise<void>}
 * @public
 */
export async function rmrf(paths = [], ignoreErrors = false){
	paths = ("string" === typeof paths ? [paths] : paths).filter(Boolean);
	if(!paths.length) return;
	const opts = {
		stdio: ignoreErrors ? "ignore" : ["ignore", 1, 2],
		windowsVerbatimArguments: true,
		windowsHide: true,
	};
	const {spawn} = await import("child_process");
	const exec = async (cmd, ...argv) => new Promise((resolve, reject) => {
		const subproc = spawn(cmd, argv.concat(paths), opts);
		subproc.on("error", error => reject(error));
		subproc.on("close", code => !ignoreErrors && code
			? reject(new Error(`${cmd} ${argv.join(" ")} exited with ${code}`))
			: resolve());
	});
	
	// Windows: `DEL` is an internal command, so we need to execute via CMD.EXE
	if("win32" === process.platform){
		const cmd = str => exec("CMD.EXE", "/D", "/S", "/C", str);
		opts.shell = true;
		
		// Escape and join arguments
		paths = paths.map(path => path
			.replace(/^\s*"(.*)"?\s*$/, "$1") // Remove surrounding quotes
			.trim().replace(/[\r\n]/g, "")    // Trim whitespace, collapse newlines
			.replace(/"/g, '""')              // Escape embedded quotes
			.replace(/\s+/g, '"$&"')          // Quote embedded whitespace
			.replace(/\//g, "\\")             // Flip slashes to become backslashes
			.replace(/[^\s"]/g, "^$&")        // Escape every escapable character
			.replace(/\^/g, "^^")             // Finally, double-escape each escape
		).filter(Boolean).join(" ");
		
		if(!paths) return;
		await cmd("DEL 2>NUL >NUL /S /F /Q");
		ignoreErrors = opts.stdio = "ignore";
		await cmd("RD 2>NUL /S /Q");
		await cmd("RD 2>NUL /S /Q");
	}
	
	// POSIX
	else{
		paths.unshift("--");
		return exec("rm", "-rf", "--");
	}
}


/**
 * Replace any occurrences of `$HOME` with a tilde.
 *
 * @example tildify("/Users/johngardner/Labs/Utils") == "~/Labs/Utils"
 * @param {String} input
 * @return {String}
 */
export function tildify(input){
	if("win32" === process.platform)
		return input;
	const home = process.env.HOME;
	return (input === home || 0 === input.indexOf(home + "/"))
		? input.substr(home.length).replace(/^\/?/, "~/")
		: input;
}


/**
 * Locate a program file in the user's $PATH.
 *
 * Resolves with an empty string/array if nothing was found.
 *
 * @example which("curl") == "/usr/bin/curl"
 * @example which("nada") == ""
 * @param {String} name
 * @param {Boolean} [all=false]
 * @return {Promise<(String|String[])>}
 */
export async function which(name, all = false){
	if(!name) return all ? [] : "";
	const {existsSync, statSync} = await import("fs");
	const {delimiter, sep}       = await import("path");
	const {env} = process;
	const exts = ("\\" === sep ? env.PATHEXT || ".COM;.EXE;.BAT" : "")
		.replace(/.+/, $ => $.toLowerCase() + delimiter + $)
		.split(delimiter);
	const results = [];
	const fileIDs = new Set();
	for(const dir of (env.PATH || env.Path || "").split(new RegExp(`\\${sep}?${delimiter}`)))
		for(const ext of exts){
			const fullPath = dir + sep + name + ext;
			const stats = existsSync(fullPath) && statSync(fullPath); let uid;
			if(stats && stats.isFile() && !fileIDs.has(uid = `${stats.dev}:${stats.ino}`)){
				fileIDs.add(uid);
				results.push(fullPath);
				if(!all) return results[0];
			}
		}
	return all ? results : "";
}
