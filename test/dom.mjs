import * as utils from "../index.mjs";
import {setupHooks} from "./browser/helpers.mjs";

// Skip suite unless running in a browser
utils.isBrowser() && describe("DOM manipulation", () => {
	setupHooks();
	
	describe("buildDict()", () => {
		const {buildDict} = utils;
		const dl = (...args) => {
			const dl = document.createElement("dl");
			dl.insertAdjacentHTML("afterBegin", String.raw(...args));
			return dl;
		};

		it("enumerates <dl> elements as POJOs", () => expect(buildDict(dl`
			<dt>Name</dt>    <dd>John</dd>
			<dt>Gender</dt>  <dd>Male</dd>
			<dt>Country</dt> <dd>Australia</dd>
		`)).to.eql({
			Name:    "John",
			Gender:  "Male",
			Country: "Australia",
		}));

		it("stores values as strings", () => expect(buildDict(dl`
			<dt>Age</dt>    <dd>38</dd>
			<dt>DOB</dt>    <dd>1987-04-18T03:31:00+10:00</dd>
			<dt>SSN</dt>    <dd></dd>
			<dt>Car</dt>    <dd>undefined</dd>
			<dt>Aspie</dt>  <dd>true</dd>
			<dt>Drinks</dt> <dd>false</dd>
			<dt>Smokes</dt> <dd>null</dd>
		`)).to.eql({
			Age:    "38",
			DOB:    "1987-04-18T03:31:00+10:00",
			SSN:    "",
			Car:    "undefined",
			Aspie:  "true",
			Drinks: "false",
			Smokes: "null",
		}));

		describe("Element collation", () => {
			it("stores multiple definitions as arrays", () => expect(buildDict(dl`
				<dt>Name</dt>      <dd>Ian James Thorpe</dd>
				<dt>Nicknames</dt> <dd>Thorpedo</dd> <dd>Thorpey</dd>
				<dt>Colours</dt>   <dd>Green</dd>    <dd>Gold</dd>
				<dt>Height</dt>    <dd>1.96 metres</dd>
			`)).to.eql({
				Name:      "Ian James Thorpe",
				Nicknames: ["Thorpedo", "Thorpey"],
				Colours:   ["Green", "Gold"],
				Height:    "1.96 metres",
			}));
			
			it("stores multi-name entries as duplicates", () => {
				expect(buildDict(dl`
					<dt>Surname</dt>
					<dt>Family name</dt>
					<dt>Last name</dt>
					<dd>Gardner</dd>
				`)).to.eql({
					Surname:       "Gardner",
					"Family name": "Gardner",
					"Last name":   "Gardner",
				});
				expect(buildDict(dl`
					<dt>Favourite colour</dt>
					<dt lang="en-US">Favorite color</dt>
					<dd>Green</dd>
					<dd>Black</dd>
				`)).to.eql({
					"Favourite colour": ["Green", "Black"],
					"Favorite color":   ["Green", "Black"],
				});
			});
			
			it("copies arrays when duplicating", () => {
				const vapourHeat = ["284 kJ/mol", "284000 joules/mole"];
				const dict = buildDict(dl`
					<dt>Name</dt>
					<dd>Aluminium</dd>
					<dd lang="en-US">Aluminum</dd>
					
					<dt>Heat of vaporisation</dt>
					<dt lang="en-US">Heat of vaporization</dt>
					<dd>${vapourHeat[0]}</dd>
					<dd>${vapourHeat[1]}</dd>
				`);
				expect(dict).to.eql({
					Name: ["Aluminium", "Aluminum"],
					"Heat of vaporisation": vapourHeat,
					"Heat of vaporization": vapourHeat,
				});
				const english  = dict["Heat of vaporisation"];
				const yanklish = dict["Heat of vaporization"];
				expect(english).not.to.equal(yanklish);
				yanklish.pop();
				expect(yanklish).to.have.lengthOf(1);
				expect(english) .to.have.lengthOf(2);
			});
			
			it("retains duplicate definitions", () => {
				const dict = dl`<dt>ID</dt><dd>1</dd><dd>2</dd><dd>1</dd>`;
				expect(buildDict(dict)).to.eql({ID: ["1", "2", "1"]});
				dict.children[2].remove();
				expect(buildDict(dict)).to.eql({ID: ["1", "1"]});
			});
			
			it("merges non-contiguous duplicates", () => expect(buildDict(dl`
				<dt>Foo</dt><dd>1</dd>
				<dt>Bar</dt><dd>3</dd>
				<dt>Foo</dt><dd>2</dd>
			`)).to.eql({
				Foo: ["1", "2"],
				Bar: "3",
			}));
		});
	
		describe("Stringication", () => {
			before("Attaching stylesheet", () => {
				const style = document.createElement("style");
				document.head.appendChild(style);
				style.innerHTML = ".caps { text-transform: uppercase; }";
			});
			
			it("uses `.innerText` properties to stringify elements", () => {
				// … because it provides more meaningful line-breaks
				expect(buildDict(document.body.appendChild(dl`
					<dt>Name</dt>
					<dd>
						<div class="first-name">John</div>
						<div class="last-name">Gardner</div>
					</dd>
				`))).to.eql({Name: "John\nGardner"});
				
				const id = "babeface-beef-dead-c0de-abcdef123456";
				const el = document.body.appendChild(dl`
					<dt><b>UUID</b></dt>
					<dd class="caps">${id}</dd>
				`);
				expect(buildDict(el)).to.eql({UUID: id.toUpperCase()});
				el.lastElementChild.innerHTML = id.replace(/-/g, "-<br/>");
				el.lastElementChild.classList.toggle("caps");
				expect(buildDict(el)).to.eql({UUID: id.replace(/-/g, "-\n")});
			});
			
			it("allows users to specify a different property", () => {
				const abbr = '<abbr title="Failed UniBus Address Register">FUBAR</abbr>';
				const dict = document.body.appendChild(dl`<dt>Status</dt><dd>${abbr}</dd>`);
				expect(buildDict(dict, "innerHTML")).to.eql({Status: abbr});
				
				const toJS = Symbol("toJavaScript");
				dict.firstElementChild[toJS] = "status";
				dict.lastElementChild [toJS] = "Not good";
				expect(buildDict(dict, toJS)).to.eql({status: "Not good"});
			});
		});
		
		describe("Property name filters", () => {
			it("strips whitespace by default", () => expect(buildDict(dl`
				<dt>
					First Name
				</dt>
				<dd>John</dd>
			`)).to.eql({"First Name": "John"}));
			
			it("strips trailing colons by default", () => {
				expect(buildDict(dl`<dt>Name:</dt> <dd>John</dd>`)).to.eql({Name: "John"});
				expect(buildDict(dl`<dt>Name::</dt><dd>John</dd>`)).to.eql({Name: "John"});
				expect(buildDict(dl`<dt>:Key:</dt> <dd>John</dd>`)).to.eql({":Key": "John"});
				expect(buildDict(dl`<dt>Name :  </dt><dd>John</dd>`)).to.eql({Name: "John"});
			});
			
			it("filters names by regular expression", () => {
				const unwrap = /^<(?!-)[-\w]+(?=\s|>)[^>]*>|<\/\w+>$/g;
				expect(buildDict(dl`
					<dt><b>Name</b></dt>
					<dd><dfn>John Gardner</dfn></dd>
				`, "innerHTML", unwrap)).to.eql({
					Name: "<dfn>John Gardner</dfn>",
				});
			});
			
			it("substitutes names by callback", () => {
				const fn = name => ({
					Name: "userName",
					Age:  "currentAge",
				}[name] || "unknownField");
				expect(buildDict(dl`
					<dt>Name</dt> <dd>Alhadis</dd>
					<dt>Age</dt>  <dd>38</dd>
					<dt>Sex</dt>  <dd>Infrequent</dd>
					<dt>Job</dt>  <dd>Larrikin</dd>
				`, "textContent", fn)).to.eql({
					userName: "Alhadis",
					currentAge: "38",
					unknownField: ["Infrequent", "Larrikin"],
				});
			});
		});
	});
});
