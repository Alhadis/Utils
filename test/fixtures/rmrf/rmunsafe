#!/usr/bin/env node
/**
 * @fileoverview Test handling of filenames with unsafe characters.
 * @see mkunsafe
 */
import assert      from "assert";
import {lstatSync} from "fs";
import {rmrf}      from "../../../index.mjs";

// Fail early if something's wrong with the environment
const message = 'Expected environment variable `foo` to equal "bar"';
assert.strictEqual(process.env.foo, "bar", message);

(async () => {
	process.chdir("junk");
	assert(lstatSync("$foo").isFile());
	assert(lstatSync("bar").isFile());
	await rmrf("$foo");
})().catch(error => {
	console.error(error);
	process.exit(1);
});
