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
});
