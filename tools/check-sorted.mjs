#!/usr/bin/env node

import {readFileSync, writeFileSync} from "fs";
import {exec, sha1, sortn} from "../index.mjs";
import {join} from "path";
import {tmpdir} from "os";

const tmpFile = join(tmpdir(), sha1(process.getuid() + process.cwd()) + "-sorted.txt");
export const NAMED_EXPORT = /^\s*export\s+(?:class|const|(?:async\s+)?function(?:\s*\*\s*)?|let|var)(?:(?<=\*)|\s+)(\w+)/gm;

(async () => {
	let diff, errors = 0;
	for(const filePath of process.argv.slice(2)){
		const file = readFileSync(filePath, "utf8");
		
		// Assert correctly-ordered named exports
		const exps = (file.match(NAMED_EXPORT) || []).map(match => match.split(/[\s*]+/).pop());
		if(diff = await getSortDiff(exps)){
			process.stderr.write(`${++errors}) \x1B[4m${filePath}\x1B[24m has unsorted exports:`);
			process.stderr.write(diff.replace(/^/gm, " ".repeat(4)) + "\n\n");
		}
		
		// Assert correctly-ordered tests (second suite-level only)
		const desc = (file.match(/^\tdescribe\("([^"]+)"/gm) || []).map(match => match.replace(/^.+?"|"$/g, ""));
		if(diff = await getSortDiff(desc)){
			errors++ && process.stderr.write("\n");
			process.stderr.write(`${errors}) \x1B[4m${filePath}\x1B[24m has unsorted tests:`);
			process.stderr.write(diff.replace(/^/gm, " ".repeat(4)) + "\n");
		}
	}
	process.exit(+!!errors);
})().catch(error => {
	console.error(error);
	process.exit(1);
});


/**
 * Generate a diff for an array before and after sorting.
 * @param {String[]} input
 * @return {?String}
 * @internal
 */
export async function getSortDiff(input){
	if(!input || !input.length) return null;
	const unsorted = input.join("\n").replace(/\n*$/, "\n");
	const sorted   = input.sort(sortn).join("\n").replace(/\n*$/, "\n");
	if(sorted === unsorted) return null;
	writeFileSync(tmpFile, sorted, "utf8");
	return "\n\n\x1B[32m+ expected \x1B[31m- actual\x1B[0m\n\n"
		+ (await exec("diff", ["-U2", "-", tmpFile], unsorted)).stdout
			.replace(/^(?:---|\+{3}) .*$/gm, "")
			.replace(/^\\ No newline.+$\n?/gm, "")
			.replace(/^@(.+)$/gm,  "\x1B[36m@$1\x1B[0m")
			.replace(/^-(.*)$/gm,  "\x1B[31m-$1\x1B[0m")
			.replace(/^\+(.*)$/gm, "\x1B[32m+$1\x1B[0m")
			.trim();
}
