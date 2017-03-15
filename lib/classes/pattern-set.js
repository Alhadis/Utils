"use strict";

const {execPatternList, isRegExp} = require("../regex.js");
const instancePatterns = new WeakMap();


/**
 * RegExp-aware version of an [ES6 Set]{@link https://mdn.io/Set}.
 *
 * Regular expressions are treated as primitives, not objects: two
 * fundamentally identical expressions will always be keyed to the
 * same value.
 *
 * @class
 */
class PatternSet extends Set {

	/**
	 * Instantiate a new PatternSet, optionally with initial patterns.
	 *
	 * @param {*} [iterable] - An iterable of patterns to add
	 * @constructor
	 */
	constructor(iterable = null){
		super();
		instancePatterns.set(this, new Map());
		
		if(null === iterable)
			return;
		
		for(const entry of iterable)
			if(null != entry)
				this.add(entry);
	}
	
	
	/**
	 * Add a new pattern to the PatternSet.
	 *
	 * @param {RegExp} pattern
	 * @throws {TypeError} Values must be {@link RegExp} objects.
	 * @return {PatternSet} The calling instance
	 */
	add(pattern){
		if(!pattern || !isRegExp(pattern))
			throw new TypeError("Values added to a PatternSet must be regular expressions");
		
		const patterns = instancePatterns.get(this);
		const string   = pattern.toString();
		if(!patterns.has(string)){
			patterns.set(string, pattern);
			return super.add(pattern);
		}
		return this;
	}
	
	
	/**
	 * Remove a pattern from the PatternSet.
	 *
	 * @param {RegExp} pattern
	 * @return {Boolean} Whether the specified pattern was found and deleted.
	 */
	delete(pattern){
		const patterns = instancePatterns.get(this);
		const string = pattern.toString();
		const regexp = patterns.get(string);
		if(regexp){
			patterns.delete(string);
			return super.delete(regexp);
		}
		return false;
	}
	
	
	/**
	 * Empty the contents of the PatternSet.
	 */
	clear(){
		const patterns = instancePatterns.get(this);
		patterns.clear();
		super.clear();
	}
	
	
	/**
	 * Check if a pattern exists in the PatternSet.
	 *
	 * @param {String|RegExp} pattern
	 * @return {Boolean}
	 */
	has(pattern){
		const patterns = instancePatterns.get(this);
		const string = pattern.toString();
		return patterns.has(string);
	}
	
	
	/**
	 * Return the PatternSet's default textual description.
	 *
	 * @return {String}
	 */
	get [Symbol.toStringTag](){
		return "PatternSet";
	}
	
	
	/**
	 * Match a string against each pattern held in the PatternSet.
	 *
	 * @param {String} input
	 * @param {Boolean} matchAll
	 * @return {Array}
	 * @see {@link matchPatternList}
	 */
	match(input, matchAll = false){
		return execPatternList(input, matchAll, ...this.keys());
	}
}
