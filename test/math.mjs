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
	
	describe("distance()", () => {
		const {distance} = utils;
		it("measures positive distances", () => expect(distance([30, 0], [0, 40])).to.equal(50));
		it("measures negative distances", () => expect(distance([0, 40], [30, 0])).to.equal(50));
		it("measures empty distances",    () => expect(distance([32, 4], [32, 4])).to.equal(0));
	});
	
	describe("degToRad() / radToDeg()", () => {
		const {degToRad, radToDeg} = utils;
		it("converts degrees to radians", () => expect(degToRad(180)).to.equal(Math.PI));
		it("converts radians to degrees", () => expect(radToDeg(Math.PI)).to.equal(180));
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
