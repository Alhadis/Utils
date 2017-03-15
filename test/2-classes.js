"use strict";

describe("Utility classes", () => {
	const utils = require("../index.js");
	
	describe("PatternMap", () => {
		const {PatternMap} = utils;
		
		describe("Construction", () => {
			it("can be constructed with an iterable", () => {
				const iterable = [
					[/A/, 1],
					[/B/, 2],
					[/C/, 3]
				];
				const map = new PatternMap(iterable);
				expect(map.size).to.equal(3);
				expect(map.get(iterable[0][0])).to.equal(1);
				expect(map.get(iterable[1][0])).to.equal(2);
				expect(map.get(iterable[2][0])).to.equal(3);
			});
			
			it("can be constructed without an iterable", () => {
				expect(new PatternMap().size).to.equal(0);
				expect(new PatternMap([]).size).to.equal(0);
			});
		});
		
		describe("Identicality", () => {
			it("uses existing keys when matching expressions exist", () => {
				const obj1 = {};
				const obj2 = {};
				const obj3 = {};
				const obj4 = {};
				const map = new PatternMap([
					[/A/, obj1],
					[/B/, obj2],
					[/C/, obj3],
					[/E/, null]
				]);
				expect(map.size).to.equal(4);
				expect(map.has(/A/)).to.be.true;
				expect(map.has(/B/)).to.be.true;
				expect(map.has(/C/)).to.be.true;
				expect(map.has(/D/)).to.be.false;
				expect(map.get(/A/)).to.equal(obj1);
				expect(map.get(/B/)).to.equal(obj2);
				expect(map.get(/C/)).to.equal(obj3);
				expect(map.get(/D/)).to.be.undefined;
				expect(map.get(/E/)).to.be.null;
				map.set(/A/, obj4);
				map.set(/B/, obj3);
				map.set(/C/, obj1);
				map.set(/D/, obj2);
				map.set(/E/, obj1);
				expect(map.size).to.equal(5);
				expect(map.get(/A/)).to.equal(obj4);
				expect(map.get(/B/)).to.equal(obj3);
				expect(map.get(/C/)).to.equal(obj1);
				expect(map.get(/D/)).to.equal(obj2);
				expect(map.get(/E/)).to.equal(obj1);
				expect(map.delete(/D/)).to.be.true;
				expect(map.delete(/B/)).to.be.true;
				expect(map.delete(/D/)).to.be.false;
				expect(map.size).to.equal(3);
				expect(map.get(/D/)).to.be.undefined;
			});
			
			it("acknowledges flags when distinguishing expressions", () => {
				const map = new PatternMap([
					[/A/, 1],
					[/A/, "foo"]
				]);
				expect(map.size).to.equal(1);
				expect(map.get(/A/)).to.equal("foo");
				map.set(/A/, "bar");
				expect(map.get(/A/)).to.equal("bar");
				expect(map.has(/A/i)).not.to.be.true;
				map.set(/A/i, "baz");
				expect(map.has(/A/i)).to.be.true;
				expect(map.has(/A/g)).not.to.be.true;
				expect(map.size).to.equal(2);
				expect(map.get(/A/)).to.equal("bar");
				expect(map.get(/A/i)).to.equal("baz");
				map.set(/A/i, 90);
				expect(map.get(/A/i)).to.equal(90);
				map.delete(/A/i);
				expect(map.get(/A/)).to.exist.and.to.equal("bar");
				expect(map.get(/A/i)).to.be.undefined;
				expect(map.size).to.equal(1);
				map.delete(/A/);
				expect(map.size).to.equal(0);
				expect(map.get(/A/)).to.be.undefined;
			});
			
			it("stringifies keys before comparison", () => {
				const map = new PatternMap([[/A/, 1]]);
				expect(map.get("/A/")).to.equal(1);
				expect(map.get(/A/)).to.equal(1);
				expect(map.size).to.equal(1);
			});
			
			it("references only the first RegExp object for a key", () => {
				const re1 = /A/;
				const re2 = /A/;
				const map = new PatternMap([[re1, 1]]);
				map.set(re2, 2);
				expect(map.size).to.equal(1);
				expect(map.get(/A/)).to.equal(2);
				for(const [key] of map){
					expect(key).to.equal(re1);
					expect(key).not.to.equal(re2);
				}
				map.clear();
				expect(map.size).to.equal(0);
				expect(map.get(/A/)).to.be.undefined;
			});
		});
		
		describe("Validation", () => {
			const error = "PatternMap keys must be regular expressions";
			const empty = undefined;
			const obj   = {match: text => [text]};
			const re    = new RegExp("^A$", "i");
				
			it("throws an error if initialised with non-RegExp keys", () => {
				expect(_=> new PatternMap([ [empty, 1] ])).not.to.throw(error);
				expect(_=> new PatternMap([ [re,    1] ])).not.to.throw(error);
				expect(_=> new PatternMap([ [false, 1] ])).to.throw(error);
				expect(_=> new PatternMap([ [true,  1] ])).to.throw(error);
				expect(_=> new PatternMap([ [obj,   1] ])).to.throw(error);
				expect(_=> new PatternMap([ [200,   1] ])).to.throw(error);
			});
			
			it("throws an error when assigning non-RegExp keys", () => {
				const map = new PatternMap();
				expect(_=> map.set(false, 1)).to.throw(error);
				expect(_=> map.set(true,  1)).to.throw(error);
				expect(_=> map.set(re,    1)).not.to.throw(error);
				expect(_=> map.set(/A/,   1)).not.to.throw(error);
				expect(_=> map.set(200,   1)).to.throw(error);
			});
			
			it("returns undefined if reading an invalid key", () => {
				const map = new PatternMap([[/A/, 1]]);
				expect(map.get("foo")).to.be.undefined;
			});
		});
		
		describe("Iteration", () => {
			const entries = Object.freeze([
				[/A/, 1],
				[/[BCD]/g, {foo: "bar"}],
				[/(?:\d+\.)?\d+|(?:\d+\.?)(?!\d[.])/, Number]
			]);
			
			it("uses RegExp keys when converted to an Array", () => {
				const map = new PatternMap(entries);
				expect(map.size).to.equal(3);
				expect(Array.from(map)).to.eql(entries);
			});
			
			it("uses RegExp keys in for..of loops", () => {
				const map = new PatternMap(entries);
				let count = 0;
				for(const [key, value] of map){
					expect(key).to.be.instanceof(RegExp);
					expect(map.get(key)).to.equal(value);
					++count;
				}
				expect(map.size).to.equal(3);
				expect(count).to.equal(3);
				for(const entry of map){
					expect(entry[0]).to.be.instanceof(RegExp);
					expect(map.get(entry[0])).to.equal(entry[1]);
					++count;
				}
				expect(count).to.equal(6);
			});
			
			it("uses RegExp keys in iterables returned from Map methods", () => {
				const map = new PatternMap(entries);
				const keys = map.keys();
				const ents = map.entries();
				let iterations = 0;
				for(const key of keys){
					expect(key).to.be.instanceof(RegExp);
					++iterations;
				}
				expect(iterations).to.equal(3);
				iterations = 0;
				const values = Array.from(map.values());
				for(const entry of ents){
					expect(entry[0]).to.be.instanceof(RegExp);
					expect(map.get(entry[0])).to.equal(entry[1]);
					expect(values[iterations]).to.equal(entry[1]);
					++iterations;
				}
				expect(iterations).to.equal(3);
			});
		});
		
		describe("String matching", () => {
			it("returns the matched key and its results by default", () => {
				const key = /^A:(XYZ)$|^A(:)(\d{3})$/;
				const map = new PatternMap([ [key, true] ]);
				
				let input = "A:XYZ";
				let match = [key, [input, "XYZ", undefined, undefined]];
				match[1].index = 0;
				match[1].input = input;
				expect(testPatternKeys(map, input)).to.eql(match);
				expect(testPatternKeys(map, "a:xyz")).to.be.null;
				
				input = "A:123";
				match[1] = [input, undefined, ":", "123"];
				match[1].index = 0;
				match[1].input = input;
				expect(testPatternKeys(map, input)).to.eql(match);
				expect(testPatternKeys(map, "-XYZ-")).to.be.null;
			});
			
			it("returns every matching key/result if second argument is set", () => {
				const map = new PatternMap([
					[/A|B|C/, 1],
					[/1|2|3/, 2],
					[/xYz$/i, 3]
				]);
				expect(testPatternKeys(map, "Nah", true)).to.eql([]);
				const input = "ABCDEFGHIJKL... 2, 1, 3, xYz MNOPQRSTUxYZ";
				const match = testPatternKeys(map, input, true);
				expect(match).to.eql([
					[/A|B|C/, Object.assign(["A"],   {index:  0, input})],
					[/1|2|3/, Object.assign(["2"],   {index: 16, input})],
					[/xYz$/i, Object.assign(["xYZ"], {index: 38, input})]
				]);
			});
		});
	});

	describe("PatternSet", () => {
		const {PatternSet} = utils;
		
		describe("Construction", () => {
			it("can be constructed with an iterable", () => {
				const iterable = [/A/, /B/, /C/];
				const set = new PatternSet(iterable);
				expect(set.size).to.equal(3);
				expect(set.has(iterable[0])).to.be.true;
				expect(set.has(iterable[1])).to.be.true;
				expect(set.has(iterable[2])).to.be.true;
			});
			
			it("can be constructed without an iterable", () => {
				expect(new PatternSet().size).to.equal(0);
				expect(new PatternSet([]).size).to.equal(0);
			});
		});
		
		describe("Identicality", () => {
			it("doesn't add duplicate expressions", () => {
				const set = new PatternSet([/A/, /B/, /C/]);
				expect(set.size).to.equal(3);
				expect(set.add(/A/).size).to.equal(3);
				expect(set.add(/D/).size).to.equal(4);
				expect(set.has(/D/)).to.be.true;
				expect(set.has(/A/)).to.be.true;
				expect(set.has(/E/)).to.be.false;
			});
			
			it("deletes matching expressions", () => {
				const set = new PatternSet([/A/, /B/, /C/]);
				expect(set.size).to.equal(3);
				expect(set.delete(/B/)).to.be.true;
				expect(set.size).to.equal(2);
				expect(set.delete(/D/)).to.be.false;
				expect(set.delete(/B/)).to.be.false;
				expect(set.has(/B/)).to.be.false;
				expect(set.size).to.equal(2);
				expect(set.delete(/A/)).to.be.true;
				expect(set.has(/A/)).to.be.false;
				expect(set.size).to.equal(1);
			});
			
			it("acknowledges flags when distinguishing expressions", () => {
				const set = new PatternSet([ /A/, /B/i ]);
				expect(set.add(/A/).size).to.equal(2);
				expect(set.has(/A/i)).to.be.false;
				expect(set.add(/A/i).size).to.equal(3);
				expect(set.has(/A/g)).to.be.false;
				expect(set.has(/B/)).to.be.false;
				expect(set.delete(/B/)).to.be.false;
				expect(set.delete(/B/i)).to.be.true;
				expect(set.size).to.equal(2);
			});
			
			it("stringifies values before comparison", () => {
				const set = new PatternSet([ /A/ ]);
				expect(set.has("/A/")).to.be.true;
				expect(set.has(/A/)).to.be.true;
				expect(set.size).to.equal(1);
				expect(set.delete("/A/")).to.be.true;
				expect(set.delete(/A/)).to.be.false;
				expect(set.size).to.equal(0);
			});
			
			it("references only the first RegExp for a pattern", () => {
				const re1 = /A/;
				const re2 = /A/;
				const set = new PatternSet();
				expect(set.add(re1).size).to.equal(1);
				expect(set.add(re2).size).to.equal(1);
				expect([...set.keys()][0]).to.equal(re1);
				for(const value of set){
					expect(value).to.equal(re1);
					expect(value).not.to.equal(re2);
				}
				set.clear();
				expect(set.size).to.equal(0);
				expect(set.has(/A/)).to.be.false;
				expect(set.has(re1)).to.be.false;
			});
		});
		
		describe("Validation", () => {
			const error = "Values added to a PatternSet must be regular expressions";
			const empty = undefined;
			const obj   = {match: text => [text]};
			const re    = new RegExp("^A$", "i");
				
			it("throws an error if initialised with non-RegExp values", () => {
				expect(_=> new PatternSet([ empty ])).not.to.throw(error);
				expect(_=> new PatternSet([ re    ])).not.to.throw(error);
				expect(_=> new PatternSet([ false ])).to.throw(error);
				expect(_=> new PatternSet([ true  ])).to.throw(error);
				expect(_=> new PatternSet([ obj   ])).to.throw(error);
				expect(_=> new PatternSet([ 200   ])).to.throw(error);
			});
			
			it("throws an error when adding non-RegExp values", () => {
				const set = new PatternSet();
				expect(_=> set.add( false )).to.throw(error);
				expect(_=> set.add( true  )).to.throw(error);
				expect(_=> set.add( re    )).not.to.throw(error);
				expect(_=> set.add( /A/   )).not.to.throw(error);
				expect(_=> set.add( 200   )).to.throw(error);
			});
			
			it("returns false if testing for the existence of an invalid key", () => {
				const set = new PatternSet([/A/, /B/]);
				expect(set.has("foo")).to.be.false;
			});
		});
		
		describe("Iteration", () => {
			const patterns = Object.freeze([/A/, /B/, /C/, /D/]);
			
			it("returns patterns as RegExp objects when cast to an Array", () => {
				const set = new PatternSet(patterns);
				const array = Array.from(set);
				expect(set.size).to.equal(4);
				expect(array).to.have.lengthOf(4).and.to.eql(patterns);
			});
			
			it("uses RegExp values when iterating through for..of loops", () => {
				const set = new PatternSet(patterns);
				for(const value of set)
					expect(value).to.be.instanceOf(RegExp);
			});
			
			it("uses RegExp values when iterating with Set methods", () => {
				const set = new PatternSet(patterns);
				expect(Array.from(set.values())).to.eql(patterns);
				expect(Array.from(set.keys())).to.eql(patterns);
				let index = 0;
				for(const entry of set.entries()){
					expect(entry[0]).to.be.instanceOf(RegExp);
					expect(entry[1]).to.be.instanceOf(RegExp);
					expect(entry[0]).to.equal(entry[1]);
					++index;
				}
				expect(index).to.equal(4);
			});
		});
		
		describe("String matching", () => {
			const patterns = Object.freeze([/(A|B|C)/, /1|2|3/, /xYz$/i]);
			
			it("returns the matched value and its results by default", () => {
				const set = new PatternSet(patterns);
				let input = "AOK";
				let index = 0;
				expect(set.size).to.equal(3);
				expect(testPatternKeys(set, "Nah")).to.be.null;
				expect(testPatternKeys(set, input)).to.eql([
					patterns[0],
					Object.assign(["A", "A"], {index, input})
				]);
			});
			
			it("returns every matched value/result pair if second argument is set", () => {
				const set = new PatternSet(patterns);
				expect(testPatternKeys(set, "Nah", true)).to.eql([]);
				const input = "ABCDEFGHIJKL... 2, 1, 3, xYz MNOPQRSTUxYZ";
				const match = testPatternKeys(set, input, true);
				expect(match).to.eql([
					[/(A|B|C)/, Object.assign(["A", "A"], {index:  0, input})],
					[/1|2|3/,   Object.assign(["2"],      {index: 16, input})],
					[/xYz$/i,   Object.assign(["xYZ"],    {index: 38, input})]
				]);
			});
		});
	});

	describe("Atom-specific", () => {
		describe("MappedDisposable", () => {
			const MappedDisposable = require("../lib/classes/mapped-disposable.js");
			const {CompositeDisposable, Disposable} = require("atom");
			
			it("can be constructed with an iterable", () => {
				const disposable1 = new Disposable();
				const disposable2 = new Disposable();
				const disposable3 = new CompositeDisposable();
				const map = new MappedDisposable([
					[{name: "foo"}, disposable1],
					[{name: "bar"}, disposable2],
					[{name: "baz"}, disposable3]
				]);
				map.dispose();
				expect(disposable1.disposed).to.be.true;
				expect(disposable2.disposed).to.be.true;
				expect(disposable3.disposed).to.be.true;
			});
			
			it("can be constructed without an iterable", () => {
				const map = new MappedDisposable();
				expect(map.disposed).to.be.false;
				map.dispose();
				expect(map.disposed).to.be.true;
			});
			
			it("embeds ordinary disposables in CompositeDisposables", () => {
				const disposable1 = new Disposable();
				const disposable2 = new CompositeDisposable();
				const map = new MappedDisposable([
					["foo", disposable1],
					["bar", disposable2]
				]);
				expect(map.get("foo")).to.be.instanceof(CompositeDisposable);
				expect(map.get("bar")).to.equal(disposable2);
			});
			
			it("allows disposables to be added to keys", () => {
				const key = {};
				const cd1 = new CompositeDisposable();
				const cd2 = new CompositeDisposable();
				const cd3 = new CompositeDisposable();
				const map = new MappedDisposable([ [key, cd1] ]);
				expect(map.get(key)).to.equal(cd1);
				map.add(key, cd2);
				expect(cd1.disposables.size).to.equal(1);
				map.add("foo", cd3);
				expect(map.size).to.equal(2);
				map.dispose();
				expect(map.disposed).to.be.true;
				expect(cd1.disposed).to.be.true;
				expect(cd2.disposed).to.be.true;
			});
			
			it("allows disposables to be used as keys", () => {
				let calledIt          = false;
				let toldYou           = false;
				const disposableKey   = new Disposable(() => calledIt = true);
				const disposableValue = new Disposable(() => toldYou  = true);
				const map = new MappedDisposable([ [disposableKey, disposableValue] ]);
				
				expect(map.size).to.equal(1);
				expect(calledIt).to.be.false;
				expect(toldYou).to.be.false;
				expect(disposableKey.disposed).to.be.false;
				expect(disposableValue.disposed).to.be.false;
				
				map.dispose();
				expect(map.size).to.equal(0);
				expect(disposableKey.disposed).to.be.true;
				expect(disposableValue.disposed).to.be.true;
				expect(calledIt).to.be.true;
				expect(toldYou).to.be.true;
			});
			
			it("calls a key's dispose() method when disposing it", () => {
				let foo = false;
				let bar = false;
				const fooDis = new Disposable(() => foo = true);
				const barDat = new Disposable(() => bar = true);
				const map = new MappedDisposable();
				map.set("foo", fooDis);
				map.set("bar", barDat);
				
				expect(map.size).to.equal(2);
				expect(foo).to.be.false;
				expect(bar).to.be.false;
				expect(fooDis.disposed).to.be.false;
				expect(barDat.disposed).to.be.false;
				
				map.dispose("foo");
				expect(map.size).to.equal(1);
				expect(foo).to.be.true;
				expect(bar).to.be.false;
				expect(fooDis.disposed).to.be.true;
				expect(barDat.disposed).to.be.false;
				expect(map.has("foo")).to.be.false;
			});
			
			it("allows disposables to be removed from keys", () => {
				const key = {};
				const cd1 = new CompositeDisposable();
				const cd2 = new CompositeDisposable();
				const cd3 = new CompositeDisposable();
				const cd4 = new CompositeDisposable();
				const cd5 = new CompositeDisposable();
				const map = new MappedDisposable([ [key, cd1] ]);
				map.add(key, cd2, cd3, cd4, cd5);
				expect(cd1.disposables.size).to.equal(4);
				map.remove(key, cd3, cd5);
				expect(cd1.disposables.size).to.equal(2);
				map.dispose();
				expect(map.disposed).to.be.true;
				expect(cd1.disposed).to.be.true;
				expect(cd2.disposed).to.be.true;
				expect(cd3.disposed).to.be.false;
				expect(cd4.disposed).to.be.true;
				expect(cd5.disposed).to.be.false;
			});
			
			it("allows other MappedDisposables to be added to keys", () => {
				const disposable = new Disposable();
				const map1 = new MappedDisposable([ ["foo", disposable] ]);
				const map2 = new MappedDisposable([ ["bar", map1] ]);
				expect(map1.get("foo").disposables.has(disposable)).to.be.true;
				expect(map2.get("bar").disposables.has(map1)).to.be.true;
				map2.dispose();
				expect(disposable.disposed).to.be.true;
				expect(map1.disposed).to.be.true;
				expect(map2.disposed).to.be.true;
			});
			
			it("reports accurate entry count", () => {
				const map = new MappedDisposable();
				expect(map.size).to.equal(0);
				map.add("foo", new Disposable());
				expect(map.size).to.equal(1);
				map.add("foo", new Disposable());
				map.add("bar", new Disposable());
				expect(map.size).to.equal(2);
				map.delete("foo");
				expect(map.size).to.equal(1);
				map.dispose();
				expect(map.size).to.equal(0);
			});
			
			it("deletes keys when disposing them", () => {
				const key = {};
				const cd1 = new CompositeDisposable();
				const map = new MappedDisposable([ [key, cd1] ]);
				map.delete(key);
				expect(map.has(key)).to.be.false;
				expect(map.get(key)).to.be.undefined;
				map.dispose();
				expect(cd1.disposed).to.be.false;
			});
			
			it("deletes all keys when disposed", () => {
				const map = new MappedDisposable([
					["foo", new Disposable()],
					["bar", new Disposable()]
				]);
				expect(map.has("foo")).to.be.true;
				expect(map.has("bar")).to.be.true;
				map.dispose();
				expect(map.has("foo")).to.be.false;
				expect(map.has("bar")).to.be.false;
				expect(map.size).to.equal(0);
			});
			
			it("allows a disposable list to be replaced with another", () => {
				const cd1 = new CompositeDisposable();
				const cd2 = new CompositeDisposable();
				const key = {};
				const map = new MappedDisposable([[key, cd1]]);
				map.set(key, cd2);
				expect(map.get(key)).to.equal(cd2);
				expect(map.get(key).disposables.has(cd1)).to.be.false;
				map.dispose();
				expect(cd1.disposed).to.be.false;
				expect(cd2.disposed).to.be.true;
			});
			
			it("throws an error when setting a value to a non-disposable", () => {
				expect(() => {
					const key = {};
					const map = new MappedDisposable([ [key, new Disposable()] ]);
					map.set(key, {});
				}).to.throw("Value must have a .dispose() method");
			});
		});
	});
});


/**
 * Match a string against a pattern-list's keys.
 *
 * @private Used only for {@link PatternMap} and {@link PatternSet} specs.
 * @param {PatternMap|PatternSet} list - Pattern-list instance being tested.
 * @param {String} input
 * @param {Boolean} [matchAll=false]
 * @return {Array|null}
 */
function testPatternKeys(list, input, matchAll = false){
	if(!input) return null;
	input = input.toString();
	const patterns = [...list.keys()];
	if(matchAll){
		const matches = [];
		for(const pattern of patterns){
			const match = input.match(pattern);
			null !== match && matches.push([pattern, match]);
		}
		return matches;
	}
	else{
		for(const pattern of patterns){
			const match = input.match(pattern);
			if(null !== match) return [pattern, match];
		}
		return null;
	}
}
