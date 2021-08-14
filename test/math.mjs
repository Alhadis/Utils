import * as utils from "../index.mjs";

describe("Mathematical functions", () => {
	describe("angleTo()", () => {
		const {angleTo} = utils;
		it("measures zero angles", () => {
			expect(angleTo([0, 0], [0,   0])).to.equal(0);
			expect(angleTo([0, 0], [-25, 0])).to.equal(0);
			expect(angleTo([0, 0], [-50, 0])).to.equal(0);
		});
		it("measures acute angles", () => {
			expect(angleTo([70, 10], [50, 50])).to.be.closeTo(63.435, 0.0005);
			expect(angleTo([70, 70], [40, 50])).to.be.closeTo(-33.69, 0.0005);
			expect(angleTo([80, 30], [10, 50])).to.be.closeTo(15.945, 0.0005);
		});
		it("measures right angles", () => {
			expect(angleTo([0, 0], [0,   50])).to.equal(+90);
			expect(angleTo([0, 0], [0,  100])).to.equal(+90);
			expect(angleTo([0, 0], [0,  -50])).to.equal(-90);
			expect(angleTo([0, 0], [0, -100])).to.equal(-90);
		});
		it("measures obtuse angles", () => {
			expect(angleTo([0,  0],  [60,  90])).to.be.closeTo(123.690, 0.0005);
			expect(angleTo([0,  0],  [100, 20])).to.be.closeTo(168.690, 0.0005);
			expect(angleTo([50, 50], [130, 70])).to.be.closeTo(165.964, 0.0005);
		});
		it("measures straight angles", () => {
			expect(angleTo([0, 0], [50,  0])).to.equal(180);
			expect(angleTo([0, 0], [100, 0])).to.equal(180);
		});
	});
	
	describe("byteCount()", () => {
		const {byteCount} = utils;
		it("counts the number of bytes needed to store 0",   () => expect(byteCount(0)).to.equal(1));
		it("counts the number of bytes needed to store 1",   () => expect(byteCount(1)).to.equal(1));
		it("counts the number of bytes needed to store 255", () => expect(byteCount(255)).to.equal(1));
		it("counts the number of bytes needed to store 256", () => expect(byteCount(256)).to.equal(2));
	});
	
	describe("clamp()", () => {
		const {clamp} = utils;
		it("clamps values to lower thresholds", () => expect(clamp(5, 10, 20)).to.equal(10));
		it("clamps values to upper thresholds", () => expect(clamp(25, 10, 20)).to.equal(20));
		it("returns floats if called with one", () => expect(clamp(1.5, 1, 3)).to.equal(1.5));
		it("uses a default threshold of [0,1]", () => {
			expect(clamp(100, 32)).to.equal(32);
			expect(clamp(-.5)).to.equal(0);
			expect(clamp(0.5)).to.equal(0.5);
			expect(clamp(1.5)).to.equal(1);
		});
	});
	
	describe("convertBase()", () => {
		const {convertBase} = utils;
		describe("Output radix", () => {
			it("converts unary", () => {
				expect(convertBase(3,    1)).to.equal("111");
				expect(convertBase("3",  1)).to.equal("111");
				expect(convertBase(-4,   1)).to.equal("-1111");
				expect(convertBase("-5", 1)).to.equal("-11111");
				expect(convertBase(0,    1)).to.equal("");
			});
			it("converts binary", () => {
				expect(convertBase("35",  2)).to.equal("100011");
				expect(convertBase(35,    2)).to.equal("100011");
				expect(convertBase("+15", 2)).to.equal("1111");
				expect(convertBase("-29", 2)).to.equal("-11101");
				expect(convertBase(-0,    2)).to.equal("-0");
				expect(convertBase(0,     2)).to.equal("0");
			});
			it("converts octal", () => {
				expect(convertBase("31", 8)).to.equal("37");
				expect(convertBase(511,  8)).to.equal("777");
				expect(convertBase(438,  8)).to.equal("666");
				expect(convertBase(-8,   8)).to.equal("-10");
			});
			it("converts hexadecimal", () => {
				expect(convertBase(255,   16)).to.equal("FF");
				expect(convertBase("255", 16)).to.equal("FF");
				expect(convertBase(-127,  16)).to.equal("-7F");
				expect(convertBase(1,     16)).to.equal("1");
			});
			it("converts hexatrigesimal", () => {
				expect(convertBase(17,     36)).to.equal("H");
				expect(convertBase(35,     36)).to.equal("Z");
				expect(convertBase("36",   36)).to.equal("10");
				expect(convertBase(35 * 2, 36)).to.equal("1Y");
				expect(convertBase(-13368, 36)).to.equal("-ABC");
			});
		});
		describe("Input radix", () => {
			it("converts unary", () => {
				expect(convertBase(111,      10, 1)).to.equal("3");
				expect(convertBase("111",    10, 1)).to.equal("3");
				expect(convertBase(-1111,    10, 1)).to.equal("-4");
				expect(convertBase("-11111", 10, 1)).to.equal("-5");
				expect(convertBase(0,        10, 1)).to.equal("0");
			});
			it("converts binary", () => {
				expect(convertBase("100011", 10, 2)).to.equal("35");
				expect(convertBase("+1111",  10, 2)).to.equal("15");
				expect(convertBase(100011,   10, 2)).to.equal("35");
				expect(convertBase("-11101", 10, 2)).to.equal("-29");
			});
			it("converts octal", () => {
				expect(convertBase("37", 10, 8)).to.equal("31");
				expect(convertBase(777,  10, 8)).to.equal("511");
				expect(convertBase(666,  10, 8)).to.equal("438");
				expect(convertBase(-10,  10, 8)).to.equal("-8");
			});
			it("converts hexadecimal", () => {
				expect(convertBase("-FF", 10, 16)).to.equal("-255");
				expect(convertBase("-7f", 10, 16)).to.equal("-127");
				expect(convertBase("+05", 10, 16)).to.equal("5");
				expect(convertBase("1",   10, 16)).to.equal("1");
			});
			it("converts hexatrigesimal", () => {
				expect(convertBase("H",    10, 36)).to.equal("17");
				expect(convertBase("Z",    10, 36)).to.equal("35");
				expect(convertBase(10,     10, 36)).to.equal("36");
				expect(convertBase("1Y",   10, 36)).to.equal("70");
				expect(convertBase("-ABC", 10, 36)).to.equal("-13368");
			});
		});
		describe("Digit set", () => {
			it("returns raw digit values if `null`", () => {
				expect(convertBase(256,  16, 10, null)).to.eql([1, 0, 0]);
				expect(convertBase("FF", 16, 16, null)).to.eql([15, 15]);
				expect(convertBase("7",  2,  10, null)).to.eql([1, 1, 1]);
				expect(convertBase(111,  2,  2,  null)).to.eql([1, 1, 1]);
				expect(convertBase(-111, 10, 2,  null)).to.eql([-7]);
				expect(convertBase(-2,   1,  10, null)).to.eql([-1, -1]);
				expect(convertBase(3,    1,  10, null)).to.eql([1, 1, 1]);
			});
			it("supports custom digit characters", () => {
				expect(convertBase("255", 16, 10, "0123456789abcdef")).to.equal("ff");
				expect(convertBase(0xDEF, 16, 10, "0123456789𝑎𝑏𝑐𝑑𝑒𝑓")) .to.equal("𝑑𝑒𝑓");
				expect(convertBase("-Ed", 10, 16, "0123456789AbcdEf")).to.equal("-237");
				expect(convertBase(2,     1,  10, "⓪①")).to.equal("①①");
				expect(convertBase(3,     1,  10, "𒁹")).to.equal("𒁹𒁹𒁹");
			});
			it("uses multiple digits for out-of-bounds values", () =>
				expect(convertBase(3, 10, 10, "01")).to.equal("11"));
		});
		describe("Error-handling", () => {
			it("throws an error for unrecognised digits", () => {
				expect(() => convertBase("12345A%Z67890"))     .to.throw(TypeError, "Invalid digit: %");
				expect(() => convertBase("A2Z", 10, 10, "ABC")).to.throw(TypeError, "Invalid digit: 2");
				expect(() => convertBase("-23", 10, 10, "012")).to.throw(TypeError, "Invalid digit: 3");
			});
			const radixError = "Radix must be a positive, non-zero integer";
			it("throws an error for negative radices", () => {
				expect(() => convertBase(20, -1))    .to.throw(RangeError, radixError);
				expect(() => convertBase(20, 10, -1)).to.throw(RangeError, radixError);
			});
			it("throws an error for fractional radices", () => {
				expect(() => convertBase(20, 10.5))    .to.throw(RangeError, radixError);
				expect(() => convertBase(20, 10, 10.5)).to.throw(RangeError, radixError);
			});
			it("throws an error for radices of zero", () => {
				expect(() => convertBase(20, 0))    .to.throw(RangeError, radixError);
				expect(() => convertBase(20, 10, 0)).to.throw(RangeError, radixError);
			});
		});
	});
	
	describe("degToRad() / radToDeg()", () => {
		const {degToRad, radToDeg} = utils;
		it("converts degrees to radians", () => expect(degToRad(180)).to.equal(Math.PI));
		it("converts radians to degrees", () => expect(radToDeg(Math.PI)).to.equal(180));
	});
	
	describe("distance()", () => {
		const {distance} = utils;
		it("measures positive distances", () => expect(distance([30, 0], [0, 40])).to.equal(50));
		it("measures negative distances", () => expect(distance([0, 40], [30, 0])).to.equal(50));
		it("measures empty distances",    () => expect(distance([32, 4], [32, 4])).to.equal(0));
	});
	
	describe("normalise()", () => {
		const {normalise} = utils;
		const cmp = (input, expected) => {
			const actual = normalise(input);
			const parsed = `${actual[0]}e${actual[1]}`;
			expect(actual).to.eql(expected);
			expect(parseFloat(parsed)).to.equal(input);
			expect(input.toExponential().replace(/e\+/, "e")).to.equal(parsed);
		};
		it("normalises integers", () => {
			cmp(+1e0, [+1, 0]);
			cmp(-1e0, [-1, 0]);
			cmp(+1e1, [+1, 1]);
			cmp(-1e1, [-1, 1]);
			cmp(+1e2, [+1, 2]);
			cmp(-1e2, [-1, 2]);
			cmp(+1e3, [+1, 3]);
			cmp(-1e3, [-1, 3]);
			cmp(+1e4, [+1, 4]);
			cmp(-1e4, [-1, 4]);
			cmp(+1e5, [+1, 5]);
			cmp(-1e5, [-1, 5]);
			cmp(+1e6, [+1, 6]);
			cmp(-1e6, [-1, 6]);
			cmp(+1e7, [+1, 7]);
			cmp(-1e7, [-1, 7]);
		});
		it("normalises fractional numbers", () => {
			cmp(+1.99875, [+1.99875, 0]);
			cmp(-1.99875, [-1.99875, 0]);
			cmp(+19.9875, [+1.99875, 1]);
			cmp(-19.9875, [-1.99875, 1]);
			cmp(+199.875, [+1.99875, 2]);
			cmp(-199.875, [-1.99875, 2]);
			cmp(+1998.75, [+1.99875, 3]);
			cmp(-1998.75, [-1.99875, 3]);
			cmp(+19987.5, [+1.99875, 4]);
			cmp(-19987.5, [-1.99875, 4]);
			cmp(+5.74012, [+5.74012, 0]);
			cmp(-5.74012, [-5.74012, 0]);
			cmp(+57.4012, [+5.74012, 1]);
			cmp(-57.4012, [-5.74012, 1]);
			cmp(+574.012, [+5.74012, 2]);
			cmp(-574.012, [-5.74012, 2]);
			cmp(+5740.12, [+5.74012, 3]);
			cmp(-5740.12, [-5.74012, 3]);
			cmp(+57401.2, [+5.74012, 4]);
			cmp(-57401.2, [-5.74012, 4]);
		});
		it("normalises subnormal numbers", () => {
			cmp(+0.00244,      [+2.44,       -3]);
			cmp(-0.00244,      [-2.44,       -3]);
			cmp(+0.00574012,   [+5.74012,    -3]);
			cmp(-0.00574012,   [-5.74012,    -3]);
			cmp(+0.0244140625, [+2.44140625, -2]);
			cmp(-0.0244140625, [-2.44140625, -2]);
		});
		it("normalises recurring decimals", () => {
			cmp(+1 / 9,        [+1.111111111111111,  -1]);
			cmp(-1 / 9,        [-1.111111111111111,  -1]);
			cmp(-1 / 3,        [-3.333333333333333,  -1]);
			cmp(+1 / 3,        [+3.333333333333333,  -1]);
			cmp(+99 + 1 / 9,   [+9.91111111111111111, 1]);
			cmp(-99 - 1 / 9,   [-9.91111111111111111, 1]);
			cmp(+999 + 1 / 9,  [+9.99111111111111111, 2]);
			cmp(-999 - 1 / 9,  [-9.99111111111111111, 2]);
		});
		it("short-circuits infinite values", () => {
			expect(normalise(Infinity)) .to.eql([Infinity,  0]);
			expect(normalise(-Infinity)).to.eql([-Infinity, 0]);
		});
		it("short-circuits non-numeric values", () => {
			expect(normalise({}))       .to.eql([NaN, 0]);
			expect(normalise(NaN))      .to.eql([NaN, 0]);
			expect(normalise(undefined)).to.eql([NaN, 0]);
		});
	});
	
	describe("random()", function(){
		this.slow(5000);
		const {random} = utils;
		it("generates pseudo-random integers within a range", () => {
			for(let i = 1; i < 9999; ++i){
				const num = random(i, i * i);
				expect(num).to.be.within(i, i * i);
				expect(~~num).to.equal(num);
			}
		});
		it("lets the lower limit be omitted", () => {
			for(let i = 1; i < 9999; ++i){
				expect(random(i)).to.be.within(0, i);
				expect(random(-i)).to.be.within(-i, 0);
			}
		});
	});
	
	describe("roundTiesToAway()", () => {
		const {roundTiesToAway} = utils;
		it("rounds positive numbers", () => {
			expect(roundTiesToAway(0.2)) .to.equal(0);
			expect(roundTiesToAway(0.5)) .to.equal(1);
			expect(roundTiesToAway(0.8)) .to.equal(1);
			expect(roundTiesToAway(1.0)) .to.equal(1);
			expect(roundTiesToAway(1.2)) .to.equal(1);
			expect(roundTiesToAway(1.5)) .to.equal(2);
			expect(roundTiesToAway(1.8)) .to.equal(2);
			expect(roundTiesToAway(2.0)) .to.equal(2);
			expect(roundTiesToAway(2.2)) .to.equal(2);
			expect(roundTiesToAway(2.5)) .to.equal(3);
			expect(roundTiesToAway(2.8)) .to.equal(3);
			expect(roundTiesToAway(23.3)).to.equal(23);
			expect(roundTiesToAway(23.5)).to.equal(24);
			expect(roundTiesToAway(23.8)).to.equal(24);
		});
		it("rounds negative numbers", () => {
			expect(roundTiesToAway(-0.2)).to.equal(-0);
			expect(roundTiesToAway(-0.5)).to.equal(-1);
			expect(roundTiesToAway(-0.8)).to.equal(-1);
			expect(roundTiesToAway(-1.0)).to.equal(-1);
			expect(roundTiesToAway(-1.2)).to.equal(-1);
			expect(roundTiesToAway(-1.5)).to.equal(-2);
			expect(roundTiesToAway(-1.8)).to.equal(-2);
			expect(roundTiesToAway(-2.0)).to.equal(-2);
			expect(roundTiesToAway(-2.2)).to.equal(-2);
			expect(roundTiesToAway(-2.5)).to.equal(-3);
			expect(roundTiesToAway(-2.8)).to.equal(-3);
			expect(roundTiesToAway(-23.3)).to.equal(-23);
			expect(roundTiesToAway(-23.5)).to.equal(-24);
			expect(roundTiesToAway(-23.8)).to.equal(-24);
		});
		it("does nothing with infinities", () => {
			expect(roundTiesToAway(Infinity)) .to.equal(Infinity);
			expect(roundTiesToAway(-Infinity)).to.equal(-Infinity);
			expect(roundTiesToAway(+NaN)).to.be.NaN;
			expect(roundTiesToAway(-NaN)).to.be.NaN;
			expect(roundTiesToAway(+0)).to.equal(0);
			expect(roundTiesToAway(-0)).to.equal(0);
		});
	});
	
	describe("roundTiesToEven()", () => {
		const {roundTiesToEven} = utils;
		it("rounds positive odd numbers", () => {
			expect(roundTiesToEven(1.2)) .to.equal(1);
			expect(roundTiesToEven(1.5)) .to.equal(2);
			expect(roundTiesToEven(1.8)) .to.equal(2);
			expect(roundTiesToEven(23.0)).to.equal(23);
			expect(roundTiesToEven(23.3)).to.equal(23);
			expect(roundTiesToEven(23.5)).to.equal(24);
			expect(roundTiesToEven(23.7)).to.equal(24);
			expect(roundTiesToEven(25.0)).to.equal(25);
			expect(roundTiesToEven(25.3)).to.equal(25);
			expect(roundTiesToEven(25.5)).to.equal(26);
			expect(roundTiesToEven(25.7)).to.equal(26);
		});
		it("rounds positive even numbers", () => {
			expect(roundTiesToEven(0.2)) .to.equal(0);
			expect(roundTiesToEven(0.5)) .to.equal(0);
			expect(roundTiesToEven(0.8)) .to.equal(1);
			expect(roundTiesToEven(24.0)).to.equal(24);
			expect(roundTiesToEven(24.3)).to.equal(24);
			expect(roundTiesToEven(24.5)).to.equal(24);
			expect(roundTiesToEven(24.7)).to.equal(25);
		});
		it("rounds negative odd numbers", () => {
			expect(roundTiesToEven(-1.2)) .to.equal(-1);
			expect(roundTiesToEven(-1.5)) .to.equal(-2);
			expect(roundTiesToEven(-1.8)) .to.equal(-2);
			expect(roundTiesToEven(-23.0)).to.equal(-23);
			expect(roundTiesToEven(-23.3)).to.equal(-23);
			expect(roundTiesToEven(-23.5)).to.equal(-24);
			expect(roundTiesToEven(-23.7)).to.equal(-24);
			expect(roundTiesToEven(-25.0)).to.equal(-25);
			expect(roundTiesToEven(-25.3)).to.equal(-25);
			expect(roundTiesToEven(-25.5)).to.equal(-26);
			expect(roundTiesToEven(-25.7)).to.equal(-26);
		});
		it("rounds negative even numbers", () => {
			expect(roundTiesToEven(-0.2)) .to.equal(0);
			expect(roundTiesToEven(-0.5)) .to.equal(0);
			expect(roundTiesToEven(-0.8)) .to.equal(-1);
			expect(roundTiesToEven(-24.0)).to.equal(-24);
			expect(roundTiesToEven(-24.3)).to.equal(-24);
			expect(roundTiesToEven(-24.5)).to.equal(-24);
			expect(roundTiesToEven(-24.7)).to.equal(-25);
		});
		it("ignores anything else", () => {
			expect(roundTiesToEven(Infinity)) .to.equal(Infinity);
			expect(roundTiesToEven(-Infinity)).to.equal(-Infinity);
			expect(roundTiesToEven(+NaN)).to.be.NaN;
			expect(roundTiesToEven(-NaN)).to.be.NaN;
			expect(roundTiesToEven(+0)).to.equal(0);
			expect(roundTiesToEven(-0)).to.equal(0);
		});
	});
	
	describe("roundTowardNegative()", () => {
		const {roundTowardNegative} = utils;
		it("rounds positive numbers", () => {
			expect(roundTowardNegative(0.2)) .to.equal(0);
			expect(roundTowardNegative(0.5)) .to.equal(0);
			expect(roundTowardNegative(0.8)) .to.equal(0);
			expect(roundTowardNegative(1.0)) .to.equal(1);
			expect(roundTowardNegative(1.2)) .to.equal(1);
			expect(roundTowardNegative(1.5)) .to.equal(1);
			expect(roundTowardNegative(1.8)) .to.equal(1);
			expect(roundTowardNegative(2.0)) .to.equal(2);
			expect(roundTowardNegative(23.0)).to.equal(23);
			expect(roundTowardNegative(23.3)).to.equal(23);
			expect(roundTowardNegative(23.5)).to.equal(23);
			expect(roundTowardNegative(23.7)).to.equal(23);
			expect(roundTowardNegative(24.0)).to.equal(24);
			expect(roundTowardNegative(24.3)).to.equal(24);
			expect(roundTowardNegative(24.5)).to.equal(24);
			expect(roundTowardNegative(24.7)).to.equal(24);
		});
		it("rounds negative numbers", () => {
			expect(roundTowardNegative(-0.2)) .to.equal(-1);
			expect(roundTowardNegative(-0.5)) .to.equal(-1);
			expect(roundTowardNegative(-0.8)) .to.equal(-1);
			expect(roundTowardNegative(-1.0)) .to.equal(-1);
			expect(roundTowardNegative(-1.2)) .to.equal(-2);
			expect(roundTowardNegative(-1.5)) .to.equal(-2);
			expect(roundTowardNegative(-1.8)) .to.equal(-2);
			expect(roundTowardNegative(-2.0)) .to.equal(-2);
			expect(roundTowardNegative(-23.0)).to.equal(-23);
			expect(roundTowardNegative(-23.3)).to.equal(-24);
			expect(roundTowardNegative(-23.5)).to.equal(-24);
			expect(roundTowardNegative(-23.7)).to.equal(-24);
			expect(roundTowardNegative(-24.0)).to.equal(-24);
			expect(roundTowardNegative(-24.3)).to.equal(-25);
			expect(roundTowardNegative(-24.5)).to.equal(-25);
			expect(roundTowardNegative(-24.7)).to.equal(-25);
		});
		it("ignores anything else", () => {
			expect(roundTowardNegative(Infinity)) .to.equal(Infinity);
			expect(roundTowardNegative(-Infinity)).to.equal(-Infinity);
			expect(roundTowardNegative(+NaN)).to.be.NaN;
			expect(roundTowardNegative(-NaN)).to.be.NaN;
			expect(roundTowardNegative(+0)).to.equal(0);
			expect(roundTowardNegative(-0)).to.equal(0);
		});
	});
	
	describe("roundTowardPositive()", () => {
		const {roundTowardPositive} = utils;
		it("rounds positive numbers", () => {
			expect(roundTowardPositive(0.2)) .to.equal(1);
			expect(roundTowardPositive(0.5)) .to.equal(1);
			expect(roundTowardPositive(0.8)) .to.equal(1);
			expect(roundTowardPositive(1.0)) .to.equal(1);
			expect(roundTowardPositive(1.2)) .to.equal(2);
			expect(roundTowardPositive(1.5)) .to.equal(2);
			expect(roundTowardPositive(1.8)) .to.equal(2);
			expect(roundTowardPositive(23.0)).to.equal(23);
			expect(roundTowardPositive(23.3)).to.equal(24);
			expect(roundTowardPositive(23.5)).to.equal(24);
			expect(roundTowardPositive(23.7)).to.equal(24);
			expect(roundTowardPositive(24.0)).to.equal(24);
			expect(roundTowardPositive(24.3)).to.equal(25);
			expect(roundTowardPositive(24.5)).to.equal(25);
			expect(roundTowardPositive(24.7)).to.equal(25);
		});
		it("rounds negative numbers", () => {
			expect(roundTowardPositive(-0.2)) .to.equal(0);
			expect(roundTowardPositive(-0.5)) .to.equal(0);
			expect(roundTowardPositive(-0.8)) .to.equal(0);
			expect(roundTowardPositive(-1.0)) .to.equal(-1);
			expect(roundTowardPositive(-1.2)) .to.equal(-1);
			expect(roundTowardPositive(-1.5)) .to.equal(-1);
			expect(roundTowardPositive(-1.8)) .to.equal(-1);
			expect(roundTowardPositive(-23.0)).to.equal(-23);
			expect(roundTowardPositive(-23.3)).to.equal(-23);
			expect(roundTowardPositive(-23.5)).to.equal(-23);
			expect(roundTowardPositive(-23.7)).to.equal(-23);
			expect(roundTowardPositive(-24.0)).to.equal(-24);
			expect(roundTowardPositive(-24.3)).to.equal(-24);
			expect(roundTowardPositive(-24.5)).to.equal(-24);
			expect(roundTowardPositive(-24.7)).to.equal(-24);
		});
		it("ignores anything else", () => {
			expect(roundTowardPositive(Infinity)) .to.equal(Infinity);
			expect(roundTowardPositive(-Infinity)).to.equal(-Infinity);
			expect(roundTowardPositive(+NaN)).to.be.NaN;
			expect(roundTowardPositive(-NaN)).to.be.NaN;
			expect(roundTowardPositive(+0)).to.equal(0);
			expect(roundTowardPositive(-0)).to.equal(0);
		});
	});
	
	describe("sum()", () => {
		const {sum} = utils;
		it("returns 0 by default",  () => expect(sum()).to.equal(0));
		it("adds numbers together", () => expect(sum(1, 3)).to.equal(4));
		it("adds bigints together", () => expect(sum(1n, 3n)).to.equal(4));
		it("adds both numbers and bigints", () => {
			expect(sum(1n, 3)).to.equal(4);
			expect(sum(1, 3n)).to.equal(4);
			expect(sum(-4n, 2)).to.equal(-2);
			expect(sum(-4, 2n)).to.equal(-2);
		});
	});
});
