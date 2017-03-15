"use strict";

/**
 * Asynchronously read the entirety of standard input.
 *
 * Node-only.
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
 * Asynchronously load a resource.
 *
 * Node-only.
 *
 * @param {String} url - URL or filesystem path
 * @param {String} encoding - Defaults to "utf8"
 * @return {Promise}
 * @public
 */
function load(url, encoding = "utf8"){
	return new Promise((resolve, reject) => {
		const protocol = url.match(/^https?/);
		
		/** Remote resource: HTTPS or HTTP */
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
		
		/** Assume parameter to be a filesystem path */
		else{
			const fs = require("fs");
			fs.readFile(url, {encoding}, (error, data) => {
				if(error) return reject(error);
				return resolve(data.toString());
			});
		}
	});
}
