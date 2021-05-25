import * as utils from "../index.mjs";

describe("Text-related functions", () => {
	describe("alignText()", () => {
		const {alignText} = utils;
		it("centres input by default",       () => expect(alignText("Text", 6)).to.equal(" Text "));
		it("left-aligns text with spaces",   () => expect(alignText("Text", 10, 0.0)).to.equal("Text      "));
		it("centre-aligns text with spaces", () => expect(alignText("Text", 10, 0.5)).to.equal("   Text   "));
		it("right-aligns text with spaces",  () => expect(alignText("Text", 10, 1.0)).to.equal("      Text"));
		it("supports arbitrary alignment",   () => {
			expect(alignText("Text", 14, 0.75, "=")).to.equal("========Text==");
			expect(alignText("Text", 14, 0.25, "*")).to.equal("***Text*******");
		});
		it("supports custom padding characters", () => {
			expect(alignText("Text",   10, 0.0, "=")).to.equal("Text======");
			expect(alignText("Text",   10, 0.5, "=")).to.equal("===Text===");
			expect(alignText("Text",   10, 1.0, "=")).to.equal("======Text");
			expect(alignText(" Text ", 10, 0.0, "-")).to.equal(" Text ----");
			expect(alignText(" Text ", 10, 0.5, "-")).to.equal("-- Text --");
			expect(alignText(" Text ", 10, 1.0, "-")).to.equal("---- Text ");
			expect(alignText("Text",   20, 0.0, "=")).to.equal("Text================");
			expect(alignText("Text",   20, 0.5, "=")).to.equal("========Text========");
			expect(alignText("Text",   20, 1.0, "=")).to.equal("================Text");
			expect(alignText("[Text]", 20, 0.0, "-")).to.equal("[Text]--------------");
			expect(alignText("[Text]", 20, 0.5, "-")).to.equal("-------[Text]-------");
			expect(alignText("[Text]", 20, 1.0, "-")).to.equal("--------------[Text]");
		});
		it("does nothing if input is too wide", () => {
			const input = "1234567890";
			expect(alignText(input, 5)).to.equal(input);
			expect(alignText(input, 10)).to.equal(input);
		});
		it("rounds off uneven spacing", () => {
			const input = "1234567890";
			expect(alignText(input, 11)).to.equal(` ${input}`);
			expect(alignText(input, 12)).to.equal(` ${input} `);
			expect(alignText(input, 13)).to.equal(`  ${input} `);
			expect(alignText(input, 14)).to.equal(`  ${input}  `);
		});
	});
	
	describe("camelise()", () => {
		const {camelise} = utils;
		it("converts alphabetic input", () => {
			expect(camelise("foo")).to.equal("foo");
			expect(camelise("foo_bar")).to.equal("fooBar");
			expect(camelise("foo-bar")).to.equal("fooBar");
			expect(camelise("foo_bar_baz")).to.equal("fooBarBaz");
			expect(camelise("foo-bar-baz")).to.equal("fooBarBaz");
			expect(camelise("FOO_BAR_BAZ")).to.equal("fooBarBaz");
			expect(camelise("FOO-BAR-BAZ")).to.equal("fooBarBaz");
		});
		it("converts alphanumeric input", () => {
			expect(camelise("foo1-bar")).to.equal("foo1Bar");
			expect(camelise("foo-1bar")).to.equal("foo1Bar");
			expect(camelise("foo1-bar2-baz")).to.equal("foo1Bar2Baz");
			expect(camelise("foo-1bar-2baz")).to.equal("foo1Bar2Baz");
			expect(camelise("foo12-bar34-baz")).to.equal("foo12Bar34Baz");
			expect(camelise("foo-12bar-34baz")).to.equal("foo12Bar34Baz");
			expect(camelise("foo_bar3_baz")).to.equal("fooBar3Baz");
			expect(camelise("foo_bar_3baz")).to.equal("fooBar3Baz");
			expect(camelise("fOO_bAR_3bAZ")).to.equal("fooBar3Baz");
			expect(camelise("foo_bar_3_baz")).to.equal("fooBar3Baz");
			expect(camelise("F0O_BAR_3_BAZ")).to.equal("f0oBar3Baz");
			expect(camelise("123_foo_456")).to.equal("123Foo456");
		});
		it("converts input with non-alphanumeric separators", () => {
			expect(camelise("ABC.XYZ")).to.equal("abcXyz");
			expect(camelise("fOO BAr bAz")).to.equal("fooBarBaz");
			expect(camelise("Get URL Of XML file")).to.equal("getUrlOfXmlFile");
		});
		it("converts arrays of strings", () => {
			expect(camelise(["ABC", "XYZ"])).to.equal("abcXyz");
			expect(camelise(["Foo", "Bar", "Baz"])).to.equal("fooBarBaz");
			expect(camelise([{toString(){ return "Foo"; }}, "BAr"])).to.equal("fooBar");
			expect(camelise([])).to.equal("");
		});
		it("converts to PascalCase", () => {
			const opts = {pascalCase: true};
			expect(camelise("FOO BAR", opts)).to.equal("FooBar");
			expect(camelise("a BC Xyz", opts)).to.equal("ABcXyz");
			expect(camelise("ab C Xyz", opts)).to.equal("AbCXyz");
			expect(camelise(["fOO", "Bar"], opts)).to.equal("FooBar");
		});
		it("can handle contiguous separators", () => {
			expect(camelise("foo----bar")).to.equal("fooBar");
			expect(camelise("foo---bar--baz")).to.equal("fooBarBaz");
		});
		describe("When `preserveCaps` is enabled", () => {
			it("preserves casing of wholly-uppercase segments", () => {
				const opts = {preserveCaps: true};
				expect(camelise("A-URL", opts)).to.equal("AURL");
				expect(camelise("A-Value", opts)).to.equal("AValue");
				expect(camelise("XML-URL", opts)).to.equal("XMLURL");
				expect(camelise("xML-URL", opts)).to.equal("xmlURL");
				expect(camelise("Get-URL-Of-XML-file", opts)).to.equal("getURLOfXMLFile");
				expect(camelise("GEt-URL-Of-XML-file", opts)).to.equal("getURLOfXMLFile");
				expect(camelise("GET-URL-Of-XML-file", opts)).to.equal("GETURLOfXMLFile");
			});
			it('lowercases initial segments if set to "except-first"', () => {
				const opts = {preserveCaps: "except-first"};
				expect(camelise("A-URL", opts)).to.equal("aURL");
				expect(camelise("A-Value", opts)).to.equal("aValue");
				expect(camelise("Xml-URL", opts)).to.equal("xmlURL");
				expect(camelise("XMl-URL", opts)).to.equal("xmlURL");
				expect(camelise("XML-URL", opts)).to.equal("xmlURL");
			});
			it("doesn't conflict with the `pascalCase` option", () => {
				const opts = {pascalCase: true, preserveCaps: true};
				expect(camelise("foo-URL-Bar", opts)).to.equal("FooURLBar");
				expect(camelise("XML-URL-foo", opts)).to.equal("XMLURLFoo");
				expect(camelise("XMl-URL-Bar", opts)).to.equal("XmlURLBar");
				opts.preserveCaps = "except-first";
				expect(camelise("foo-URL-Bar", opts)).to.equal("FooURLBar");
				expect(camelise("XML-URL-foo", opts)).to.equal("XmlURLFoo");
				expect(camelise("XMl-URL-Bar", opts)).to.equal("XmlURLBar");
			});
		});
	});
	
	describe("decamelise()", () => {
		const {decamelise} = utils;
		it("converts alphabetic input", () => {
			expect(decamelise("fooB")).to.equal("foo-b");
			expect(decamelise("fBar")).to.equal("f-bar");
			expect(decamelise("fooBar")).to.equal("foo-bar");
			expect(decamelise("fooBarBaz")).to.equal("foo-bar-baz");
			expect(decamelise("<tagName>")).to.equal("<tag-name>");
			expect(decamelise("FooBar")).to.equal("foo-bar");
			expect(decamelise("IFooBar")).to.equal("i-foo-bar");
			expect(decamelise("aBbCcDd")).to.equal("a-bb-cc-dd");
			expect(decamelise("Foo.barBaz")).to.equal("foo.bar-baz");
			expect(decamelise("fooBarBazQ")).to.equal("foo-bar-baz-q");
			expect(decamelise("transformOriginX")).to.equal("transform-origin-x");
			expect(decamelise("HTML")).to.equal("html");
			expect(decamelise("F")).to.equal("f");
			expect(decamelise("F.")).to.equal("f.");
		});
		it("converts alphanumeric input", () => {
			expect(decamelise("foo1Bar")).to.equal("foo1-bar");
			expect(decamelise("fooBar1")).to.equal("foo-bar1");
			expect(decamelise("fooBar1Baz")).to.equal("foo-bar1-baz");
			expect(decamelise("fooBar1Baz20")).to.equal("foo-bar1-baz20");
			expect(decamelise("foo1Bar23Baz")).to.equal("foo1-bar23-baz");
			expect(decamelise("foo1Bar23baz")).to.equal("foo1-bar23baz");
			expect(decamelise("transformOriginY1")).to.equal("transform-origin-y1");
			expect(decamelise("1Foo")).to.equal("1-foo");
			expect(decamelise("1foo")).to.equal("1foo");
			expect(decamelise("1FooBar")).to.equal("1-foo-bar");
			expect(decamelise("1fooBar")).to.equal("1foo-bar");
			expect(decamelise("A4Paper")).to.equal("a4-paper");
			expect(decamelise("is50Bucks")).to.equal("is50-bucks");
			expect(decamelise("3DModelFile")).to.equal("3d-model-file");
		});
		it("converts input containing acronyms", () => {
			expect(decamelise("fooHTML")).to.equal("foo-html");
			expect(decamelise("fooHTML1")).to.equal("foo-html1");
			expect(decamelise("fooHTMLBar")).to.equal("foo-html-bar");
			expect(decamelise("fooHTMLBarBaz")).to.equal("foo-html-bar-baz");
			expect(decamelise("getURLOfPage")).to.equal("get-url-of-page");
			expect(decamelise("HTMLElement.fooBar")).to.equal("html-element.foo-bar");
			expect(decamelise("foo1HTML")).to.equal("foo1-html");
			expect(decamelise("foo1HTML2")).to.equal("foo1-html2");
			expect(decamelise("foo1H2ML3")).to.equal("foo1-h2ml3");
			expect(decamelise("fooBarHTML")).to.equal("foo-bar-html");
			expect(decamelise("fooBarHTMLBaz")).to.equal("foo-bar-html-baz");
			expect(decamelise("foo10HTML20")).to.equal("foo10-html20");
			expect(decamelise("f01oH2ML3")).to.equal("f01o-h2ml3");
			expect(decamelise("isHTML5")).to.equal("is-html5");
			expect(decamelise("isHTML5?")).to.equal("is-html5?");
			expect(decamelise("isHTML5Tag")).to.equal("is-html5-tag");
			expect(decamelise("IsHTML5Tag")).to.equal("is-html5-tag");
		});
		it("allows different separators to be used", () => {
			expect(decamelise("fooBar", "_")).to.equal("foo_bar");
			expect(decamelise("fooHTMLBar", "_")).to.equal("foo_html_bar");
			expect(decamelise("FooBar_Baz", "_")).to.equal("foo_bar_baz");
			expect(decamelise("Foo_BarBaz", ".")).to.equal("foo_bar.baz");
			expect(decamelise("fooBarBaz", "->")).to.equal("foo->bar->baz");
		});
		it("retains casing of alphabetic separators", () => {
			expect(decamelise("fooBar", "I")).to.equal("fooIbar");
			expect(decamelise("fooBarHTML", " OR ")).to.equal("foo OR bar OR html");
		});
		it("retains casing if `preserveCase` is enabled", () => {
			expect(decamelise("fooBar", false, true)).to.equal("foo-Bar");
			expect(decamelise("FooBar", false, true)).to.equal("Foo-Bar");
			expect(decamelise("A4Paper", false, true)).to.equal("A4-Paper");
			expect(decamelise("<XYZ>", false, true)).to.equal("<XYZ>");
			expect(decamelise("fooBarHTML", false, true)).to.equal("foo-Bar-HTML");
			expect(decamelise("PascalCase", "-", false, true)).to.equal("Pascal-Case");
			expect(decamelise("PascalCase", ".", false, true)).to.equal("Pascal.Case");
			expect(decamelise("NOT_CAMEL_CASE.iKnow", "-", false, true)).to.equal("NOT_CAMEL_CASE.i-Know");
		});
		describe("When `strict` is enabled", () => {
			it("converts well-formed camelCase", () => {
				expect(decamelise("foo", true)).to.equal("foo");
				expect(decamelise("fooBar", true)).to.equal("foo-bar");
				expect(decamelise("fooBar2", "_", true)).to.equal("foo_bar2");
				expect(decamelise("fooBar2HTML", true, true)).to.equal("foo-Bar2-HTML");
			});
			it("converts well-formed PascalCase", () => {
				expect(decamelise("Foo", true)).to.equal("foo");
				expect(decamelise("FooBar", true)).to.equal("foo-bar");
				expect(decamelise("FooBar2", "_", true, true)).to.equal("Foo_Bar2");
			});
			it("doesn't convert input beginning with a digit", () => {
				expect(decamelise("1fooBar", true)).to.equal("1fooBar");
				expect(decamelise("1FooBar", true)).to.equal("1FooBar");
				expect(decamelise("3D", true)).to.equal("3D");
			});
			it("doesn't convert input containing non-alphanumerics", () => {
				expect(decamelise("foo\0", true)).to.equal("foo\0");
				expect(decamelise("foo_bar", true)).to.equal("foo_bar");
				expect(decamelise("foo_barBaz", true)).to.equal("foo_barBaz");
				expect(decamelise("fooBar-Baz", true)).to.equal("fooBar-Baz");
				expect(decamelise("<tagName>", true)).to.equal("<tagName>");
				expect(decamelise("1-fooBar", true)).to.equal("1-fooBar");
				expect(decamelise("HTMLElement.fooBar", true)).to.equal("HTMLElement.fooBar");
				expect(decamelise("foo_barBaz", true)).to.equal("foo_barBaz");
				expect(decamelise("fooBar-Baz", true)).to.equal("fooBar-Baz");
			});
		});
	});
	
	describe("deindent()", () => {
		const {deindent} = utils;
		describe("String literals", () => {
			it("strips leading tabs", () => {
				expect(deindent("Foo\n\tBar\n\tBaz")).to.equal("Foo\nBar\nBaz");
				expect(deindent("Foo\n\tBar\nBaz")).to.equal("Foo\nBar\nBaz");
				expect(deindent("Foo\n\tBar\n\t\nBaz")).to.equal("Foo\nBar\n\nBaz");
			});

			it("strips leading spaces", () => {
				// 4-column indents
				expect(deindent("Foo\n    Bar\n    Baz")).to.equal("Foo\nBar\nBaz");
				expect(deindent("Foo\n    Bar\nBaz")).to.equal("Foo\nBar\nBaz");
				expect(deindent("Foo\n    Bar\n    \n    Baz")).to.equal("Foo\nBar\n\nBaz");
				
				// 2-column indents (i.e., the worst tab-stop width ever)
				expect(deindent("Foo\n  Bar\n  Baz")).to.equal("Foo\nBar\nBaz");
				expect(deindent("Foo\n    Bar\n  Baz")).to.equal("Foo\n  Bar\nBaz");
				expect(deindent("Foo\n    Bar\n  \n  Baz")).to.equal("Foo\n  Bar\n\nBaz");
			});

			it("strips mixed tabs and spaces", () => {
				expect(deindent("Foo\n\t    \t    \tBar\n\t    \t    \tBaz")).to.equal("Foo\nBar\nBaz");
				expect(deindent("Foo\n\t    \t    \tBar\n\t    \t    Baz")).to.equal("Foo\n\tBar\nBaz");
				expect(deindent("Foo\n\t    \t    \t    Bar\n\t    \t    Baz")).to.equal("Foo\n\t    Bar\nBaz");
			});
			
			it("strips leading newlines", () => {
				expect(deindent("\n\t\t\t\t\tFoo\n\t\t\t\t\tBar\n\t\t\t\t\tBaz")).to.equal("Foo\nBar\nBaz");
				expect(deindent("\n\t\t\t\t\t\n\t\t\t\t\tFoo\n\t\t\t\t\tBar\n\t\t\t\t\tBaz")).to.equal("Foo\nBar\nBaz");
				expect(deindent("\n\t\t\t\t\tFoo\n\t\t\t\t\t\tBar\n\t\t\t\t\tBaz")).to.equal("Foo\n\tBar\nBaz");
				expect(deindent("\n\t\t\t\t\t\n\t\t\t\t\tFoo\n\t\t\t\t\t\tBar\n\t\t\t\t\tBaz")).to.equal("Foo\n\tBar\nBaz");
			});
			
			it("strips trailing newlines", () => {
				expect(deindent("Foo\n\t\t\t\t\tBar\n\t\t\t\t\tBaz\n\t\t\t\t")).to.equal("Foo\nBar\nBaz");
				expect(deindent("Foo\n\t\t\t\t\tBar\n\t\t\t\t\tBaz\n\t\t\t\t\t\n\t\t\t\t")).to.equal("Foo\nBar\nBaz");
				expect(deindent("Foo\n\t\t\t\t\tBar\n\t\t\t\tBaz\n\t\t\t\t")).to.equal("Foo\n\tBar\nBaz");
				expect(deindent("Foo\n\t\t\t\t\tBar\n\t\t\t\tBaz\n\t\t\t\t\n\t\t\t\t")).to.equal("Foo\n\tBar\nBaz");
			});
			
			it("retains trailing tabs", () => {
				expect(deindent("Foo\t")).to.equal("Foo\t");
				expect(deindent("\tFoo\t")).to.equal("Foo\t");
			});
			
			it("retains trailing spaces", () => {
				expect(deindent("Foo  ")).to.equal("Foo  ");
				expect(deindent("  Foo  ")).to.equal("Foo  ");
			});
		});
		describe("Tagged templates", () => {
			it("strips leading tabs", () => {
				expect(deindent `Foo
					Bar
					Baz`).to.equal("Foo\nBar\nBaz");
				expect(deindent `Foo
					Bar
				Baz`).to.equal("Foo\n\tBar\nBaz");
			});

			it("strips leading spaces", () => {
				// 4-column indents
				expect(deindent `Foo
                    Bar
                    Baz`).to.equal("Foo\nBar\nBaz");
				expect(deindent `Foo
                    Bar
                Baz`).to.equal("Foo\n    Bar\nBaz");
				
				// 2-column indents (i.e., the worst tab-stop width ever)
				expect(deindent `Foo
          Bar
          Baz`).to.equal("Foo\nBar\nBaz");
				expect(deindent `Foo
            Bar
          Baz`).to.equal("Foo\n  Bar\nBaz");
			});

			it("strips mixed tabs and spaces", () => {
				expect(deindent `Foo
	    	    	Bar
	    	    	Baz`).to.equal("Foo\nBar\nBaz");
				expect(deindent `Foo
	    	    	Bar
	    	    Baz`).to.equal("Foo\n\tBar\nBaz");
				expect(deindent `Foo
	    	    	    Bar
	    	    Baz`).to.equal("Foo\n\t    Bar\nBaz");
			});
			
			it("strips leading newlines", () => {
				expect(deindent `
					Foo
					Bar
					Baz`
				).to.equal("Foo\nBar\nBaz");
				expect(deindent `
					
					Foo
					Bar
					Baz`
				).to.equal("Foo\nBar\nBaz");
				expect(deindent `
					Foo
						Bar
					Baz`
				).to.equal("Foo\n\tBar\nBaz");
				expect(deindent `
					
					Foo
						Bar
					Baz`
				).to.equal("Foo\n\tBar\nBaz");
			});
			
			it("strips trailing newlines", () => {
				expect(deindent `Foo
					Bar
					Baz
				`).to.equal("Foo\nBar\nBaz");
				expect(deindent `Foo
					Bar
					Baz
					
				`).to.equal("Foo\nBar\nBaz");
				expect(deindent `Foo
					Bar
				Baz
				`).to.equal("Foo\n\tBar\nBaz");
				expect(deindent `Foo
					Bar
				Baz
				
				`).to.equal("Foo\n\tBar\nBaz");
			});
		});
	});
	
	describe("escapeCtrl()", () => {
		const {escapeCtrl} = utils;
		function escape(input, expected, opts = {}){
			expect(escapeCtrl(input, opts)).to.equal(expected);
			expect(escapeCtrl(`A${input}Z`, opts)).to.equal(`A${expected}Z`);
		}
		const ord = n => String.fromCharCode(n);
		const hex = n => n.toString(16).padStart(2, "0").toUpperCase();
		const oct = n => n.toString(8).padStart(3, "0");
		it("escapes codes in hexadecimal", () => {
			for(let i = 0x00; i < 0x09; ++i) escape(ord(i), `\\x${hex(i)}`);
			for(let i = 0x0B; i < 0x20; ++i) escape(ord(i), `\\x${hex(i)}`);
			for(let i = 0x7F; i < 0xA0; ++i) escape(ord(i), `\\x${hex(i)}`);
		});
		it("escapes codes in octal", () => {
			for(let i = 0x00; i < 0x09; ++i) escape(ord(i), `\\${oct(i)}`, {octal: true});
			for(let i = 0x0B; i < 0x20; ++i) escape(ord(i), `\\${oct(i)}`, {octal: true});
			for(let i = 0x7F; i < 0xA0; ++i) escape(ord(i), `\\${oct(i)}`, {octal: true});
		});
		it("escapes codes in caret notation", () => {
			const codex = "@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_";
			for(let i = 0x00; i < 0x09; ++i) escape(ord(i), "^" + codex[i], {caret: true});
			for(let i = 0x0B; i < 0x20; ++i) escape(ord(i), "^" + codex[i], {caret: true});
			escape("\x7F", "^?", {caret: true});
		});
		it("escapes codes in C-style notation", () => {
			escape("\0",   "\\0", {named: true});
			escape("\x07", "\\a", {named: true});
			escape("\b",   "\\b", {named: true});
			escape("\x1B", "\\e", {named: true});
			escape("\f",   "\\f", {named: true});
			escape("\r",   "\\r", {named: true});
			escape("\v",   "\\v", {named: true});
		});
		it("escapes codes as Unicode control pictures", () => {
			const codex = "␀␁␂␃␄␅␆␇␈␉␊␋␌␍␎␏␐␑␒␓␔␕␖␗␘␙␚␛␜␝␞␟␠";
			for(let i = 0x00; i < 0x09; ++i) escape(ord(i), codex[i], {pictures: true});
			for(let i = 0x0B; i < 0x20; ++i) escape(ord(i), codex[i], {pictures: true});
			escape("\x7F", "␡", {pictures: true});
		});
		it("doesn't escape tabs", () => {
			escape("\t", "\t");
			escape("\t", "\t", {octal: true});
			escape("\t", "\t", {caret: true});
			escape("\t", "\t", {named: true});
		});
		it("doesn't escape line feeds", () => {
			escape("\n", "\n");
			escape("\n", "\n", {octal: true});
			escape("\n", "\n", {caret: true});
			escape("\n", "\n", {named: true});
		});
		it("doesn't escape carriage returns in CRLF", () => {
			escape("\r\n",   "\r\n");
			escape("\r\n",   "\r\n",      {octal: true});
			escape("\r\n",   "\r\n",      {caret: true});
			escape("\r\n",   "\r\n",      {named: true});
			escape("\r\r\n", "\\x0D\r\n");
			escape("\r\r\n", "\\015\r\n", {octal: true});
			escape("\r\r\n", "^M\r\n",    {caret: true});
			escape("\r\r\n", "\\r\r\n",   {named: true});
		});
		it("inserts strings around every escape", () => {
			const before = "\x1B[7m";
			const after  = "\x1B[27m";
			escape("\0",   before + "\\x00" + after, {before, after});
			escape("\0",   before + "\\000" + after, {before, after, octal: true});
			escape("\0",   before + "\\0"   + after, {before, after, named: true});
			escape("\0",   before + "^@"    + after, {before, after, caret: true});
			escape("\0",   before + "␀"    + after, {before, after, pictures: true});
			escape("\x1B", before + "\\x1B" + after, {before, after});
			escape("\x1B", before + "\\033" + after, {before, after, octal: true});
			escape("\x1B", before + "\\e"   + after, {before, after, named: true});
			escape("\x1B", before + "^["    + after, {before, after, caret: true});
			escape("\x1B", before + "␛"    + after, {before, after, pictures: true});
		});
		it("escapes additional characters given by the user", () => {
			escape("|",    "\\x7C",      {include: "|"});
			escape("^",    "\\x5E",      {include: "^"});
			escape("\t",   "\\x09",      {include: "\t"});
			escape("\n",   "\\x0A",      {include: "\n"});
			escape("\r\n", "\\x0D\n",    {include: "\r"});
			escape("\r\n", "\\x0D\\x0A", {include: "\r\n"});
		});
		it("exempts certain characters from being escaped", () => {
			escape("\0",   "\0",   {exclude: "\0"});
			escape("\x1B", "\x1B", {exclude: "\x1B"});
			escape("\v\f", "\v\f", {exclude: "\v\f"});
			escape("|",    "|",    {exclude: "|"});
		});
	});
	
	describe("escapeHTML()", () => {
		const {escapeHTML} = utils;
		it("escapes angle brackets", () => void expect(escapeHTML("< < > >")).to.equal("&#60; &#60; &#62; &#62;"));
		it("escapes ampersands",     () => void expect(escapeHTML("A & B & Z")).to.equal("A &#38; B &#38; Z"));
		it("escapes double-quotes",  () => void expect(escapeHTML('A \\"B" Z')).to.equal("A \\&#34;B&#34; Z"));
		it("escapes single-quotes",  () => void expect(escapeHTML("A \\'B' Z")).to.equal("A \\&#39;B&#39; Z"));
	});
	
	describe("escapeRegExp()", () => {
		const {escapeRegExp} = utils;
		it("escapes backslashes",       () => void expect(escapeRegExp("\\")).to.equal("\\\\"));
		it("escapes metacharacters",    () => void expect(escapeRegExp("$")).to.equal("\\$"));
		it("escapes character classes", () => void expect(escapeRegExp("[ABC]")).to.equal("\\[ABC\\]"));
		it("escapes capturing groups",  () => void expect(escapeRegExp("(A)")).to.equal("\\(A\\)"));
		it("escapes source accurately", () => {
			const pattern = /^ember(?:\.|(?:-[^.]+)?-(?:\d+\.)+(?:debug\.)?)js$/i;
			const source = escapeRegExp(pattern.source);
			expect(new RegExp(source).test(pattern.source)).to.be.true;
		});
	});
	
	describe("escapeShellArg()", () => {
		const {escapeShellArg} = utils;
		const escape = (input, expected, opts = {}) => {
			for(let i = 0; i < 2; ++i){
				const [dash, prefix, isPath] = i ? ["-", "./", true] : ["", "", false];
				expect(escapeShellArg(dash + input.repeat(1), {...opts, isPath})).to.equal(prefix + dash + expected.repeat(1));
				expect(escapeShellArg(dash + input.repeat(2), {...opts, isPath})).to.equal(prefix + dash + expected.repeat(2));
				expect(escapeShellArg(dash + input.repeat(5), {...opts, isPath})).to.equal(prefix + dash + expected.repeat(5));
			}
		};
		describe("Default behaviour", () => {
			it("escapes spaces",            () => escape("a b",  "a\\ b"));
			it("escapes tabs",              () => escape("a\tb", "a\\\tb"));
			it("escapes colons",            () => escape(":",    "\\:"));
			it("escapes semicolons",        () => escape(";",    "\\;"));
			it("escapes asterisks",         () => escape("*",    "\\*"));
			it("escapes question marks",    () => escape("?",    "\\?"));
			it("escapes exclamation marks", () => escape("!",    "\\!"));
			it("escapes at-signs",          () => escape("@",    "\\@"));
			it("escapes plus-signs",        () => escape("+",    "\\+"));
			it("escapes number-signs",      () => escape("#",    "\\#"));
			it("escapes dollar-signs",      () => escape("$",    "\\$"));
			it("escapes equals-signs",      () => escape("=",    "\\="));
			it("escapes double-quotes",     () => escape('"',    '\\"'));
			it("escapes single-quotes",     () => escape("'",    "\\'"));
			it("escapes backticks",         () => escape("`",    "\\`"));
			it("escapes backslashes",       () => escape("\\",   "\\\\"));
			it("escapes round-brackets",    () => escape("()",   "\\(\\)"));
			it("escapes angle-brackets",    () => escape("<>",   "\\<\\>"));
			it("escapes square-brackets",   () => escape("[]",   "\\[\\]"));
			it("escapes curly-brackets",    () => escape("{}",   "\\{\\}"));
			it("escapes ampersands",        () => escape("&",    "\\&"));
			it("escapes pipes",             () => escape("|",    "\\|"));
			it("escapes tildes",            () => escape("~",    "\\~"));
			it("escapes them all together", () => {
				const symbols = "!\"#$&'()*+:;<=>?@[\\]`{|}~";
				escape(symbols, symbols.replace(/./g, "\\$&"));
				escape("; rm -rf *", "\\;\\ rm\\ -rf\\ \\*");
			});
		});
		describe("When `quotes` is enabled", () => {
			it("escapes dollar-signs",           () => escape("$",    "\\$",  {quoted: true}));
			it("escapes backticks",              () => escape("`",    "\\`",  {quoted: true}));
			it("escapes backslashes",            () => escape("\\",   "\\\\", {quoted: true}));
			it("escapes exclamation marks",      () => escape("!",    "\\!",  {quoted: true}));
			it("escapes double-quotes",          () => escape('"',    '\\"',  {quoted: true}));
			it("doesn't escape spaces",          () => escape("a b",  "a b",  {quoted: true}));
			it("doesn't escape tabs",            () => escape("a\tb", "a\tb", {quoted: true}));
			it("doesn't escape colons",          () => escape(":",    ":",    {quoted: true}));
			it("doesn't escape semicolons",      () => escape(";",    ";",    {quoted: true}));
			it("doesn't escape asterisks",       () => escape("*",    "*",    {quoted: true}));
			it("doesn't escape question marks",  () => escape("?",    "?",    {quoted: true}));
			it("doesn't escape at-signs",        () => escape("@",    "@",    {quoted: true}));
			it("doesn't escape plus-signs",      () => escape("+",    "+",    {quoted: true}));
			it("doesn't escape number-signs",    () => escape("#",    "#",    {quoted: true}));
			it("doesn't escape equals-signs",    () => escape("=",    "=",    {quoted: true}));
			it("doesn't escape single-quotes",   () => escape("'",    "'",    {quoted: true}));
			it("doesn't escape round-brackets",  () => escape("()",   "()",   {quoted: true}));
			it("doesn't escape angle-brackets",  () => escape("<>",   "<>",   {quoted: true}));
			it("doesn't escape square-brackets", () => escape("[]",   "[]",   {quoted: true}));
			it("doesn't escape curly-brackets",  () => escape("{}",   "{}",   {quoted: true}));
			it("doesn't escape ampersands",      () => escape("&",    "&",    {quoted: true}));
			it("doesn't escape pipes",           () => escape("|",    "|",    {quoted: true}));
			it("doesn't escape tildes",          () => escape("~",    "~",    {quoted: true}));
		});
		describe("`nullBytes` option", () => {
			it("keeps them by default", () => {
				escape("\0",       "\0");
				escape("\0\0",     "\0\0");
				escape("\0A\0B\0", "\0A\0B\0");
			});
			it("removes them when set to `strip`", () => {
				escape("\0",       "",   {nullBytes: "strip"});
				escape("\0\0",     "",   {nullBytes: "strip"});
				escape("\0A\0B\0", "AB", {nullBytes: "strip"});
			});
			it("inserts a backslash when set to `escape`", () => {
				escape("\0",       "\\\0",           {nullBytes: "escape"});
				escape("\0\0",     "\\\0\\\0",       {nullBytes: "escape"});
				escape("\0A\0B\0", "\\\0A\\\0B\\\0", {nullBytes: "escape"});
			});
			it("raises an exception when set to `error`", () => {
				const fn = () => escapeShellArg("\0", {nullBytes: "error"});
				expect(fn).to.throw(TypeError, /^Input contains null-bytes$/);
			});
		});
		describe("`newline` option", () => {
			it("keeps them by default", () => {
				for(const [input, expected] of [
					["\n",             "\n"],
					["\r\n",           "\r\n"],
					["A\nB",           "A\nB"],
					["A\r\nB",         "A\r\nB"],
					["\n\n",           "\n\n"],
					["\r\n\r\n",       "\r\n\r\n"],
					["\nA\nB\n",       "\nA\nB\n"],
					["\r\nA\r\nB\r\n", "\r\nA\r\nB\r\n"],
				]) escape(input, expected) + escape(input, expected, {newlines: "ignore"});
			});
			it("removes them when set to `strip`", () => {
				for(const [input, expected] of [
					["\n",             ""],
					["\r\n",           ""],
					["A\nB",           "AB"],
					["A\r\nB",         "AB"],
					["\n\n",           ""],
					["\r\n\r\n",       ""],
					["\nA\nB\n",       "AB"],
					["\r\nA\r\nB\r\n", "AB"],
				]) escape(input, expected, {newlines: "strip"});
			});
			it("inserts a backslash when set to `escape`", () => {
				for(const [input, expected] of [
					["\n",             "\\\n"],
					["\r\n",           "\\\r\\\n"],
					["A\nB",           "A\\\nB"],
					["A\r\nB",         "A\\\r\\\nB"],
					["\n\n",           "\\\n\\\n"],
					["\r\n\r\n",       "\\\r\\\n\\\r\\\n"],
					["\nA\nB\n",       "\\\nA\\\nB\\\n"],
					["\r\nA\r\nB\r\n", "\\\r\\\nA\\\r\\\nB\\\r\\\n"],
				]) escape(input, expected, {newlines: "escape"});
			});
			it("inserts single-quotes when set to `quote`", () => {
				for(const [input, expected] of [
					["\n",             "'\n'"],
					["\r\n",           "'\r\n'"],
					["A\nB",           "A'\n'B"],
					["A\r\nB",         "A'\r\n'B"],
					["\n\n",           "'\n\n'"],
					["\r\n\r\n",       "'\r\n\r\n'"],
					["\nA\nB\n",       "'\n'A'\n'B'\n'"],
					["\nA\n\nB",       "'\n'A'\n\n'B"],
					["\r\nA\r\nB\r\n", "'\r\n'A'\r\n'B'\r\n'"],
					["\r\nA\r\n\r\nB", "'\r\n'A'\r\n\r\n'B"],
				]) expect(escapeShellArg(input, {newlines: "quote"})).to.equal(expected);
			});
			it("replaces them with spaces when set to `collapse`", () => {
				for(const [input, expected] of [
					["\n",             " "],
					["\r\n",           " "],
					["A\nB",           "A B"],
					["A\r\nB",         "A B"],
					["\n\n",           " "],
					["\r\n\r\n",       " "],
					["\nA\nB\n",       " A B "],
					["\r\nA\r\nB\r\n", " A B "],
				]) expect(escapeShellArg(input, {newlines: "collapse"})).to.equal(expected);
			});
			it("raises an exception when set to `error`", () => {
				const error = [TypeError, "Input contains newlines"];
				for(const test of ["\n", "\r\n", "A\nB", "A\r\nB"])
					expect(() => escapeShellArg(test, {newlines: "error"})).to.throw(...error);
			});
		});
	});
	
	describe("expandEscapes()", () => {
		const {expandEscapes} = utils;
		const expand = (input, expected, ...opts) => {
			expect(expandEscapes(input,           ...opts)).to.equal(expected);
			expect(expandEscapes(`<${input}>`,    ...opts)).to.equal(`<${expected}>`);
			expect(expandEscapes(`A${input}Z`,    ...opts)).to.equal(`A${expected}Z`);
			expect(expandEscapes(input.repeat(4), ...opts)).to.equal(expected.repeat(4));
		};
		it("expands 2-digit codepoints", () => {
			expand("\\x00", "\0");
			expand("\\x45", "E");
			expand("\\x7e", "~");
			expand("\\x7E", "~");
			expand("\\x5a", "Z");
			expand("\\x5A", "Z");
			expand("\\xff", "ÿ");
			expand("\\xFF", "ÿ");
			expand("\\xFf", "ÿ");
			expand("\\x7F", "\x7F");
			expand("\\x20\\x0A", " \n");
			expand("\\x0a\\x20", "\n ");
		});
		it("expands 4-digit codepoints", () => {
			expand("\\u0000", "\0");
			expand("\\u0045", "E");
			expand("\\u007e", "~");
			expand("\\u007E", "~");
			expand("\\u005a", "Z");
			expand("\\u005A", "Z");
			expand("\\u00ff", "ÿ");
			expand("\\u00FF", "ÿ");
			expand("\\u00Ff", "ÿ");
			expand("\\u0020", " ");
			expand("\\u000A", "\n");
			expand("\\u010A", "Ċ");
			expand("\\u2014", "—");
			expand("\\u2020", "†");
			expand("\\uFFFD", "�");
		});
		it("expands variable-length codepoints", () => {
			expand("\\u{0000}", "\0");  expand("\\u{0}",   "\0");
			expand("\\u{0045}", "E");   expand("\\u{45}",  "E");
			expand("\\u{007e}", "~");   expand("\\u{7e}",  "~");
			expand("\\u{007E}", "~");   expand("\\u{07E}", "~");
			expand("\\u{005a}", "Z");   expand("\\u{5a}",  "Z");
			expand("\\u{005A}", "Z");   expand("\\u{5A}",  "Z");
			expand("\\u{00ff}", "ÿ");   expand("\\u{ff}",  "ÿ");
			expand("\\u{00FF}", "ÿ");   expand("\\u{0FF}", "ÿ");
			expand("\\u{00Ff}", "ÿ");   expand("\\u{0Ff}", "ÿ");
			expand("\\u{0020}", " ");   expand("\\u{A}",   "\n");
			expand("\\u{010A}", "Ċ");   expand("\\u{10a}", "Ċ");
			expand("\\u{2014}", "—");   expand("\\u{002020}", "†");
			expand("\\u{FFFD}", "�");   expand("\\u{00fffd}", "�");
			expand("\\u{1F602}", "😂"); expand("\\u{000001f602}", "😂");
		});
		it("expands octal codepoints", () => {
			expand("\\033", "\x1B");
			expand("\\33",  "\x1B");
			expand("\\3",   "\x03");
			expand("\\72",  ":");
			expand("\\177", "\x7F");
		});
		it("expands single-character escapes", () => {
			expand("\\0", "\0");
			expand("\\t", "\t");
			expand("\\n", "\n");
			expand("\\r", "\r");
			expand("\\f", "\f");
			expand("\\v", "\v");
			expand("\\b", "\b");
		});
		it("expands escaped backslashes", () => {
			expand("\\\\0", "\\0");
			expand("\\\\t", "\\t");
			expand("\\\\n", "\\n");
			expand("\\\\r", "\\r");
			expand("\\\\f", "\\f");
			expand("\\\\v", "\\v");
			expand("\\\\b", "\\b");
		});
		it("removes line continuations", () => {
			expand("\\\n",       "");
			expand("\\\r\n",     "");
			expand("\\\n\r",     "\r");
			expand("\\\n\n",     "\n");
			expand("\\\r\n\r\n", "\r\n");
		});
		it("removes partial escape sequences", () => {
			expect(expandEscapes("\\")).to.equal("");
			expect(expandEscapes("\\\\\\")).to.equal("\\");
		});
		it("strips the slash from unknown escapes", () => {
			expand("\\?", "?");
			expand("\\%", "%");
			expand("\\!", "!");
			expand("\\U", "U");
			expand("\\X", "X");
			expand("\\8", "8");
		});
		it("keeps the slash if `ignoreUnknown` is enabled", () => {
			const opts = [undefined, true];
			expand("\\?", "\\?", ...opts);
			expand("\\%", "\\%", ...opts);
			expand("\\!", "\\!", ...opts);
			expand("\\U", "\\U", ...opts);
			expand("\\X", "\\X", ...opts);
			expand("\\8", "\\8", ...opts);
		});
		it("expands \\a and \\e if `all` is enabled", () => {
			expand("\\a", "a",    false);
			expand("\\e", "e",    false);
			expand("\\a", "\x07", true);
			expand("\\e", "\x1B", true);
		});
		it("doesn't double-expand contiguous escapes", () => {
			expand("\\x5Cn",   "\\n");
			expand("\\x5Cx5C", "\\x5C");
			expand("\\\\x5C",  "\\x5C");
		});
	});
	
	describe("findBasePath()", () => {
		const {findBasePath} = utils;
		it("returns the directory that contains each path", () => {
			const paths = [
				"/usr/local/bin/node_modules",
				"/usr/local/bin/not-npm",
				"/usr/local/bin/other-shite",
			];
			expect(findBasePath(paths)).to.equal("/usr/local/bin");
			expect(findBasePath(["/usr/local/share", ...paths])).to.equal("/usr/local");
			expect(findBasePath(["/usr/local",       ...paths])).to.equal("/usr/local");
			expect(findBasePath(["/usr/share/man",   ...paths])).to.equal("/usr");
			expect(findBasePath(["/tmp",             ...paths])).to.equal("/");
			expect(findBasePath(["/",                ...paths])).to.equal("/");
		});
		it("doesn't care about trailing slashes", () => {
			const paths = [
				"/usr/local/bin/node_modules/",
				"/usr/local/bin/not-npm/",
				"/usr/local/bin/other-shite/",
			];
			expect(findBasePath(paths)).to.equal("/usr/local/bin");
			expect(findBasePath(["/usr/local/share/", ...paths])).to.equal("/usr/local");
			expect(findBasePath(["/usr/local/",       ...paths])).to.equal("/usr/local");
			expect(findBasePath(["/usr/share/man/",   ...paths])).to.equal("/usr");
			expect(findBasePath(["/tmp/",             ...paths])).to.equal("/");
			expect(findBasePath(["/",                 ...paths])).to.equal("/");
		});
		it("returns the dirname of a single-path array", () => {
			expect(findBasePath(["/usr/local/bin/"])) .to.equal("/usr/local");
			expect(findBasePath(["/usr/local/bin"]))  .to.equal("/usr/local");
			expect(findBasePath(["/usr/local"]))      .to.equal("/usr");
			expect(findBasePath(["/usr"]))            .to.equal("/");
			expect(findBasePath(["/"]))               .to.equal("/");
		});
		it("works with Windows-style paths too", () => {
			const paths = [
				"C:\\Users\\John\\Is Glad\\He No Longer\\uses\\Windows",
				"C:\\Users\\John\\My Documents\\",
				"C:\\Users\\John\\My Music\\",
			];
			expect(findBasePath(paths)).to.equal("C:\\Users\\John");
			expect(findBasePath(["C:\\Users\\admin\\1", ...paths])).to.equal("C:\\Users");
			expect(findBasePath(["C:\\temp\\1",         ...paths])).to.equal("C:\\");
			expect(findBasePath(["D:\\temp\\1",         ...paths])).to.equal("");
		});
	});
	
	describe("formatBytes()", () => {
		const {formatBytes} = utils;
		const KB = 1024;
		const MB = KB * 1024;
		const GB = MB * 1024;
		const TB = GB * 1024;
		const PB = TB * 1024;
		const EB = PB * 1024;
		const ZB = EB * 1024;
		const YB = ZB * 1024;
		it("formats bytes", () => {
			expect(formatBytes(1)).to.equal("1 B");
			expect(formatBytes(127)).to.equal("127 B");
			expect(formatBytes(1023)).to.equal("1023 B");
		});
		it("formats kilobytes", () => {
			expect(formatBytes(KB *    1)).to.equal("1 KB");
			expect(formatBytes(KB * 1.25)).to.equal("1.25 KB");
			expect(formatBytes(KB * 1.50)).to.equal("1.5 KB");
			expect(formatBytes(KB * 3.75)).to.equal("3.75 KB");
			expect(formatBytes(KB *   50)).to.equal("50 KB");
			expect(formatBytes(KB *  359)).to.equal("359 KB");
			expect(formatBytes(KB * 1023)).to.equal("1023 KB");
		});
		it("formats megabytes", () => {
			expect(formatBytes(MB *    1)).to.equal("1 MB");
			expect(formatBytes(MB * 1.25)).to.equal("1.25 MB");
			expect(formatBytes(MB * 1.50)).to.equal("1.5 MB");
			expect(formatBytes(MB * 3.75)).to.equal("3.75 MB");
			expect(formatBytes(MB *   50)).to.equal("50 MB");
			expect(formatBytes(MB *  359)).to.equal("359 MB");
			expect(formatBytes(MB * 1023)).to.equal("1023 MB");
			expect(formatBytes(3524959))  .to.equal("3.36 MB");
		});
		it("formats gigabytes", () => {
			expect(formatBytes(GB *    1)).to.equal("1 GB");
			expect(formatBytes(GB * 1.25)).to.equal("1.25 GB");
			expect(formatBytes(GB * 1.50)).to.equal("1.5 GB");
			expect(formatBytes(GB * 3.75)).to.equal("3.75 GB");
			expect(formatBytes(GB *   50)).to.equal("50 GB");
			expect(formatBytes(GB *  359)).to.equal("359 GB");
			expect(formatBytes(GB * 1023)).to.equal("1023 GB");
		});
		it("formats terabytes", () => {
			expect(formatBytes(TB *    1)).to.equal("1 TB");
			expect(formatBytes(TB * 1.25)).to.equal("1.25 TB");
			expect(formatBytes(TB * 1.50)).to.equal("1.5 TB");
			expect(formatBytes(TB * 3.75)).to.equal("3.75 TB");
			expect(formatBytes(TB *   50)).to.equal("50 TB");
			expect(formatBytes(TB *  359)).to.equal("359 TB");
			expect(formatBytes(TB * 1023)).to.equal("1023 TB");
		});
		it("formats petabytes", () => {
			expect(formatBytes(PB *    1)).to.equal("1 PB");
			expect(formatBytes(PB * 1.25)).to.equal("1.25 PB");
			expect(formatBytes(PB * 1.50)).to.equal("1.5 PB");
			expect(formatBytes(PB * 3.75)).to.equal("3.75 PB");
			expect(formatBytes(PB *   50)).to.equal("50 PB");
			expect(formatBytes(PB *  359)).to.equal("359 PB");
			expect(formatBytes(PB * 1023)).to.equal("1023 PB");
		});
		it("formats exabytes", () => {
			expect(formatBytes(EB *    1)).to.equal("1 EB");
			expect(formatBytes(EB * 1.25)).to.equal("1.25 EB");
			expect(formatBytes(EB * 1.50)).to.equal("1.5 EB");
			expect(formatBytes(EB * 3.75)).to.equal("3.75 EB");
			expect(formatBytes(EB *   50)).to.equal("50 EB");
			expect(formatBytes(EB *  359)).to.equal("359 EB");
			expect(formatBytes(EB * 1023)).to.equal("1023 EB");
		});
		it("formats zettabytes", () => {
			expect(formatBytes(ZB *    1)).to.equal("1 ZB");
			expect(formatBytes(ZB * 1.25)).to.equal("1.25 ZB");
			expect(formatBytes(ZB * 1.50)).to.equal("1.5 ZB");
			expect(formatBytes(ZB * 3.75)).to.equal("3.75 ZB");
			expect(formatBytes(ZB *   50)).to.equal("50 ZB");
			expect(formatBytes(ZB *  359)).to.equal("359 ZB");
			expect(formatBytes(ZB * 1023)).to.equal("1023 ZB");
		});
		it("formats yottabytes", () => {
			expect(formatBytes(YB *    1)).to.equal("1 YB");
			expect(formatBytes(YB * 1.25)).to.equal("1.25 YB");
			expect(formatBytes(YB * 1.50)).to.equal("1.5 YB");
			expect(formatBytes(YB * 3.75)).to.equal("3.75 YB");
			expect(formatBytes(YB *   50)).to.equal("50 YB");
			expect(formatBytes(YB *  359)).to.equal("359 YB");
			expect(formatBytes(YB * 1023)).to.equal("1023 YB");
		});
	});
	
	describe("formatTime()", () => {
		const {formatTime} = utils;
		it("formats milliseconds",    () => expect(formatTime(945))      .to.equal("00:00:00.945"));
		it("formats seconds",         () => expect(formatTime(1753))     .to.equal("00:00:01.753"));
		it("formats minutes",         () => expect(formatTime(90999))    .to.equal("00:01:30.999"));
		it("formats hours",           () => expect(formatTime(12625000)) .to.equal("03:30:25.000"));
		it("formats hours over 99",   () => expect(formatTime(432000000)).to.equal("120:00:00.000"));
		it("ignores negative values", () => expect(formatTime(-500))     .to.equal("00:00:00.000"));
		it("ignores invalid input",   () => {
			const zero = "00:00:00.000";
			expect(formatTime(NaN)) .to.equal(zero);
			expect(formatTime({}))  .to.equal(zero);
			expect(formatTime())    .to.equal(zero);
		});
		it("rounds off fractional values", () => {
			expect(formatTime(504.45)).to.equal("00:00:00.504");
			expect(formatTime(504.65)).to.equal("00:00:00.505");
		});
		it("coerces non-numeric values", () => {
			expect(formatTime({valueOf: () => 450}))    .to.equal("00:00:00.450");
			expect(formatTime({valueOf: () => 450.75})) .to.equal("00:00:00.451");
		});
	});
	
	describe("getUnusedChar()", () => {
		const {getUnusedChar} = utils;
		it("returns a character with an unused codepoint", () => {
			expect(getUnusedChar("ABC"))   .to.equal("\0");
			expect(getUnusedChar("\0AB"))  .to.equal("\x01");
			expect(getUnusedChar("\0\x01")).to.equal("\x02");
			for(let s = "", i = 0; i < 255; s += String.fromCodePoint(i), ++i){
				expect(getUnusedChar(s)).to.equal(String.fromCodePoint(i));
				expect(getUnusedChar(s.substr(1))).to.equal("\0");
			}
		});
		it("returns multiple characters with unused codepoints", () => {
			expect(getUnusedChar("ABC", 2)).to.equal("\0\x01");
			expect(getUnusedChar("ABC", 3)).to.equal("\0\x01\x02");
			expect(getUnusedChar("\x00\x02", 2)).to.equal("\x01\x03");
		});
	});
	
	describe("isplit()", () => {
		const {isplit} = utils;
		it("splits strings using an arbitrary delimiter", () => {
			expect(isplit("A|B|C|D|E|F|", "|")).to.have.lengthOf(12);
			expect(isplit("-A-B-C-DEF",   "-")).to.have.lengthOf(8);
			expect(isplit("ABC--DE-F-",  "--")).to.have.lengthOf(3);
		});
		it("includes delimiters in the results", () => {
			expect(isplit("A|B|C|D|E|F|", "|")).to.eql("A|B|C|D|E|F|".split(""));
			expect(isplit("-A-B-C-DEF",   "-")).to.eql(["-", "A", "-", "B", "-", "C", "-", "DEF"]);
			expect(isplit("ABC--DE-F-",  "--")).to.eql(["ABC", "--", "DE-F-"]);
		});
		it("accepts regular expressions as delimiters", () => {
			expect(isplit("ABC_DEF___XYZ_", /_+/g)).to.eql(["ABC", "_", "DEF", "___", "XYZ", "_"]);
			expect(isplit("ABC1DEF123XYZ0", /\d+/)).to.eql(["ABC", "1", "DEF", "123", "XYZ", "0"]);
			expect(isplit("ABC", /^[A-Z]{3}$/g))   .to.eql(["ABC"]);
		});
		it("splits by character if no pattern is given", () => {
			expect(isplit("ABCDEF")).to.eql("ABCDEF".split(""));
		});
		it("filters empty segments from the results", () => {
			expect(isplit("ABC--DEF", "-")).to.eql(["ABC", "-", "-", "DEF"]);
			expect(isplit("-ABC--DE-F-", "-")).to.eql(["-", "ABC", "-", "-", "DE", "-", "F", "-"]);
		});
	});
	
	describe("isValidCCNumber()", () => {
		const {isValidCCNumber} = utils;
		it("validates credit-card numbers with separators", () => {
			expect(isValidCCNumber("0000-0000-0000-0000")).to.be.true;
			expect(isValidCCNumber("1234-5678-4213-8432")).to.be.true;
			expect(isValidCCNumber("1234 5678 4213 8432")).to.be.true;
			expect(isValidCCNumber("1234*5678*4213*8432")).to.be.true;
			expect(isValidCCNumber("1234_5678_4213_8432")).to.be.true;
			expect(isValidCCNumber("1234-5678-N0PE-8432")).to.be.false;
			expect(isValidCCNumber("1234 5678 N0PE 8432")).to.be.false;
			expect(isValidCCNumber("1234*5678*N0PE*8432")).to.be.false;
			expect(isValidCCNumber("1234_5678_N0PE_8432")).to.be.false;
		});
		it("validates credit-card numbers without separators", () => {
			expect(isValidCCNumber("0".repeat(16))).to.be.true;
			expect(isValidCCNumber("1234567842138432")).to.be.true;
			expect(isValidCCNumber("12345678N0PE8432")).to.be.false;
		});
		it("validates credit-card numbers with too many digits", () => {
			expect(isValidCCNumber("0".repeat(17))).to.be.false;
			expect(isValidCCNumber("1234-5678-4213-8432".repeat(2))).to.be.false;
			expect(isValidCCNumber("1234-5678-N0PE-8432".repeat(2))).to.be.false;
			expect(isValidCCNumber("1234567842138432".repeat(2))).to.be.false;
			expect(isValidCCNumber("12345678N0PE8432".repeat(2))).to.be.false;
		});
		it("validates credit-card numbers with not enough digits", () => {
			expect(isValidCCNumber("0".repeat(15))).to.be.false;
			expect(isValidCCNumber("1234-5678-8432")).to.be.false;
			expect(isValidCCNumber("1234 5678 8432")).to.be.false;
			expect(isValidCCNumber("123456784213")).to.be.false;
			expect(isValidCCNumber("12345678N0PE")).to.be.false;
		});
		it("allows pointless or repeated separators", () => {
			expect(isValidCCNumber("1234-----5678---4213----8432")).to.be.true;
			expect(isValidCCNumber("1234    5678     4213    8432")).to.be.true;
			expect(isValidCCNumber("1234*****5678***4213****8432")).to.be.true;
			expect(isValidCCNumber("1234______5678_4213___8432")).to.be.true;
			expect(isValidCCNumber("1234-----5678---N0PE---8432")).to.be.false;
			expect(isValidCCNumber("1234    5678     N0PE   8432")).to.be.false;
			expect(isValidCCNumber("1234***5678*******N0PE***8432")).to.be.false;
			expect(isValidCCNumber("1234__5678_________N0PE___8432")).to.be.false;
		});
		it("doesn't care where separators are placed", () => {
			expect(isValidCCNumber("1-2---3-456---7842--13-84----32")).to.be.true;
			expect(isValidCCNumber("1 2   3 456   7842  13 84    32")).to.be.true;
			expect(isValidCCNumber("1*2***3*456***7842**13*84****32")).to.be.true;
			expect(isValidCCNumber("1_2___3_456___7842__13_84____32")).to.be.true;
			expect(isValidCCNumber("1-2---3-456---78N0--PE-84----32")).to.be.false;
			expect(isValidCCNumber("1 2   3 456   78N0  PE 84    32")).to.be.false;
			expect(isValidCCNumber("1*2***3*456***78N0**PE*84****32")).to.be.false;
			expect(isValidCCNumber("1_2___3_456___78N0__PE_84____32")).to.be.false;
		});
		it("implicitly works with array-type arguments", () => {
			expect(isValidCCNumber([1234, 4567, 1245,   2553])).to.be.true;
			expect(isValidCCNumber([1234, 4567, "N0PE", 2553])).to.be.false;
		});
	});
	
	describe("mark()", () => {
		const {mark, deindent, deindent: HTML} = utils;
		it("demarcates regions of text", () => {
			expect(mark("abc123xyz", [[3, 6, "<", ">"]])).to.equal("abc<123>xyz");
			expect(mark("aBcdEf",    [[1, 2, "<", ">"], [4, 5, "<", ">"]])).to.equal("a<B>cd<E>f");
			expect(mark("nBn",       [[1, 2, "<b>", "</b>"]])).to.equal("n<b>B</b>n");
		});
		it("keeps delimiter pairs balanced", () => {
			expect(mark("abc123xyz", [[3, 6, "<", ">"], [1, 4, "[", "]"]])).to.equal("a[bc<1]23>xyz");
			const regions = [[3, 18, "<", ">"], [6, 14, "<", ">"], [9, 12, "<", ">"]];
			expect(mark("00011122233322111100", regions)).to.equal("000<111<222<333>22>1111>00");
			regions[1][3] = "}";
			regions[2][3] = ")";
			expect(mark("00011122233322111100", regions)).to.equal("000<111<222<333)22}1111>00");
		});
		it("sorts ranges in a logical order", () => {
			const ranges = [
				[251, 255, "<!--",     "-->"],
				[0,   488, "<body>",   "</body>"],
				[0,   5,   "<h1>",     "</h1>"],
				[5,   8,   "<!--",     "-->"],
				[8,   472, "<main>",   "</main>"],
				[8,   15,  "<h2>",     "</h2>"],
				[17,  251, "<p>",      "</p>"],
				[474, 487, "<footer>", "</footer>"],
				[143, 382, "<mark>",   "</mark>"],
				[255, 470, "<p>",      "</p>"],
				[474, 480, "<h3>",     "</h3>"],
			];
			const input = deindent `
			TITLE

				HEADING
				Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
				incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
				nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
				
				Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
				eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
				sunt in culpa qui officia deserunt mollit anim id est laborum.
				
				FOOTER
				Stuff
			` + "\n";
			const output = HTML `
			<body><h1>TITLE</h1><!--

				--><main><h2>HEADING</h2>
				<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor
				incididunt ut labore et dolore magna aliqua. <mark>Ut enim ad minim veniam, quis
				nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p><!--
				
				--><p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
				eu fugiat nulla pariatur. Excepteur sint occaecat</mark> cupidatat non proident,
				sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
				</main>
				<footer><h3>FOOTER</h3>
				Stuff</footer>
			</body>`;
			expect(mark(input, ranges)).to.equal(output);
		});
		it("ignores zero-length ranges", () => {
			expect(mark("ABC", [[1, 1, "<", ">"]])).to.equal("ABC");
		});
		it("treats an integer as an ANSI colour sequence", () => {
			expect(mark("RED",   1)).to.equal("\x1B[38;5;1mRED\x1B[39m");
			expect(mark("GREEN", 2)).to.equal("\x1B[38;5;2mGREEN\x1B[39m");
		});
		it("treats a string as a raw ANSI sequence", () => {
			expect(mark("ANNOYING", "\x1B[5m")).to.equal("\x1B[5mANNOYING\x1B[0m");
		});
		it("treats 2-string arrays as enclosing the entire input", () => {
			expect(mark("RED", ["\x1B[38;5;1m", "\x1B[39m"])).to.equal("\x1B[38;5;1mRED\x1B[39m");
		});
		it("defaults to marking text with inverse video", () => {
			expect(mark("ABC",  [1, 2])) .to.equal("A\x1B[7mB\x1B[27mC");
			expect(mark("ABC", [[1, 2]])).to.equal("A\x1B[7mB\x1B[27mC");
		});
	});
	
	describe("ordinalSuffix()", () => {
		const {ordinalSuffix} = utils;
		const th = "th", st = "st", nd = "nd", rd = "rd";
		it("returns a number's ordinal suffix in English", () => {
			const tests = {
				0:th,  1:st,  2:nd,  3:rd,  4:th,  5:th,  6:th,  7:th,  8:th,  9:th,
				10:th, 11:th, 12:th, 13:th, 14:th, 15:th, 16:th, 17:th, 18:th, 19:th,
				20:th, 21:st, 22:nd, 23:rd, 24:th, 25:th, 26:th, 27:th, 28:th, 29:th,
				30:th, 31:st, 32:nd, 33:rd, 34:th, 35:th, 36:th, 37:th, 38:th, 39:th,
				40:th, 41:st, 42:nd, 43:rd, 44:th, 45:th, 46:th, 47:th, 48:th, 49:th,
				50:th, 51:st, 52:nd, 53:rd, 54:th, 55:th, 56:th, 57:th, 58:th, 59:th,
				60:th, 61:st, 62:nd, 63:rd, 64:th, 65:th, 66:th, 67:th, 68:th, 69:th,
				70:th, 71:st, 72:nd, 73:rd, 74:th, 75:th, 76:th, 77:th, 78:th, 79:th,
				80:th, 81:st, 82:nd, 83:rd, 84:th, 85:th, 86:th, 87:th, 88:th, 89:th,
				90:th, 91:st, 92:nd, 93:rd, 94:th, 95:th, 96:th, 97:th, 98:th, 99:th,
				
				100:th, 101:st, 102:nd, 103:rd, 104:th, 105:th, 106:th, 107:th, 108:th, 109:th,
				110:th, 111:th, 112:th, 113:th, 114:th, 115:th, 116:th, 117:th, 118:th, 119:th,
				120:th, 121:st, 122:nd, 123:rd, 124:th, 125:th, 126:th, 127:th, 128:th, 129:th,
				130:th, 131:st, 132:nd, 133:rd, 134:th, 135:th, 136:th, 137:th, 138:th, 139:th,
				140:th, 141:st, 142:nd, 143:rd, 144:th, 145:th, 146:th, 147:th, 148:th, 149:th,
				150:th, 151:st, 152:nd, 153:rd, 154:th, 155:th, 156:th, 157:th, 158:th, 159:th,
				160:th, 161:st, 162:nd, 163:rd, 164:th, 165:th, 166:th, 167:th, 168:th, 169:th,
				170:th, 171:st, 172:nd, 173:rd, 174:th, 175:th, 176:th, 177:th, 178:th, 179:th,
				180:th, 181:st, 182:nd, 183:rd, 184:th, 185:th, 186:th, 187:th, 188:th, 189:th,
				190:th, 191:st, 192:nd, 193:rd, 194:th, 195:th, 196:th, 197:th, 198:th, 199:th,
			};
			for(const number in tests){
				const ordinal = tests[number];
				const result  = ordinalSuffix(number);
				const message = `Expected ordinal of ${number} to be ${number}${ordinal}, got ${number}${result}`;
				expect(result).to.equal(ordinal, message);
			}
		});
		it('defaults to "-th" for non-numeric arguments', () => {
			expect(ordinalSuffix(NaN)).to.equal("th");
			expect(ordinalSuffix(null)).to.equal("th");
			expect(ordinalSuffix(Infinity)).to.equal("th");
			expect(ordinalSuffix(-Infinity)).to.equal("th");
		});
	});
	
	describe("parseDuration()", () => {
		const {parseDuration} = utils;
		const SEC  = 1000;
		const MIN  = 60000;
		const HOUR = 3600000;
		const DAY  = 86400000;
		const WEEK = DAY * 7;
		const YEAR = DAY * 365.242198781;
		
		it("converts non-string values", () => {
			expect(parseDuration(0))    .to.equal(0);
			expect(parseDuration(4))    .to.equal(4);
			expect(parseDuration(4n))   .to.equal(4);
			expect(parseDuration(true)) .to.equal(1);
			expect(parseDuration(false)).to.equal(0);
			expect(parseDuration(null)) .to.equal(0);
			expect(parseDuration({valueOf(){ return 10; }})).to.equal(10);
			expect(parseDuration({valueOf(){ return 65; }})).to.equal(65);
		});
		
		it("converts temporal CSS units", () => {
			const seconds      = {[Symbol.toStringTag]: "CSSUnitValue", unit: "s"};
			const milliseconds = {[Symbol.toStringTag]: "CSSUnitValue", unit: "ms"};
			expect(parseDuration({...seconds,      value: 1}))  .to.equal(1000);
			expect(parseDuration({...seconds,      value: 2.5})).to.equal(2500);
			expect(parseDuration({...milliseconds, value: 1}))  .to.equal(1);
			expect(parseDuration({...milliseconds, value: 4.5})).to.equal(4.5);
			expect(parseDuration({...milliseconds, value: 200})).to.equal(200);
		});
		
		describe("ISO 8601 durations", () => {
			it("parses days", () => {
				expect(parseDuration("P1D")).to.equal(DAY * 1);
				expect(parseDuration("P2D")).to.equal(DAY * 2);
				expect(parseDuration("P3D")).to.equal(DAY * 3);
			});
			
			it("parses months", () => {
				const threshold = 0.000005;
				expect(parseDuration("P1M"))  .to.be.closeTo(YEAR / 12, threshold);
				expect(parseDuration("P2M"))  .to.be.closeTo(YEAR / 6,  threshold);
				expect(parseDuration("P3M"))  .to.be.closeTo(YEAR / 4,  threshold);
				expect(parseDuration("P6M"))  .to.be.closeTo(YEAR / 2,  threshold);
				expect(parseDuration("P12M")) .to.be.closeTo(YEAR / 1,  threshold);
				expect(parseDuration("P1M1D")).to.be.closeTo(YEAR / 12 + DAY * 1, threshold);
				expect(parseDuration("P1M2D")).to.be.closeTo(YEAR / 12 + DAY * 2, threshold);
				expect(parseDuration("P2M1D")).to.be.closeTo(YEAR / 6  + DAY * 1, threshold);
				expect(parseDuration("P2M2D")).to.be.closeTo(YEAR / 6  + DAY * 2, threshold);
				expect(parseDuration("P6M3D")).to.be.closeTo(YEAR / 2  + DAY * 3, threshold);
			});
			
			it("parses years", () => {
				const threshold = 0.00005;
				expect(parseDuration("P1Y"))    .to.equal(YEAR * 1);
				expect(parseDuration("P2Y"))    .to.equal(YEAR * 2);
				expect(parseDuration("P3Y"))    .to.equal(YEAR * 3);
				expect(parseDuration("P1Y1D"))  .to.equal(YEAR * 1 + DAY * 1);
				expect(parseDuration("P2Y2D"))  .to.equal(YEAR * 2 + DAY * 2);
				expect(parseDuration("P3Y6D"))  .to.equal(YEAR * 3 + DAY * 6);
				expect(parseDuration("P1Y6M"))  .to.be.closeTo(YEAR * 1 + YEAR / 2, threshold);
				expect(parseDuration("P2Y6M"))  .to.be.closeTo(YEAR * 2 + YEAR / 2, threshold);
				expect(parseDuration("P3Y4M"))  .to.be.closeTo(YEAR * 3 + YEAR / 3, threshold);
				expect(parseDuration("P1Y6M1D")).to.be.closeTo(YEAR * 1 + DAY * 1 + YEAR / 2, threshold);
				expect(parseDuration("P2Y6M2D")).to.be.closeTo(YEAR * 2 + DAY * 2 + YEAR / 2, threshold);
				expect(parseDuration("P3Y4M6D")).to.be.closeTo(YEAR * 3 + DAY * 6 + YEAR / 3, threshold);
			});
			
			it("parses hours", () => {
				for(let i = 1; i <= 24; expect(parseDuration(`PT${i}H`))  .to.equal(HOUR * i++));
				for(let i = 1; i <= 24; expect(parseDuration(`P1DT${i}H`)).to.equal(HOUR * i++ + DAY * 1));
				for(let i = 1; i <= 24; expect(parseDuration(`P8DT${i}H`)).to.equal(HOUR * i++ + DAY * 8));
			});
			
			it("parses minutes", () => {
				for(let i = 1; i <= 60; expect(parseDuration(`PT${i}M`))    .to.equal(MIN * i++));
				for(let i = 1; i <= 60; expect(parseDuration(`PT1H${i}M`))  .to.equal(MIN * i++ + HOUR * 1));
				for(let i = 1; i <= 60; expect(parseDuration(`PT6H${i}M`))  .to.equal(MIN * i++ + HOUR * 6));
				for(let i = 1; i <= 60; expect(parseDuration(`P1DT1H${i}M`)).to.equal(MIN * i++ + HOUR * 1 + DAY * 1));
				for(let i = 1; i <= 60; expect(parseDuration(`P8DT6H${i}M`)).to.equal(MIN * i++ + HOUR * 6 + DAY * 8));
				expect(parseDuration("P1MT1H1M")).to.be.closeTo(MIN * 1 + HOUR * 1 + YEAR / 12, 0.00005);
				expect(parseDuration("P2MT6H2M")).to.be.closeTo(MIN * 2 + HOUR * 6 + YEAR / 6,  0.00005);
			});
			
			it("parses seconds", () => {
				for(let i = 1; i <= 60; expect(parseDuration(`PT${i}S`))    .to.equal(SEC * i++));
				for(let i = 1; i <= 60; expect(parseDuration(`PT1M${i}S`))  .to.equal(SEC * i++ + MIN  * 1));
				for(let i = 1; i <= 60; expect(parseDuration(`PT5M${i}S`))  .to.equal(SEC * i++ + MIN  * 5));
				for(let i = 1; i <= 60; expect(parseDuration(`PT1H${i}S`))  .to.equal(SEC * i++ + HOUR * 1));
				for(let i = 1; i <= 60; expect(parseDuration(`PT6H${i}S`))  .to.equal(SEC * i++ + HOUR * 6));
				for(let i = 1; i <= 60; expect(parseDuration(`PT1H1M${i}S`)).to.equal(SEC * i++ + HOUR * 1 + MIN * 1));
				for(let i = 1; i <= 60; expect(parseDuration(`PT6H5M${i}S`)).to.equal(SEC * i++ + HOUR * 6 + MIN * 5));
				for(let i = 1; i <= 60; expect(parseDuration(`P1DT1H${i}S`)).to.equal(SEC * i++ + HOUR * 1 + DAY * 1));
				for(let i = 1; i <= 60; expect(parseDuration(`P8DT6H${i}S`)).to.equal(SEC * i++ + HOUR * 6 + DAY * 8));
				expect(parseDuration("P1MT1H1S")).to.be.closeTo(SEC * 1 + HOUR * 1 + YEAR / 12, 0.00005);
				expect(parseDuration("P2MT6H2S")).to.be.closeTo(SEC * 2 + HOUR * 6 + YEAR / 6,  0.00005);
			});
			
			it("parses weeks", () => {
				expect(parseDuration("P1W")).to.equal(WEEK * 1);
				expect(parseDuration("P2W")).to.equal(WEEK * 2);
				expect(parseDuration("P3W")).to.equal(WEEK * 3);
			});
			
			it("parses fractional values", () => {
				expect(parseDuration("P0.5Y")) .to.equal(YEAR * 0.5);
				expect(parseDuration("P0.05Y")).to.equal(YEAR * 0.05);
				expect(parseDuration("P0.5W")) .to.equal(WEEK * 0.5);
				expect(parseDuration("P1.5W")) .to.equal(WEEK * 1.5);
				expect(parseDuration("P1.25Y")).to.equal(YEAR * 1.25);
				expect(parseDuration("P0.05D")).to.equal(DAY  * 0.05);
				expect(parseDuration("P1.25D")).to.equal(DAY  * 1.25);
				expect(parseDuration("PT0.5H")).to.equal(HOUR * 0.5);
				expect(parseDuration("PT2.6H")).to.equal(HOUR * 2.6);
				expect(parseDuration("PT0.5M")).to.equal(MIN  * 0.5);
				expect(parseDuration("PT1.2M")).to.equal(MIN  * 1.2);
				expect(parseDuration("PT0.5S")).to.equal(SEC  * 0.5);
				expect(parseDuration("PT1.5S")).to.equal(SEC  * 1.5);
				expect(parseDuration("P0.5M")) .to.be.closeTo((YEAR / 12) * 0.5, 0.00005);
				expect(parseDuration("P1.3M")) .to.be.closeTo((YEAR / 12) * 1.3, 0.00005);
			});
			
			it("parses empty values", () => {
				expect(parseDuration("P0Y"))     .to.equal(0);
				expect(parseDuration("P0W"))     .to.equal(0);
				expect(parseDuration("P0M"))     .to.equal(0);
				expect(parseDuration("P0D"))     .to.equal(0);
				expect(parseDuration("PT0H"))    .to.equal(0);
				expect(parseDuration("PT0M"))    .to.equal(0);
				expect(parseDuration("PT0S"))    .to.equal(0);
				expect(parseDuration("P0.0YT0S")).to.equal(0);
				expect(parseDuration("P0.0MT0S")).to.equal(0);
				expect(parseDuration("P0.0DT0S")).to.equal(0);
				expect(parseDuration("P0DT0.0H")).to.equal(0);
				expect(parseDuration("P0DT0.0M")).to.equal(0);
				expect(parseDuration("P0DT0.0S")).to.equal(0);
			});
			
			it("rejects missing values", () => {
				expect(parseDuration("PY"))  .to.be.NaN;
				expect(parseDuration("PW"))  .to.be.NaN;
				expect(parseDuration("P1YM")).to.be.NaN;
				expect(parseDuration("P2YD")).to.be.NaN;
				expect(parseDuration("P1DT")).to.be.NaN;
				expect(parseDuration("P1MT")).to.be.NaN;
				expect(parseDuration("P1YT")).to.be.NaN;
			});
			
			it("parses case-insensitively", () => {
				expect(parseDuration("p1d")) .to.equal(DAY);
				expect(parseDuration("P1d")) .to.equal(DAY);
				expect(parseDuration("pT1S")).to.equal(SEC);
				expect(parseDuration("Pt1s")).to.equal(SEC);
				expect(parseDuration("p1W")) .to.equal(WEEK);
				expect(parseDuration("P1w")) .to.equal(WEEK);
			});
		});
	
		describe("English quantities", function(){
			this.slow(500);
			const test = (units, power, fuzz = 0) => {
				units.push(...units.filter(x => "Ms" !== x && x.length > 1).map(x => x + "s"));
				for(const unit of units)
				for(const name of [unit, unit.toLowerCase(), unit.toUpperCase()])
				for(let s = ""; s.length < 4; s += " ")
				for(let i = 0; i <= 100; ++i){
					const str = i + s + name;
					const exp = i * power;
					const msg = `Expected "${str}" to be parsed as ${exp}`;
					fuzz
						? expect(parseDuration(str), msg).to.be.closeTo(exp, fuzz)
						: expect(parseDuration(str), msg).to.equal(exp);
				}
			};
			it("parses milliseconds",   () => test(["Ms", "Millisecond"],  1));
			it("parses seconds",        () => test(["S", "Sec", "Second"], SEC));
			it("parses minutes",        () => test(["M", "Min", "Minute"], MIN));
			it("parses hours",          () => test(["H", "Hr",  "Hour"],   HOUR));
			it("parses days",           () => test(["D", "Da",  "Day"],    DAY));
			it("parses weeks",          () => test(["W", "Wk",  "Week"],   DAY * 7));
			it("parses months",         () => test(["Month"],              YEAR / 12));
			it("parses years",          () => test(["Y", "Yr",  "Year"],   YEAR));
			it("parses fortnights",     () => test(["Fortnight"],          DAY * 14));
			it("rejects unknown units", () => {
				expect(parseDuration("1xyz")).to.be.NaN;
				expect(parseDuration("2sz")) .to.be.NaN;
				expect(parseDuration("3msz")).to.be.NaN;
			});
			it("rejects unitless values", () => {
				expect(parseDuration("0")) .to.be.NaN;
				expect(parseDuration("40")).to.be.NaN;
			});
			it("accepts multiple values", () => {
				expect(parseDuration("1 min 2 sec"))        .to.equal(MIN  + SEC * 2);
				expect(parseDuration("1 min, 2 sec"))       .to.equal(MIN  + SEC * 2);
				expect(parseDuration("1 min; 2 sec"))       .to.equal(MIN  + SEC * 2);
				expect(parseDuration("1 minute 2 seconds")) .to.equal(MIN  + SEC * 2);
				expect(parseDuration("1 minute, 2 seconds")).to.equal(MIN  + SEC * 2);
				expect(parseDuration("1 hour, 43 seconds")) .to.equal(HOUR + SEC * 43);
				expect(parseDuration("3 hours and 1 day"))  .to.equal(DAY  + HOUR * 3);
				expect(parseDuration("1 day, 2 hours, 3s")) .to.equal(DAY  + HOUR * 2 + SEC * 3);
				expect(parseDuration("1 hour; 1m, 4 sec"))  .to.equal(MIN  + HOUR * 1 + SEC * 4);
				expect(parseDuration("1m, , 4 seconds"))    .to.equal(MIN  + SEC * 4);
			});
			it("accepts negative values", () => {
				expect(parseDuration("-30ms"))     .to.equal(-30);
				expect(parseDuration("-4s"))       .to.equal(-SEC * 4);
				expect(parseDuration("-1 minute")) .to.equal(-MIN);
				expect(parseDuration("1 hour;-2s")).to.equal(HOUR + -SEC * 2);
			});
			it("trims whitespace", () => {
				expect(parseDuration(" 1 min")).to.equal(MIN);
				expect(parseDuration("1 min ")).to.equal(MIN);
				expect(parseDuration(" 1min ")).to.equal(MIN);
			});
		});
	});
	
	describe("parsePrimitive()", () => {
		const {parsePrimitive} = utils;
		const parse = (input, expected, at) => expect(parsePrimitive(input, at)).to.eql(expected);
		
		it("returns null for non-primitives", () => {
			parse("Nah", null);
			parse("",    null);
			parse("{}",  null);
			parse("/?",  null);
		});
		
		it("doesn't evaluate its input", () => {
			parse("2 + 3", null);
			parse("(() => { while(true); })()", null);
		});
		
		it("parses booleans", () => {
			parse("true",      {name: "true",  type: Boolean, value: true});
			parse("false",     {name: "false", type: Boolean, value: false});
		});
		
		it("parses nullish values", () => {
			parse("null",      {name: "null",      type: null,      value: null});
			parse("undefined", {name: "undefined", type: undefined, value: undefined});
		});
		
		it("parses strings", () => {
			parse('"Foo"',        {type: String, delimiter: '"', value: "Foo"});
			parse("'Foo'",        {type: String, delimiter: "'", value: "Foo"});
			parse("`Foo`",        {type: String, delimiter: "`", value: "Foo"});
			parse('"Fo\\"o"',     {type: String, delimiter: '"', value: 'Fo"o'});
			parse("'Fo\\'o'",     {type: String, delimiter: "'", value: "Fo'o"});
			parse("`Fo\\`o`",     {type: String, delimiter: "`", value: "Fo`o"});
			parse('"Fo\\.\\"o"',  {type: String, delimiter: '"', value: 'Fo."o'});
			parse("'Fo\\.\\'o'",  {type: String, delimiter: "'", value: "Fo.'o"});
			parse("`Fo\\.\\`o`",  {type: String, delimiter: "`", value: "Fo.`o"});
			parse('"Fo\\\\\\"o"', {type: String, delimiter: '"', value: 'Fo\\"o'});
			parse("'Fo\\\\\\'o'", {type: String, delimiter: "'", value: "Fo\\'o"});
			parse("`Fo\\\\\\`o`", {type: String, delimiter: "`", value: "Fo\\`o"});
		});
		
		it("parses numbers in base-2", () => {
			parse("0b10001",  {type: Number, value:  0b10001});
			parse("0B10001",  {type: Number, value:  0b10001});
			parse("0b1_001",  {type: Number, value:  0b1001});
			parse("0B1_001",  {type: Number, value:  0b1001});
			parse("0b1_0_1",  {type: Number, value:  0b101});
			parse("0B1_0_1",  {type: Number, value:  0b101});
			parse("+0b10001", {type: Number, value:  0b10001});
			parse("+0B10001", {type: Number, value:  0b10001});
			parse("+0b1_001", {type: Number, value:  0b1001});
			parse("+0B1_001", {type: Number, value:  0b1001});
			parse("+0b1_0_1", {type: Number, value:  0b101});
			parse("+0B1_0_1", {type: Number, value:  0b101});
			parse("-0b10001", {type: Number, value: -0b10001});
			parse("-0B10001", {type: Number, value: -0b10001});
			parse("-0b1_001", {type: Number, value: -0b1001});
			parse("-0B1_001", {type: Number, value: -0b1001});
			parse("-0b1_0_1", {type: Number, value: -0b101});
			parse("-0B1_0_1", {type: Number, value: -0b101});
		});
		
		it("parses numbers in base-8", () => {
			parse("0o024",    {type: Number, value:  0o024});
			parse("0O024",    {type: Number, value:  0o024});
			parse("0o4670",   {type: Number, value:  0o4670});
			parse("0O4670",   {type: Number, value:  0o4670});
			parse("0o4_67",   {type: Number, value:  0o467});
			parse("0O4_67",   {type: Number, value:  0o467});
			parse("0o4_6_7",  {type: Number, value:  0o467});
			parse("0O4_6_7",  {type: Number, value:  0o467});
			parse("+0o024",   {type: Number, value:  0o024});
			parse("+0O024",   {type: Number, value:  0o024});
			parse("+0o4670",  {type: Number, value:  0o4670});
			parse("+0O4670",  {type: Number, value:  0o4670});
			parse("+0o4_67",  {type: Number, value:  0o467});
			parse("+0O4_67",  {type: Number, value:  0o467});
			parse("+0o4_6_7", {type: Number, value:  0o467});
			parse("+0O4_6_7", {type: Number, value:  0o467});
			parse("-0o024",   {type: Number, value: -0o024});
			parse("-0O024",   {type: Number, value: -0o024});
			parse("-0o4670",  {type: Number, value: -0o4670});
			parse("-0O4670",  {type: Number, value: -0o4670});
			parse("-0o4_67",  {type: Number, value: -0o467});
			parse("-0O4_67",  {type: Number, value: -0o467});
			parse("-0o4_6_7", {type: Number, value: -0o467});
			parse("-0O4_6_7", {type: Number, value: -0o467});
		});
		
		it("parses numbers in base-10", () => {
			// Integers
			parse("0",        {type: Number, value:  0});
			parse("+0",       {type: Number, value: +0});
			parse("-0",       {type: Number, value: -0});
			parse("5",        {type: Number, value:  5});
			parse("+5",       {type: Number, value: +5});
			parse("-5",       {type: Number, value: -5});
			parse("567",      {type: Number, value:  567});
			parse("+567",     {type: Number, value: +567});
			parse("-567",     {type: Number, value: -567});
			parse("1_0",      {type: Number, value:  10});
			parse("+1_0",     {type: Number, value: +10});
			parse("-1_0",     {type: Number, value: -10});
			parse("5_3",      {type: Number, value:  53});
			parse("+5_3",     {type: Number, value: +53});
			parse("-5_3",     {type: Number, value: -53});
			parse("56_7",     {type: Number, value:  567});
			parse("+56_7",    {type: Number, value: +567});
			parse("-56_7",    {type: Number, value: -567});
			
			// Floats
			parse("5.7",      {type: Number, value:  5.7});
			parse("+5.7",     {type: Number, value: +5.7});
			parse("-5.7",     {type: Number, value: -5.7});
			parse(".7",       {type: Number, value:  0.7});
			parse("+.7",      {type: Number, value: +0.7});
			parse("-.7",      {type: Number, value: -0.7});
			parse("5.7_3",    {type: Number, value:  5.73});
			parse("+5.7_3",   {type: Number, value: +5.73});
			parse("-5.7_3",   {type: Number, value: -5.73});
			parse(".7_3",     {type: Number, value:  0.73});
			parse("+.7_3",    {type: Number, value: +0.73});
			parse("-.7_3",    {type: Number, value: -0.73});
			parse("5_3.7",    {type: Number, value:  53.7});
			parse("+5_3.7",   {type: Number, value: +53.7});
			parse("-5_3.7",   {type: Number, value: -53.7});
			parse("5_3.7_6",  {type: Number, value:  53.76});
			parse("+5_3.7_6", {type: Number, value: +53.76});
			parse("-5_3.7_6", {type: Number, value: -53.76});
		});
		
		it("parses numbers in base-16", () => {
			parse("0xBAAAD",  {type: Number, value:  0xBAAAD});
			parse("0XBAAAD",  {type: Number, value:  0xBAAAD});
			parse("0xD_AB4",  {type: Number, value:  0xDAB4});
			parse("0XD_AB4",  {type: Number, value:  0xDAB4});
			parse("0xD_A_D",  {type: Number, value:  0xDAD});
			parse("0XD_A_D",  {type: Number, value:  0xDAD});
			parse("+0xBAAAD", {type: Number, value: +0xBAAAD});
			parse("+0XBAAAD", {type: Number, value: +0xBAAAD});
			parse("+0xD_AB4", {type: Number, value: +0xDAB4});
			parse("+0XD_AB4", {type: Number, value: +0xDAB4});
			parse("+0xD_A_D", {type: Number, value: +0xDAD});
			parse("+0XD_A_D", {type: Number, value: +0xDAD});
			parse("-0xBAAAD", {type: Number, value: -0xBAAAD});
			parse("-0XBAAAD", {type: Number, value: -0xBAAAD});
			parse("-0xD_AB4", {type: Number, value: -0xDAB4});
			parse("-0XD_AB4", {type: Number, value: -0xDAB4});
			parse("-0xD_A_D", {type: Number, value: -0xDAD});
			parse("-0XD_A_D", {type: Number, value: -0xDAD});
		});
		
		it("parses bigints in base-2", () => {
			parse("0b10001n",  {type: BigInt, value:  0b10001n});
			parse("0B10001n",  {type: BigInt, value:  0b10001n});
			parse("0b1_001n",  {type: BigInt, value:  0b1001n});
			parse("0B1_001n",  {type: BigInt, value:  0b1001n});
			parse("0b1_0_1n",  {type: BigInt, value:  0b101n});
			parse("0B1_0_1n",  {type: BigInt, value:  0b101n});
			parse("-0b10001n", {type: BigInt, value: -0b10001n});
			parse("-0B10001n", {type: BigInt, value: -0b10001n});
			parse("-0b1_001n", {type: BigInt, value: -0b1001n});
			parse("-0B1_001n", {type: BigInt, value: -0b1001n});
			parse("-0b1_0_1n", {type: BigInt, value: -0b101n});
			parse("-0B1_0_1n", {type: BigInt, value: -0b101n});
		});
		
		it("parses bigints in base-8", () => {
			parse("0o024n",    {type: BigInt, value:  0o024n});
			parse("0O024n",    {type: BigInt, value:  0o024n});
			parse("0o4670n",   {type: BigInt, value:  0o4670n});
			parse("0O4670n",   {type: BigInt, value:  0o4670n});
			parse("0o4_67n",   {type: BigInt, value:  0o467n});
			parse("0O4_67n",   {type: BigInt, value:  0o467n});
			parse("0o4_6_7n",  {type: BigInt, value:  0o467n});
			parse("0O4_6_7n",  {type: BigInt, value:  0o467n});
			parse("-0o024n",   {type: BigInt, value: -0o024n});
			parse("-0O024n",   {type: BigInt, value: -0o024n});
			parse("-0o4670n",  {type: BigInt, value: -0o4670n});
			parse("-0O4670n",  {type: BigInt, value: -0o4670n});
			parse("-0o4_67n",  {type: BigInt, value: -0o467n});
			parse("-0O4_67n",  {type: BigInt, value: -0o467n});
			parse("-0o4_6_7n", {type: BigInt, value: -0o467n});
			parse("-0O4_6_7n", {type: BigInt, value: -0o467n});
		});
		
		it("parses bigints in base-10", () => {
			parse("0n",        {type: BigInt, value:  0n});
			parse("-0n",       {type: BigInt, value: -0n});
			parse("5n",        {type: BigInt, value:  5n});
			parse("-5n",       {type: BigInt, value: -5n});
			parse("567n",      {type: BigInt, value:  567n});
			parse("-567n",     {type: BigInt, value: -567n});
			parse("1_0n",      {type: BigInt, value:  10n});
			parse("-1_0n",     {type: BigInt, value: -10n});
			parse("5_3n",      {type: BigInt, value:  53n});
			parse("-5_3n",     {type: BigInt, value: -53n});
			parse("56_7n",     {type: BigInt, value:  567n});
			parse("-56_7n",    {type: BigInt, value: -567n});
		});
		
		it("parses bigints in base-16", () => {
			parse("0xBAAADn",  {type: BigInt, value:  0xBAAADn});
			parse("0XBAAADn",  {type: BigInt, value:  0xBAAADn});
			parse("0xD_AB4n",  {type: BigInt, value:  0xDAB4n});
			parse("0XD_AB4n",  {type: BigInt, value:  0xDAB4n});
			parse("0xD_A_Dn",  {type: BigInt, value:  0xDADn});
			parse("0XD_A_Dn",  {type: BigInt, value:  0xDADn});
			parse("-0xBAAADn", {type: BigInt, value: -0xBAAADn});
			parse("-0XBAAADn", {type: BigInt, value: -0xBAAADn});
			parse("-0xD_AB4n", {type: BigInt, value: -0xDAB4n});
			parse("-0XD_AB4n", {type: BigInt, value: -0xDAB4n});
			parse("-0xD_A_Dn", {type: BigInt, value: -0xDADn});
			parse("-0XD_A_Dn", {type: BigInt, value: -0xDADn});
		});
		
		it("parses exponential integers", () => {
			// Unsigned
			parse("5e1",      {type: Number, value:  5e1});
			parse("+5e1",     {type: Number, value: +5e1});
			parse("-5e1",     {type: Number, value: -5e1});
			parse("5E1",      {type: Number, value:  5e1});
			parse("+5E1",     {type: Number, value: +5e1});
			parse("-5E1",     {type: Number, value: -5e1});
			parse("5e1_3",    {type: Number, value:  5e13});
			parse("+5e1_3",   {type: Number, value: +5e13});
			parse("-5e1_3",   {type: Number, value: -5e13});
			parse("5E1_3",    {type: Number, value:  5e13});
			parse("+5E1_3",   {type: Number, value: +5e13});
			parse("-5E1_3",   {type: Number, value: -5e13});
			parse("5_8e1",    {type: Number, value:  58e1});
			parse("+5_8e1",   {type: Number, value: +58e1});
			parse("-5_8e1",   {type: Number, value: -58e1});
			parse("5_8E1",    {type: Number, value:  58e1});
			parse("+5_8E1",   {type: Number, value: +58e1});
			parse("-5_8E1",   {type: Number, value: -58e1});
			parse("5_8e1_3",  {type: Number, value:  58e13});
			parse("+5_8e1_3", {type: Number, value: +58e13});
			parse("-5_8e1_3", {type: Number, value: -58e13});
			parse("5_8E1_3",  {type: Number, value:  58e13});
			parse("+5_8E1_3", {type: Number, value: +58e13});
			parse("-5_8E1_3", {type: Number, value: -58e13});
			
			// Signed, positive
			parse("5e+2",      {type: Number, value:  5e2});
			parse("+5e+2",     {type: Number, value: +5e2});
			parse("-5e+2",     {type: Number, value: -5e2});
			parse("5E+2",      {type: Number, value:  5e2});
			parse("+5E+2",     {type: Number, value: +5e2});
			parse("-5E+2",     {type: Number, value: -5e2});
			parse("5e+2_3",    {type: Number, value:  5e23});
			parse("+5e+2_3",   {type: Number, value: +5e23});
			parse("-5e+2_3",   {type: Number, value: -5e23});
			parse("5E+2_3",    {type: Number, value:  5e23});
			parse("+5E+2_3",   {type: Number, value: +5e23});
			parse("-5E+2_3",   {type: Number, value: -5e23});
			parse("5_8e+2",    {type: Number, value:  58e2});
			parse("+5_8e+2",   {type: Number, value: +58e2});
			parse("-5_8e+2",   {type: Number, value: -58e2});
			parse("5_8E+2",    {type: Number, value:  58e2});
			parse("+5_8E+2",   {type: Number, value: +58e2});
			parse("-5_8E+2",   {type: Number, value: -58e2});
			parse("5_8e+2_3",  {type: Number, value:  58e23});
			parse("+5_8e+2_3", {type: Number, value: +58e23});
			parse("-5_8e+2_3", {type: Number, value: -58e23});
			parse("5_8E+2_3",  {type: Number, value:  58e23});
			parse("+5_8E+2_3", {type: Number, value: +58e23});
			parse("-5_8E+2_3", {type: Number, value: -58e23});
			
			// Signed, negative
			parse("5e-2",      {type: Number, value:  5e-2});
			parse("+5e-2",     {type: Number, value: +5e-2});
			parse("-5e-2",     {type: Number, value: -5e-2});
			parse("5E-2",      {type: Number, value:  5e-2});
			parse("+5E-2",     {type: Number, value: +5e-2});
			parse("-5E-2",     {type: Number, value: -5e-2});
			parse("5e-2_3",    {type: Number, value:  5e-23});
			parse("+5e-2_3",   {type: Number, value: +5e-23});
			parse("-5e-2_3",   {type: Number, value: -5e-23});
			parse("5E-2_3",    {type: Number, value:  5e-23});
			parse("+5E-2_3",   {type: Number, value: +5e-23});
			parse("-5E-2_3",   {type: Number, value: -5e-23});
			parse("5_8e-2",    {type: Number, value:  58e-2});
			parse("+5_8e-2",   {type: Number, value: +58e-2});
			parse("-5_8e-2",   {type: Number, value: -58e-2});
			parse("5_8E-2",    {type: Number, value:  58e-2});
			parse("+5_8E-2",   {type: Number, value: +58e-2});
			parse("-5_8E-2",   {type: Number, value: -58e-2});
			parse("5_8e-2_3",  {type: Number, value:  58e-23});
			parse("+5_8e-2_3", {type: Number, value: +58e-23});
			parse("-5_8e-2_3", {type: Number, value: -58e-23});
			parse("5_8E-2_3",  {type: Number, value:  58e-23});
			parse("+5_8E-2_3", {type: Number, value: +58e-23});
			parse("-5_8E-2_3", {type: Number, value: -58e-23});
		});
		
		it("parses exponential floats", () => {
			// Unsigned
			parse("5.7e1",        {type: Number, value:  5.7e1});
			parse("+5.7e1",       {type: Number, value: +5.7e1});
			parse("-5.7e1",       {type: Number, value: -5.7e1});
			parse("5.7E1",        {type: Number, value:  5.7e1});
			parse("+5.7E1",       {type: Number, value: +5.7e1});
			parse("-5.7E1",       {type: Number, value: -5.7e1});
			parse(".7e2",         {type: Number, value:  0.7e2});
			parse("+.7e2",        {type: Number, value: +0.7e2});
			parse("-.7e2",        {type: Number, value: -0.7e2});
			parse(".7E2",         {type: Number, value:  0.7e2});
			parse("+.7E2",        {type: Number, value: +0.7e2});
			parse("-.7E2",        {type: Number, value: -0.7e2});
			parse("5.7e1_3",      {type: Number, value:  5.7e13});
			parse("+5.7e1_3",     {type: Number, value: +5.7e13});
			parse("-5.7e1_3",     {type: Number, value: -5.7e13});
			parse("5.7E1_3",      {type: Number, value:  5.7e13});
			parse("+5.7E1_3",     {type: Number, value: +5.7e13});
			parse("-5.7E1_3",     {type: Number, value: -5.7e13});
			parse(".7e2_3",       {type: Number, value:  0.7e23});
			parse("+.7e2_3",      {type: Number, value: +0.7e23});
			parse("-.7e2_3",      {type: Number, value: -0.7e23});
			parse(".7E2_3",       {type: Number, value:  0.7e23});
			parse("+.7E2_3",      {type: Number, value: +0.7e23});
			parse("-.7E2_3",      {type: Number, value: -0.7e23});
			parse("5.7_4e1",      {type: Number, value:  5.74e1});
			parse("+5.7_4e1",     {type: Number, value: +5.74e1});
			parse("-5.7_4e1",     {type: Number, value: -5.74e1});
			parse("5.7_4E1",      {type: Number, value:  5.74e1});
			parse("+5.7_4E1",     {type: Number, value: +5.74e1});
			parse("-5.7_4E1",     {type: Number, value: -5.74e1});
			parse(".7_4e2",       {type: Number, value:  0.74e2});
			parse("+.7_4e2",      {type: Number, value: +0.74e2});
			parse("-.7_4e2",      {type: Number, value: -0.74e2});
			parse(".7_4E2",       {type: Number, value:  0.74e2});
			parse("+.7_4E2",      {type: Number, value: +0.74e2});
			parse("-.7_4E2",      {type: Number, value: -0.74e2});
			parse("5.7_4e1_9",    {type: Number, value:  5.74e19});
			parse("+5.7_4e1_9",   {type: Number, value: +5.74e19});
			parse("-5.7_4e1_9",   {type: Number, value: -5.74e19});
			parse("5.7_4E1_9",    {type: Number, value:  5.74e19});
			parse("+5.7_4E1_9",   {type: Number, value: +5.74e19});
			parse("-5.7_4E1_9",   {type: Number, value: -5.74e19});
			parse("5_8.7_4e1_9",  {type: Number, value:  58.74e19});
			parse("+5_8.7_4e1_9", {type: Number, value: +58.74e19});
			parse("-5_8.7_4e1_9", {type: Number, value: -58.74e19});
			parse("5_8.7_4E1_9",  {type: Number, value:  58.74e19});
			parse("+5_8.7_4E1_9", {type: Number, value: +58.74e19});
			parse("-5_8.7_4E1_9", {type: Number, value: -58.74e19});
			
			// Signed, positive
			parse("5.7e+1",        {type: Number, value:  5.7e1});
			parse("+5.7e+1",       {type: Number, value: +5.7e1});
			parse("-5.7e+1",       {type: Number, value: -5.7e1});
			parse("5.7E+1",        {type: Number, value:  5.7e1});
			parse("+5.7E+1",       {type: Number, value: +5.7e1});
			parse("-5.7E+1",       {type: Number, value: -5.7e1});
			parse(".7e+2",         {type: Number, value:  0.7e2});
			parse("+.7e+2",        {type: Number, value: +0.7e2});
			parse("-.7e+2",        {type: Number, value: -0.7e2});
			parse(".7E+2",         {type: Number, value:  0.7e2});
			parse("+.7E+2",        {type: Number, value: +0.7e2});
			parse("-.7E+2",        {type: Number, value: -0.7e2});
			parse("5.7e+1_3",      {type: Number, value:  5.7e13});
			parse("+5.7e+1_3",     {type: Number, value: +5.7e13});
			parse("-5.7e+1_3",     {type: Number, value: -5.7e13});
			parse("5.7E+1_3",      {type: Number, value:  5.7e13});
			parse("+5.7E+1_3",     {type: Number, value: +5.7e13});
			parse("-5.7E+1_3",     {type: Number, value: -5.7e13});
			parse(".7e+2_3",       {type: Number, value:  0.7e23});
			parse("+.7e+2_3",      {type: Number, value: +0.7e23});
			parse("-.7e+2_3",      {type: Number, value: -0.7e23});
			parse(".7E+2_3",       {type: Number, value:  0.7e23});
			parse("+.7E+2_3",      {type: Number, value: +0.7e23});
			parse("-.7E+2_3",      {type: Number, value: -0.7e23});
			parse("5.7_4e+1",      {type: Number, value:  5.74e1});
			parse("+5.7_4e+1",     {type: Number, value: +5.74e1});
			parse("-5.7_4e+1",     {type: Number, value: -5.74e1});
			parse("5.7_4E+1",      {type: Number, value:  5.74e1});
			parse("+5.7_4E+1",     {type: Number, value: +5.74e1});
			parse("-5.7_4E+1",     {type: Number, value: -5.74e1});
			parse(".7_4e+2",       {type: Number, value:  0.74e2});
			parse("+.7_4e+2",      {type: Number, value: +0.74e2});
			parse("-.7_4e+2",      {type: Number, value: -0.74e2});
			parse(".7_4E+2",       {type: Number, value:  0.74e2});
			parse("+.7_4E+2",      {type: Number, value: +0.74e2});
			parse("-.7_4E+2",      {type: Number, value: -0.74e2});
			parse("5.7_4e+1_9",    {type: Number, value:  5.74e19});
			parse("+5.7_4e+1_9",   {type: Number, value: +5.74e19});
			parse("-5.7_4e+1_9",   {type: Number, value: -5.74e19});
			parse("5.7_4E+1_9",    {type: Number, value:  5.74e19});
			parse("+5.7_4E+1_9",   {type: Number, value: +5.74e19});
			parse("-5.7_4E+1_9",   {type: Number, value: -5.74e19});
			parse("5_8.7_4e+1_9",  {type: Number, value:  58.74e19});
			parse("+5_8.7_4e+1_9", {type: Number, value: +58.74e19});
			parse("-5_8.7_4e+1_9", {type: Number, value: -58.74e19});
			parse("5_8.7_4E+1_9",  {type: Number, value:  58.74e19});
			parse("+5_8.7_4E+1_9", {type: Number, value: +58.74e19});
			parse("-5_8.7_4E+1_9", {type: Number, value: -58.74e19});
			
			// Signed, negative
			parse("5.7e-1",        {type: Number, value:  5.7e-1});
			parse("+5.7e-1",       {type: Number, value: +5.7e-1});
			parse("-5.7e-1",       {type: Number, value: -5.7e-1});
			parse("5.7E-1",        {type: Number, value:  5.7e-1});
			parse("+5.7E-1",       {type: Number, value: +5.7e-1});
			parse("-5.7E-1",       {type: Number, value: -5.7e-1});
			parse(".7e-2",         {type: Number, value:  0.7e-2});
			parse("+.7e-2",        {type: Number, value: +0.7e-2});
			parse("-.7e-2",        {type: Number, value: -0.7e-2});
			parse(".7E-2",         {type: Number, value:  0.7e-2});
			parse("+.7E-2",        {type: Number, value: +0.7e-2});
			parse("-.7E-2",        {type: Number, value: -0.7e-2});
			parse("5.7e-1_3",      {type: Number, value:  5.7e-13});
			parse("+5.7e-1_3",     {type: Number, value: +5.7e-13});
			parse("-5.7e-1_3",     {type: Number, value: -5.7e-13});
			parse("5.7E-1_3",      {type: Number, value:  5.7e-13});
			parse("+5.7E-1_3",     {type: Number, value: +5.7e-13});
			parse("-5.7E-1_3",     {type: Number, value: -5.7e-13});
			parse(".7e-2_3",       {type: Number, value:  0.7e-23});
			parse("+.7e-2_3",      {type: Number, value: +0.7e-23});
			parse("-.7e-2_3",      {type: Number, value: -0.7e-23});
			parse(".7E-2_3",       {type: Number, value:  0.7e-23});
			parse("+.7E-2_3",      {type: Number, value: +0.7e-23});
			parse("-.7E-2_3",      {type: Number, value: -0.7e-23});
			parse("5.7_4e-1",      {type: Number, value:  5.74e-1});
			parse("+5.7_4e-1",     {type: Number, value: +5.74e-1});
			parse("-5.7_4e-1",     {type: Number, value: -5.74e-1});
			parse("5.7_4E-1",      {type: Number, value:  5.74e-1});
			parse("+5.7_4E-1",     {type: Number, value: +5.74e-1});
			parse("-5.7_4E-1",     {type: Number, value: -5.74e-1});
			parse(".7_4e-2",       {type: Number, value:  0.74e-2});
			parse("+.7_4e-2",      {type: Number, value: +0.74e-2});
			parse("-.7_4e-2",      {type: Number, value: -0.74e-2});
			parse(".7_4E-2",       {type: Number, value:  0.74e-2});
			parse("+.7_4E-2",      {type: Number, value: +0.74e-2});
			parse("-.7_4E-2",      {type: Number, value: -0.74e-2});
			parse("5.7_4e-1_9",    {type: Number, value:  5.74e-19});
			parse("+5.7_4e-1_9",   {type: Number, value: +5.74e-19});
			parse("-5.7_4e-1_9",   {type: Number, value: -5.74e-19});
			parse("5.7_4E-1_9",    {type: Number, value:  5.74e-19});
			parse("+5.7_4E-1_9",   {type: Number, value: +5.74e-19});
			parse("-5.7_4E-1_9",   {type: Number, value: -5.74e-19});
			parse("5_8.7_4e-1_9",  {type: Number, value:  58.74e-19});
			parse("+5_8.7_4e-1_9", {type: Number, value: +58.74e-19});
			parse("-5_8.7_4e-1_9", {type: Number, value: -58.74e-19});
			parse("5_8.7_4E-1_9",  {type: Number, value:  58.74e-19});
			parse("+5_8.7_4E-1_9", {type: Number, value: +58.74e-19});
			parse("-5_8.7_4E-1_9", {type: Number, value: -58.74e-19});
		});
	
		it("parses NaN", () => {
			parse("NaN",  {type: Number, name: "NaN", value: NaN});
			parse("+NaN", {type: Number, name: "NaN", value: NaN});
			parse("-NaN", {type: Number, name: "NaN", value: NaN});
		});
		
		it("parses infinity", () => {
			parse("Infinity",  {type: Number, name: "Infinity", value:  Infinity});
			parse("+Infinity", {type: Number, name: "Infinity", value:  Infinity});
			parse("-Infinity", {type: Number, name: "Infinity", value: -Infinity});
		});
		
		it("parses symbols", () => {
			parse("Symbol(foo)", {type: Symbol, name: "foo", value: Symbol.for("foo")});
			parse("@@foo", {type: Symbol, name: "foo", value: Symbol.for("foo")}, true);
			parse("@@foo", null);
			parse("Symbol(Symbol.iterator)", {type: Symbol, name: "Symbol.iterator", value: Symbol.iterator});
			parse("@@iterator", {type: Symbol, name: "iterator", value: Symbol.iterator}, true);
			parse("@@iterator", null);
		});
		
		it("parses regular expressions", () => {
			parse("/a/",       {type: RegExp, value: /a/});
			parse("/a/i",      {type: RegExp, value: /a/i});
			parse("/1|2/g",    {type: RegExp, value: /1|2/g});
			parse("/(1|2)?a/", {type: RegExp, value: /(1|2)?a/});
			parse("/.+?/s",    {type: RegExp, value: /.+?/s});
			parse("/a/; /a/i", null);
			parse("/++/",      null);
			parse("/(/",       null);
		});
		
		it("trims whitespace before parsing", () => {
			parse(" true ",  {type: Boolean, value: true,  name: "true"});
			parse(" false ", {type: Boolean, value: false, name: "false"});
			parse(" null\n", {type: null,    value: null,  name: "null"});
			parse("\v\f0\n", {type: Number,  value: 0});
		});
	});
	
	describe("parseTime()", () => {
		const {parseTime} = utils;
		const expectError = input => {
			const escaped = String(input).replace(/\./g, "\\.");
			const message = new RegExp(`^Invalid timecode: "${escaped}"$`);
			expect(() => parseTime(input)).to.throw(SyntaxError, message);
		};
		
		describe("Milliseconds", () => {
			it("allows the component to be omitted", () => {
				expect(parseTime("00:00:00")).to.equal(0);
				expect(parseTime("00;00;00")).to.equal(0);
			});
			
			describe("Dot-separated", () => {
				it("parses 1-digit values",    () => expect(parseTime("00:00:00.1"))    .to.equal(100));
				it("parses 2-digit values",    () => expect(parseTime("00:00:00.25"))   .to.equal(250));
				it("parses 3-digit values",    () => expect(parseTime("00:00:00.200"))  .to.equal(200));
				it("parses leading zeroes",    () => expect(parseTime("00:00:00.03"))   .to.equal(30));
				it("parses trailing zeroes",   () => expect(parseTime("00:00:00.40"))   .to.equal(400));
				it("discards excess digits",   () => expect(parseTime("00:00:00.5009")) .to.equal(500));
				it("expects at least 1 digit", () => expectError("00:00:00."));
			});
			
			describe("Comma-separated", () => {
				it("parses 1-digit values",    () => expect(parseTime("00:00:00,1"))    .to.equal(100));
				it("parses 2-digit values",    () => expect(parseTime("00:00:00,25"))   .to.equal(250));
				it("parses 3-digit values",    () => expect(parseTime("00:00:00,200"))  .to.equal(200));
				it("parses leading zeroes",    () => expect(parseTime("00:00:00,03"))   .to.equal(30));
				it("parses trailing zeroes",   () => expect(parseTime("00:00:00,40"))   .to.equal(400));
				it("discards excess digits",   () => expect(parseTime("00:00:00,5009")) .to.equal(500));
				it("expects at least 1 digit", () => expectError("00:00:00,"));
			});
		});
		
		describe("Seconds", () => {
			describe("Colon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("00:00:1.000"))   .to.equal(1000));
				it("parses 2-digit values",     () => expect(parseTime("00:00:25.000"))  .to.equal(25000));
				it("parses values over 60",     () => expect(parseTime("00:00:90.000"))  .to.equal(90000));
				it("parses 3-digit values",     () => expect(parseTime("00:00:180.000")) .to.equal(180000));
				it("parses 4-digit values",     () => expect(parseTime("00:00:1024.000")).to.equal(1024000));
				it("parses leading zeroes",     () => expect(parseTime("00:00:0001.000")).to.equal(1000));
				it("parses trailing zeroes",    () => expect(parseTime("00:00:1000.000")).to.equal(1000000));
				it("forbids missing values",    () => expectError("00:00:.000"));
				it("forbids fractional values", () => expectError("00:00:1.5,000"));
			});
			
			describe("Semicolon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("00;00;1.000"))   .to.equal(1000));
				it("parses 2-digit values",     () => expect(parseTime("00;00;25.000"))  .to.equal(25000));
				it("parses values over 60",     () => expect(parseTime("00;00;90.000"))  .to.equal(90000));
				it("parses 3-digit values",     () => expect(parseTime("00;00;180.000")) .to.equal(180000));
				it("parses 4-digit values",     () => expect(parseTime("00;00;1024.000")).to.equal(1024000));
				it("parses leading zeroes",     () => expect(parseTime("00;00;0001.000")).to.equal(1000));
				it("parses trailing zeroes",    () => expect(parseTime("00;00;1000.000")).to.equal(1000000));
				it("allows mixed delimiters",   () => expect(parseTime("00:00;09.000"))  .to.equal(9000));
				it("forbids missing values",    () => expectError("00;00;.000"));
				it("forbids fractional values", () => expectError("00;00;1.5,000"));
			});
		});
		
		describe("Minutes", () => {
			describe("Colon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("00:1:00.000"))   .to.equal(60000));
				it("parses 2-digit values",     () => expect(parseTime("00:25:00.000"))  .to.equal(1500000));
				it("parses values over 60",     () => expect(parseTime("00:90:00.000"))  .to.equal(5400000));
				it("parses 3-digit values",     () => expect(parseTime("00:180:00.000")) .to.equal(10800000));
				it("parses 4-digit values",     () => expect(parseTime("00:1024:00.000")).to.equal(61440000));
				it("parses leading zeroes",     () => expect(parseTime("00:0001:00.000")).to.equal(60000));
				it("parses trailing zeroes",    () => expect(parseTime("00:1000:00.000")).to.equal(60000000));
				it("forbids missing values",    () => expectError("00::00.000"));
				it("forbids fractional values", () => expectError("00:1.5:00,000"));
			});
			
			describe("Semicolon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("00;1;00.000"))   .to.equal(60000));
				it("parses 2-digit values",     () => expect(parseTime("00;25;00.000"))  .to.equal(1500000));
				it("parses values over 60",     () => expect(parseTime("00;90;00.000"))  .to.equal(5400000));
				it("parses 3-digit values",     () => expect(parseTime("00;180;00.000")) .to.equal(10800000));
				it("parses 4-digit values",     () => expect(parseTime("00;1024;00.000")).to.equal(61440000));
				it("parses leading zeroes",     () => expect(parseTime("00;0001;00.000")).to.equal(60000));
				it("parses trailing zeroes",    () => expect(parseTime("00;1000;00.000")).to.equal(60000000));
				it("allows mixed delimiters",   () => expect(parseTime("00:09;00.000"))  .to.equal(540000));
				it("forbids missing values",    () => expectError("00;;00.000"));
				it("forbids fractional values", () => expectError("00;1.5;00,000"));
			});
		});
		
		describe("Hours", () => {
			describe("Colon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("1:00:00.000"))   .to.equal(3600000));
				it("parses 2-digit values",     () => expect(parseTime("25:00:00.000"))  .to.equal(90000000));
				it("parses values over 24",     () => expect(parseTime("48:00:00.000"))  .to.equal(172800000));
				it("parses 3-digit values",     () => expect(parseTime("180:00:00.000")) .to.equal(648000000));
				it("parses 4-digit values",     () => expect(parseTime("1024:00:00.000")).to.equal(3686400000));
				it("parses leading zeroes",     () => expect(parseTime("0001:00:00.000")).to.equal(3600000));
				it("parses trailing zeroes",    () => expect(parseTime("1000:00:00.000")).to.equal(3600000000));
				it("forbids fractional values", () => expectError("1.5:00:00,000"));
				it("allows missing values",     () => {
					expect(parseTime("15:00.000")).to.equal(900000);
					expect(parseTime("15:25"))    .to.equal(925000);
				});
				it("expects at least 1 digit", () => {
					expectError(":15:00.000");
					expectError(":15:25");
				});
			});
			
			describe("Semicolon-delimited", () => {
				it("parses 1-digit values",     () => expect(parseTime("1;00;00.000"))   .to.equal(3600000));
				it("parses 2-digit values",     () => expect(parseTime("25;00;00.000"))  .to.equal(90000000));
				it("parses values over 24",     () => expect(parseTime("48;00;00.000"))  .to.equal(172800000));
				it("parses 3-digit values",     () => expect(parseTime("180;00;00.000")) .to.equal(648000000));
				it("parses 4-digit values",     () => expect(parseTime("1024;00;00.000")).to.equal(3686400000));
				it("parses leading zeroes",     () => expect(parseTime("0001;00;00.000")).to.equal(3600000));
				it("parses trailing zeroes",    () => expect(parseTime("1000;00;00.000")).to.equal(3600000000));
				it("allows mixed delimiters",   () => expect(parseTime("09:00;00.000"))  .to.equal(32400000));
				it("forbids fractional values", () => expectError("1.5;00;00,000"));
				it("allows missing values",     () => {
					expect(parseTime("15;00.000")).to.equal(900000);
					expect(parseTime("15;25"))    .to.equal(925000);
				});
				it("expects at least 1 digit", () => {
					expectError(";15;00.000");
					expectError(";15;25");
				});
			});
		});
		
		describe("Invalid input", () => {
			it("rejects invalid formats",     () => expectError("Invalid"));
			it("rejects empty strings",       () => expectError(""));
			it("rejects non-string values",   () => expectError(false));
			it("trims leading whitespace",    () => expect(parseTime(" \t\n00:00:01.000")).to.equal(1000));
			it("trims trailing whitespace",   () => expect(parseTime("00:00:02.000 \t\n")).to.equal(2000));
			it("rejects embedded whitespace", () => expectError("00:00: 04.000"));
			it("rejects too many components", () => expectError("00:00:00:01.456"));
			it("stringifies before parsing",  () => {
				expect(parseTime({toString: () => "0:1.567"}))         .to.equal(1567);
				expect(parseTime({toString: () => "\n\t0:1.567\t\n"})) .to.equal(1567);
			});
		});
	});
	
	describe("parseURL()", () => {
		const {parseURL} = utils;
		const base = {
			auth:     "",
			filename: "",
			fragment: "",
			hostname: "",
			password: "",
			pathname: "",
			port:     null,
			protocol: "",
			query:    "",
			username: "",
		};
		it("parses empty or invalid input", () => {
			expect(parseURL("")).to.eql(base);
			expect(parseURL("\n\0")).to.eql(base);
		});
		it("parses protocols and hostnames", () =>
			expect(parseURL("https://github.com")).to.eql({
				...base,
				protocol: "https",
				hostname: "github.com",
			}));
		it("parses usernames", () => {
			const username = "Alhadis";
			expect(parseURL(`https://${username}@github.com`)).to.eql({
				...base,
				auth:     username + "@",
				protocol: "https",
				hostname: "github.com",
				username,
			});
		});
		it("parses passwords", () => {
			const username = "Alhadis";
			const password = "yeah-this-is-so-totally-my-real-password";
			expect(parseURL(`https://${username}:${password}@github.com`)).to.eql({
				...base,
				auth:     `${username}:${password}@`,
				protocol: "https",
				hostname: "github.com",
				username,
				password,
			});
		});
		it("parses port numbers", () => {
			expect(parseURL("wss://localhost:1337")).to.eql({
				...base,
				protocol: "wss",
				hostname: "localhost",
				port:     1337,
			});
		});
		it("parses pathnames", () => {
			expect(parseURL("https://github.com/")).to.eql({
				...base,
				protocol: "https",
				hostname: "github.com",
				pathname: "/",
			});
			expect(parseURL("http://something.com/dir/page.html")).to.eql({
				...base,
				protocol: "http",
				hostname: "something.com",
				pathname: "/dir/page.html",
				filename: "page.html",
			});
		});
		it("parses search queries", () => {
			const result = {
				...base,
				protocol: "https",
				hostname: "query.org",
				pathname: "/dir/page.html",
				filename: "page.html",
			};
			expect(parseURL("https://query.org/dir/page.html?a=b"))      .to.eql({...result, query: "?a=b"});
			expect(parseURL("https://query.org/dir/page.html?a=b/c"))    .to.eql({...result, query: "?a=b/c"});
			expect(parseURL("https://query.org/dir/page.html?a=b&d=e"))  .to.eql({...result, query: "?a=b&d=e"});
			expect(parseURL("https://query.org/dir/page.html?a=b&d=e/f")).to.eql({...result, query: "?a=b&d=e/f"});
		});
		it("parses fragment identifiers", () => {
			const url = "https://github.com/Alhadis/Utils";
			const result = {
				...base,
				protocol: "https",
				hostname: "github.com",
				pathname: "/Alhadis/Utils",
				filename: "Utils",
				fragment: "#utils",
			};
			expect(parseURL(url + "#utils"))     .to.eql(result);
			expect(parseURL(url + "?a=b#utils")) .to.eql({...result, query: "?a=b"});
			expect(parseURL(url + "#utils?a=b")) .to.eql({...result, fragment: "#utils?a=b"});
			expect(parseURL(url + "#utils/?a=b")).to.eql({...result, fragment: "#utils/?a=b"});
		});
		it("parses protocols without forward-slashes", () => {
			expect(parseURL("https:foo")).to.eql({
				...base,
				protocol: "https",
				hostname: "foo",
			});
			expect(parseURL("https:foo/bar")).to.eql({
				...base,
				protocol: "https",
				hostname: "foo",
				pathname: "/bar",
				filename: "bar",
			});
		});
		it("converts protocol names to lowercase", () => {
			const result = {...base, protocol: "https", hostname: "foo.com"};
			expect(parseURL("HTTPS://foo.com")).to.eql(result);
			expect(parseURL("HtTpS://foo.com")).to.eql(result);
			expect(parseURL("HtTpS:foo.com"))  .to.eql(result);
		});
		it("parses incomplete URLs", () => {
			expect(parseURL("foo"))     .to.eql({...base, hostname: "foo"});
			expect(parseURL("//foo"))   .to.eql({...base, hostname: "foo"});
			expect(parseURL("://foo"))  .to.eql({...base, hostname: "foo"});
			expect(parseURL("https://")).to.eql({...base, protocol: "https"});
		});
		it("parses incomplete URLs with paths", () => {
			const result = {...base, hostname: "foo", pathname: "/bar", filename: "bar"};
			expect(parseURL("foo/bar"))   .to.eql(result);
			expect(parseURL("//foo/bar")) .to.eql(result);
			expect(parseURL("://foo/bar")).to.eql(result);
		});
		it("parses system filepaths", () => {
			let result = {...base, pathname: "/usr/share/man/whatis", filename: "whatis"};
			expect(parseURL("/usr/share/man/whatis"))        .to.eql(result);
			expect(parseURL("/usr/share/man/whatis?a=b"))    .to.eql({...result, query: "?a=b"});
			expect(parseURL("/usr/share/man/whatis#foo"))    .to.eql({...result, fragment: "#foo"});
			expect(parseURL("/usr/share/man/whatis?a=b#foo")).to.eql({...result, query: "?a=b", fragment: "#foo"});
			
			result = {...base, hostname: "usr", pathname: "/share/man/whatis", filename: "whatis"};
			expect(parseURL("//usr/share/man/whatis"))        .to.eql(result);
			expect(parseURL("//usr/share/man/whatis?a=b"))    .to.eql({...result, query: "?a=b"});
			expect(parseURL("//usr/share/man/whatis#foo"))    .to.eql({...result, fragment: "#foo"});
			expect(parseURL("//usr/share/man/whatis?a=b#foo")).to.eql({...result, query: "?a=b", fragment: "#foo"});
		});
	});
	
	describe("rotate()", () => {
		const {rotate} = utils;
		describe("Character lists", () => {
			it("rotates single characters", () => {
				expect(rotate("\"A\"'B'`C`", "\"'`")).to.equal("'A'`B`\"C\"");
				expect(rotate("\"\"'\"\"",   "\"'")) .to.equal("''\"''");
				expect(rotate("That's it?",  "'’"))  .to.equal("That’s it?");
			});
			
			it("rotates paired characters", () => {
				expect(rotate("[A](B){C}", ["[]", "()", "{}"])).to.equal("(A){B}[C]");
				expect(rotate("[[(A)]]",   ["[]", "()"]))      .to.equal("(([A]))");
				expect(rotate("(] [)",     ["(]", "[)"]))      .to.equal("[) (]");
			});
			
			it("rotates paired strings", () => {
				const cmdSubst = [["$(", ")"], "``"];
				expect(rotate("$(a `b`)",    cmdSubst)).to.equal("`a $(b)`");
				expect(rotate("$(a $(b) c)", cmdSubst)).to.equal("`a `b` c`");
			});
			
			it("rotates arbitrary strings", () => {
				const input  = "<b>&quot;A&apos;ight&quot;</b>";
				const output = "<b>&apos;A&quot;ight&apos;</b>";
				expect(rotate(input, [["&quot;"],     ["&apos;"]]))    .to.equal(output);
				expect(rotate(input, [["&quot;", ""], ["&apos;", ""]])).to.equal(output);
				expect(rotate(input, [["", "&quot;"], ["", "&apos;"]])).to.equal(output);
			});
			
			it("rotates mixed-format strings", () => {
				const input  = "[ABC [[[XYZ]]] 123] ${456} (789)";
				const output = "(ABC (((XYZ))) 123) [456] ${789}";
				const chars  = [["[", "]"], "()", ["${", "}"]];
				expect(rotate(input, chars)).to.equal(output);
			});
			
			it("ignores empty string pairs", () => {
				expect(rotate("[]", ""))                    .to.equal("[]");
				expect(rotate("[]", [""]))                  .to.equal("[]");
				expect(rotate("[]", ["", ""]))              .to.equal("[]");
				expect(rotate("[]", [[]]))                  .to.equal("[]");
				expect(rotate("[]", [[], []]))              .to.equal("[]");
				expect(rotate("[]", [[""], [""]]))          .to.equal("[]");
				expect(rotate("[]", [["", ""], ["", ""]]))  .to.equal("[]");
				expect(rotate("[]", [["[", "]"], ""]))      .to.equal("[]");
				expect(rotate("[]", [["[", "]"], ["", ""]])).to.equal("[]");
			});
		});
		
		describe("Offsets", () => {
			const shadeChars = "<░▒▓█▓▒░>";
			const shadeLines = `
				<░▒▓█▓▒░>
				░▒▓█▓█▓▒<
				▒▓█▓▒▓█▓░
				▓█▓▒░▒▓█▒
				█▓▒░>░▒▓▓
				▓▒░><>░▒█
				▒░><░<>░▓
				░><░▒░<>▒
				><░▒▓▒░<░
				<░▒▓█▓▒░>
			`.trim().split(/\s+/);
			
			it("rotates by arbitrary offsets", () => {
				const lines = [];
				for(let i = 0; i <= shadeChars.length; ++i)
					lines.push(rotate(shadeChars, shadeChars, i));
				expect(lines).to.eql(shadeLines);
			});
			
			it("rotates in reverse", () => {
				const lines = [];
				for(let i = 0; i <= shadeChars.length; ++i)
					lines.push(rotate(shadeChars, shadeChars, -i));
				expect(lines).to.eql([...shadeLines].reverse());
			});
		});
	});
	
	describe("slug()", () => {
		const {slug} = utils;
		it("converts input to lowercase",      () => expect(slug("Foo")).to.equal("foo"));
		it("replaces whitespace with dashes",  () => expect(slug("Foo Bar")).to.equal("foo-bar"));
		it("replaces punctuation with dashes", () => expect(slug("Foo?!Bar")).to.equal("foo-bar"));
		it("merges multiple dashes into one",  () => expect(slug("Foo--Bar")).to.equal("foo-bar"));
		it("understands common contractions",  () => {
			expect(slug("Here's an ID string.")).to.equal("heres-an-id-string");
			expect(slug("Also, how're you?")).to.equal("also-how-are-you");
		});
		it("never starts or ends slugs with a dash", () => {
			expect(slug(" Foo")).to.equal("foo");
			expect(slug("Foo ")).to.equal("foo");
			expect(slug("(Foo)")).to.equal("foo");
			expect(slug("(Foo)(bar)")).to.equal("foo-bar");
		});
	});
	
	describe("splitOptions()", function(){
		this.slow(500);
		const {splitOptions} = utils;
		const defaultJunk = [[], ["x"], ["xy"], ["x y"], ["x", "y"], ["xyz", "uvw"], ["x", "y", "z"]];
		const defaultLong = ["foo", "foo|bar", "foo|bar|baz"];
		const doTest = (argv, opts, expected) => {
			const originalArgv = JSON.parse(JSON.stringify(argv));
			expect(splitOptions(argv, ...opts)).to.eql(expected);
			expect(argv, "Argv should not have been modified").to.eql(originalArgv);
		};
		const runTests = (...$) => $.map(({opts, tests, junkArgs = defaultJunk}) => {
			for(const z of opts[2])
			for(const y of opts[1])
			for(const x of opts[0])
			for(const {argv, expected} of tests)
			for(const junk of junkArgs){
				doTest(argv, [x, y, z], expected);
				doTest(argv.concat(junk),       [x, y, z], expected.concat(junk));
				doTest(junk.concat(argv),       [x, y, z], junk.concat(expected));
				doTest(junk.concat(argv, junk), [x, y, z], junk.concat(expected, junk));
			}
		});
		
		it("unbundles niladic options", () => runTests({
			opts: [["abc"], ["", "x", "xyz"], defaultLong],
			tests: [
				{argv: ["-abc"],      expected: ["-a", "-b", "-c"]},
				{argv: ["-ab", "-c"], expected: ["-a", "-b", "-c"]},
				{argv: ["-a", "-bc"], expected: ["-a", "-b", "-c"]},
				{argv: ["-a", "bc"],  expected: ["-a", "bc"]},
				{argv: ["a", "-bc"],  expected: ["a", "-b", "-c"]},
				{argv: ["-", "abc"],  expected: ["-", "abc"]},
			],
		}));
		
		it("unbundles monadic options", () => runTests({
			opts: [["", "x", "xyz"], ["abc"], defaultLong],
			tests: [
				{argv: ["-a1"],           expected: ["-a", "1"]},
				{argv: ["-a", "1"],       expected: ["-a", "1"]},
				{argv: ["-a1", "-b2"],    expected: ["-a", "1", "-b", "2"]},
				{argv: ["a", "1", "-b2"], expected: ["a",  "1", "-b", "2"]},
				{argv: ["-a", "-b2"],     expected: ["-a", "-b2"]},
				{argv: ["-ab2"],          expected: ["-a", "b2"]},
			],
		}, {
			opts: [["a"], ["bc"], ["foo", "foo|bar", "foo|bar|baz"]],
			tests: [{argv: ["-ab", "-c2"], expected: ["-a", "-b", "-c2"]}],
		}));
		
		it("unbundles mixed-arity options", () => runTests({
			opts: [["ab"], ["c"], defaultLong],
			tests: [
				{argv: ["-abc1"],          expected: ["-a", "-b", "-c", "1"]},
				{argv: ["-a", "-bc", "1"], expected: ["-a", "-b", "-c", "1"]},
				{argv: ["-bc",  "-ab"],    expected: ["-b", "-c", "-ab"]},
				{argv: ["-bc1", "-ab"],    expected: ["-b", "-c", "1", "-a", "-b"]},
				{argv: ["-bca", "-ab"],    expected: ["-b", "-c", "a", "-a", "-b"]},
			],
		}, {
			opts: [["b"], ["ac"], defaultLong],
			tests: [{argv: ["-a1b", "-c"], expected: ["-a", "1b", "-c"]}],
		}));
		
		it("splits --long-option=values", () => runTests({
			opts: [["", "a", "abc"], ["", "x", "xyz"], ["foo|bar"]],
			tests: [
				{argv: ["--foo=bar"],             expected: ["--foo", "bar"]},
				{argv: ["--foo", "1", "--bar=2"], expected: ["--foo", "1", "--bar", "2"]},
				{argv: ["--foo",  "bar"],         expected: ["--foo", "bar"]},
				{argv: ["--foo=", "bar"],         expected: ["--foo", "", "bar"]},
			],
		}));
		
		it("does not include missing parameters", () => runTests({
			opts: [[""], ["abc"], defaultLong],
			tests: [
				{argv: ["-a"],         expected: ["-a"]},
				{argv: ["-a1"],        expected: ["-a", "1"]},
				{argv: ["-a1", "-b"],  expected: ["-a", "1", "-b"]},
			],
		}, {
			opts: [["a"], ["bc"], defaultLong],
			tests: [
				{argv: ["-ab"],        expected: ["-a", "-b"]},
				{argv: ["-ab", "-c1"], expected: ["-a", "-b", "-c1"]},
			],
		}));
		
		it("ignores bundles beginning with an unknown option", () => runTests({
			opts: [["abc"], ["", "u", "uvw"], defaultLong],
			tests: [
				{argv: ["-xabc"],      expected: ["-xabc"]},
				{argv: ["-x", "-abc"], expected: ["-x", "-a", "-b", "-c"]},
				{argv: ["-xa", "-bc"], expected: ["-xa", "-b", "-c"]},
			],
		}));
		
		it("ignores unknown --long-option=values", () => runTests({
			opts: [["", "a", "abc"], ["", "x", "xyz"], ["bar"]],
			tests: [
				{argv: ["--foo=bar"],        expected: ["--foo=bar"]},
				{argv: ["--foo", "--bar=2"], expected: ["--foo", "--bar", "2"]},
			],
		}, {
			opts: [["", "a", "abc"], ["", "x", "xyz"], ["foo|bar", "bar|foo"]],
			tests: [{argv: ["--foo", "--bar=2"], expected: ["--foo", "--bar=2"]}],
		}));
		
		it("expands unknown options that follow a known one", () => runTests({
			opts: [["a"], ["", "x", "xyz"], defaultLong],
			tests: [
				{argv: ["-ab"],  expected: ["-a", "-b"]},
				{argv: ["-abc"], expected: ["-a", "-b", "-c"]},
			],
		}, {
			opts: [["a"], ["b"], defaultLong],
			tests: [{argv: ["-acb1"], expected: ["-a", "-c", "-b", "1"]}],
		}));
		
		it("returns an empty array for empty input", () => {
			expect(splitOptions()).to.eql([]);
			expect(splitOptions(null)).to.eql([]);
			expect(splitOptions(false)).to.eql([]);
		});
		
		it("boxes string arguments into arrays", () => {
			expect(splitOptions("-abc", "abc")).to.eql(["-a", "-b", "-c"]);
			expect(splitOptions("-abc", "a", "bc")).to.eql(["-a", "-b", "c"]);
		});
	});
	
	describe("splitStrings()", () => {
		const {splitStrings} = utils;
		describe("Delimiters", () => {
			const list = ["foo", "bar", "baz"];
			it("uses space, tab and newline as defaults", () => {
				expect(splitStrings("foo bar baz")).to.eql(list);
				expect(splitStrings("foo\tbar\tbaz")).to.eql(list);
				expect(splitStrings("foo\nbar\nbaz")).to.eql(list);
			});
			it("allows them to be changed", () => {
				expect(splitStrings("foo|bar|baz", {delimiters: "|"})).to.eql(list);
				expect(splitStrings("foo.bar|baz", {delimiters: "|."})).to.eql(list);
				expect(splitStrings("foo bar|baz", {delimiters: "|"})).to.eql(["foo bar", "baz"]);
			});
			it("treats contiguous delimiters as one", () => {
				expect(splitStrings("foo  bar   baz")).to.eql(list);
				expect(splitStrings("foo\t\tbar\t\t\tbaz")).to.eql(list);
				expect(splitStrings("foo\n\nbar\n\n\nbaz")).to.eql(list);
			});
			it("allows different delimiters to be used interchangeably", () => {
				expect(splitStrings("foo \tbar \tbaz")).to.eql(list);
				expect(splitStrings("foo\t\nbar\t\nbaz")).to.eql(list);
				expect(splitStrings("foo \t\n \n\t\n bar \n\t\tbaz")).to.eql(list);
				expect(splitStrings("foo | . bar . | . baz", {delimiters: ".| "})).to.eql(list);
			});
			it("skips leading and trailing delimiters", () => {
				expect(splitStrings(" foo")).to.eql(["foo"]);
				expect(splitStrings("  foo")).to.eql(["foo"]);
				expect(splitStrings("foo ")).to.eql(["foo"]);
				expect(splitStrings("foo  ")).to.eql(["foo"]);
				expect(splitStrings(" foo ")).to.eql(["foo"]);
				expect(splitStrings("|foo", {delimiters: "|"})).to.eql(["foo"]);
				expect(splitStrings("| foo", {delimiters: "|"})).to.eql([" foo"]);
				expect(splitStrings("||foo||bar||", {delimiters: "|"})).to.eql(["foo", "bar"]);
			});
		});
		
		describe("Quotes", () => {
			it("defaults to single-quotes, double-quotes and backticks", () => {
				expect(splitStrings("'foo'")).to.eql(["foo"]);
				expect(splitStrings('"foo"')).to.eql(["foo"]);
				expect(splitStrings("`foo`")).to.eql(["foo"]);
				expect(splitStrings('"foo bar" baz')).to.eql(["foo bar", "baz"]);
				expect(splitStrings("'foo bar' baz")).to.eql(["foo bar", "baz"]);
				expect(splitStrings("`foo bar` baz")).to.eql(["foo bar", "baz"]);
			});
			
			it("avoids splitting on delimiters between quote pairs", () => {
				expect(splitStrings("foo 'bar baz' qux")).to.eql(["foo", "bar baz", "qux"]);
				expect(splitStrings("'foo bar ' baz qux")).to.eql(["foo bar ", "baz", "qux"]);
				expect(splitStrings("foo bar ' baz qux'")).to.eql(["foo", "bar", " baz qux"]);
				expect(splitStrings("foo 'bar baz qux'")).to.eql(["foo", "bar baz qux"]);
			});
			
			it("includes quotes if `keepQuotes` is set", () =>
				expect(splitStrings("'foo'", {keepQuotes: true})).to.eql(["'foo'"]));
			
			it("recognises them without an adjacent delimiter", () => {
				const list = ["foo", "bar baz", "qux"];
				expect(splitStrings("foo b'ar ba'z qux")).to.eql(list);
				expect(splitStrings("foo b'ar baz' qux")).to.eql(list);
				expect(splitStrings("foo 'bar ba'z qux")).to.eql(list);
			});
			
			it("allows the quote characters to be changed", () => {
				const opts = {quoteChars: "/"};
				expect(splitStrings("foo /bar baz/ qux", opts)).to.eql(["foo", "bar baz", "qux"]);
				expect(splitStrings("/foo bar  baz / qux", opts)).to.eql(["foo bar  baz ", "qux"]);
				expect(splitStrings("/foo bar/ 'baz qux'", opts)).to.eql(["foo bar", "'baz", "qux'"]);
				expect(splitStrings("~foo bar~ /baz qux/", {quoteChars: "~/"})).to.eql(["foo bar", "baz qux"]);
			});

			it("doesn't get confused by nested quotes", () => {
				let test = "a 'b `c' `d e'` f";
				expect(splitStrings(test)).to.eql(["a", "b `c", "d e'", "f"]);
				expect(splitStrings(test, {keepQuotes: true})).to.eql(["a", "'b `c'", "`d e'`", "f"]);
				test = "a /b `c/ `d e/` f";
				expect(splitStrings(test, {quoteChars: "/`"})).to.eql(["a", "b `c", "d e/", "f"]);
				expect(splitStrings(test, {quoteChars: "/`", keepQuotes: true})).to.eql(["a", "/b `c/", "`d e/`", "f"]);
			});
			
			it("treats empty quote pairs as empty elements", () => {
				expect(splitStrings("foo '' bar")).to.eql(["foo", "", "bar"]);
				expect(splitStrings("foo '''' bar")).to.eql(["foo", "", "bar"]);
				expect(splitStrings("foo ''`` bar")).to.eql(["foo", "", "bar"]);
				expect(splitStrings("foo '' `` bar")).to.eql(["foo", "", "", "bar"]);
				expect(splitStrings("foo ''' bar")).to.eql(["foo", " bar"]);
				expect(splitStrings("foo '' ``")).to.eql(["foo", "", ""]);
				expect(splitStrings("''")).to.eql([""]);
				expect(splitStrings(" '' ")).to.eql([""]);
				expect(splitStrings("''' ")).to.eql([" "]);
				expect(splitStrings("'' ``")).to.eql(["", ""]);
				expect(splitStrings("'' `` ")).to.eql(["", ""]);
				expect(splitStrings("'' `` foo")).to.eql(["", "", "foo"]);
				expect(splitStrings("''", {keepQuotes: true})).to.eql(["''"]);
				expect(splitStrings("foo '' bar", {keepQuotes: true})).to.eql(["foo", "''", "bar"]);
				expect(splitStrings("foo '''' bar", {keepQuotes: true})).to.eql(["foo", "''''", "bar"]);
				expect(splitStrings("foo ''`` bar", {keepQuotes: true})).to.eql(["foo", "''``", "bar"]);
				expect(splitStrings("foo '' `` bar", {keepQuotes: true})).to.eql(["foo", "''", "``", "bar"]);
			});
		});
	
		describe("Escapes", () => {
			it("ignores delimiters preceded by an escape", () =>
				expect(splitStrings("foo\\ bar")).to.eql(["foo bar"]));
			
			it("ignores quotes preceded by an escape", () =>
				expect(splitStrings("foo \\'bar baz\\' qux")).to.eql(["foo", "'bar", "baz'", "qux"]));
			
			it("ignores escape characters preceded by another escape", () =>
				expect(splitStrings("foo\\\\ bar")).to.eql(["foo\\", "bar"]));
			
			it("doesn't require escapes to be used on special characters", () =>
				expect(splitStrings("foo\\bar")).to.eql(["foobar"]));
			
			it("includes them if `keepEscapes` is set", () =>
				expect(splitStrings("foo\\ bar", {keepEscapes: true})).to.eql(["foo\\ bar"]));
		
			it("allows different escape characters to be used", () => {
				expect(splitStrings("foo% bar", {escapeChars: "%"})).to.eql(["foo bar"]);
				expect(splitStrings("foo% bar", {escapeChars: "%", keepEscapes: true})).to.eql(["foo% bar"]);
			});
			
			it("allows different escape characters to be mixed", () => {
				expect(splitStrings("foo%\\ bar", {escapeChars: "%\\"})).to.eql(["foo\\", "bar"]);
				expect(splitStrings("foo%\\ bar", {escapeChars: "%\\", keepEscapes: true})).to.eql(["foo%\\", "bar"]);
			});
			
			it("recognises them inside quoted regions", () => {
				expect(splitStrings("foo 'bar\\'s baz' qux")).to.eql(["foo", "bar's baz", "qux"]);
				expect(splitStrings("foo 'bar\\\\'s baz qux'")).to.eql(["foo", "bar\\s", "baz", "qux"]);
			});
			
			it("does nothing if input terminates early", () =>
				expect(splitStrings("foo \\")).to.eql(["foo"]));
		});
	});

	describe("timeSince()", () => {
		const {timeSince} = utils;
		const SEC  = 1000;
		const MIN  = SEC  * 60;
		const HOUR = MIN  * 60;
		const DAY  = HOUR * 24;
		const WEEK = DAY  * 7;
		const MON  = WEEK * 4.345238;
		const YEAR = MON  * 12;
		const DEC  = YEAR * 10;
		const CENT = DEC  * 10;
		const MILL = CENT * 10;
		
		it("accepts Dates as arguments", () => {
			const now = Date.now();
			expect(timeSince(new Date(now - 86400000))).to.equal("Yesterday");
			expect(timeSince(new Date(now + 86400001))).to.equal("Tomorrow");
		});
		
		describe("Seconds", () => {
			describe("Past intervals", () => {
				it("formats 1 second",   () => expect(timeSince(SEC * 1)).to.equal("Just now"));
				it("formats 2 seconds",  () => expect(timeSince(SEC * 2)).to.equal("2 seconds ago"));
				it("formats 10 seconds", () => expect(timeSince(SEC * 10)).to.equal("10 seconds ago"));
				it("formats 35 seconds", () => expect(timeSince(SEC * 35)).to.equal("35 seconds ago"));
				it("formats 49 seconds", () => expect(timeSince(SEC * 49)).to.equal("49 seconds ago"));
				it("formats 59 seconds", () => expect(timeSince(SEC * 59)).to.equal("59 seconds ago"));
				it("includes fractions", () => {
					expect(timeSince(SEC * 1.1))  .to.equal("Just now");
					expect(timeSince(SEC * 1.9))  .to.equal("Just now");
					expect(timeSince(SEC * 2.5))  .to.equal("2.5 seconds ago");
					expect(timeSince(SEC * 2.05)) .to.equal("2.05 seconds ago");
					expect(timeSince(SEC * 59.5)) .to.equal("59.5 seconds ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 second",   () => expect(timeSince(SEC * -1)).to.equal("Just now"));
				it("formats 2 seconds",  () => expect(timeSince(SEC * -2)).to.equal("2 seconds from now"));
				it("formats 10 seconds", () => expect(timeSince(SEC * -10)).to.equal("10 seconds from now"));
				it("formats 35 seconds", () => expect(timeSince(SEC * -35)).to.equal("35 seconds from now"));
				it("formats 49 seconds", () => expect(timeSince(SEC * -49)).to.equal("49 seconds from now"));
				it("formats 59 seconds", () => expect(timeSince(SEC * -59)).to.equal("59 seconds from now"));
				it("includes fractions", () => {
					expect(timeSince(SEC * -1.1))  .to.equal("Just now");
					expect(timeSince(SEC * -1.9))  .to.equal("Just now");
					expect(timeSince(SEC * -2.5))  .to.equal("2.5 seconds from now");
					expect(timeSince(SEC * -2.05)) .to.equal("2.05 seconds from now");
					expect(timeSince(SEC * -59.5)) .to.equal("59.5 seconds from now");
				});
			});
		});
		
		describe("Minutes", () => {
			describe("Past intervals", () => {
				it("formats 1 minute",   () => expect(timeSince(MIN * 1)).to.equal("A minute ago"));
				it("formats 2 minutes",  () => expect(timeSince(MIN * 2)).to.equal("2 minutes ago"));
				it("formats 10 minutes", () => expect(timeSince(MIN * 10)).to.equal("10 minutes ago"));
				it("formats 35 minutes", () => expect(timeSince(MIN * 35)).to.equal("35 minutes ago"));
				it("formats 59 minutes", () => expect(timeSince(MIN * 59)).to.equal("59 minutes ago"));
				it("ignores fractions",  () => {
					expect(timeSince(MIN * 1.5))  .to.equal("A minute ago");
					expect(timeSince(MIN * 1.95)) .to.equal("A minute ago");
					expect(timeSince(MIN * 2.5))  .to.equal("2 minutes ago");
					expect(timeSince(MIN * 2.05)) .to.equal("2 minutes ago");
					expect(timeSince(MIN * 59.5)) .to.equal("59 minutes ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 minute",   () => expect(timeSince(MIN * -1)).to.equal("A minute from now"));
				it("formats 2 minutes",  () => expect(timeSince(MIN * -2)).to.equal("2 minutes from now"));
				it("formats 10 minutes", () => expect(timeSince(MIN * -10)).to.equal("10 minutes from now"));
				it("formats 35 minutes", () => expect(timeSince(MIN * -35)).to.equal("35 minutes from now"));
				it("formats 59 minutes", () => expect(timeSince(MIN * -59)).to.equal("59 minutes from now"));
				it("ignores fractions",  () => {
					expect(timeSince(MIN * -1.5))  .to.equal("A minute from now");
					expect(timeSince(MIN * -1.95)) .to.equal("A minute from now");
					expect(timeSince(MIN * -2.5))  .to.equal("2 minutes from now");
					expect(timeSince(MIN * -2.05)) .to.equal("2 minutes from now");
					expect(timeSince(MIN * -59.5)) .to.equal("59 minutes from now");
				});
			});
		});
		
		describe("Hours", () => {
			describe("Past intervals", () => {
				it("formats 1 hour",     () => expect(timeSince(HOUR * 1)).to.equal("An hour ago"));
				it("formats 2 hours",    () => expect(timeSince(HOUR * 2)).to.equal("2 hours ago"));
				it("formats 6 hours",    () => expect(timeSince(HOUR * 6)).to.equal("6 hours ago"));
				it("formats 18 hours",   () => expect(timeSince(HOUR * 18)).to.equal("18 hours ago"));
				it("formats 23 hours",   () => expect(timeSince(HOUR * 23)).to.equal("23 hours ago"));
				it("ignores fractions",  () => {
					expect(timeSince(HOUR * 1.5))   .to.equal("An hour ago");
					expect(timeSince(HOUR * 1.95))  .to.equal("An hour ago");
					expect(timeSince(HOUR * 2.5))   .to.equal("2 hours ago");
					expect(timeSince(HOUR * 2.05))  .to.equal("2 hours ago");
					expect(timeSince(HOUR * 11.9))  .to.equal("11 hours ago");
					expect(timeSince(HOUR * 12.01)) .to.equal("12 hours ago");
					expect(timeSince(HOUR * 23.9))  .to.equal("23 hours ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 hour",     () => expect(timeSince(HOUR * -1)).to.equal("An hour from now"));
				it("formats 2 hours",    () => expect(timeSince(HOUR * -2)).to.equal("2 hours from now"));
				it("formats 6 hours",    () => expect(timeSince(HOUR * -6)).to.equal("6 hours from now"));
				it("formats 18 hours",   () => expect(timeSince(HOUR * -18)).to.equal("18 hours from now"));
				it("formats 23 hours",   () => expect(timeSince(HOUR * -23)).to.equal("23 hours from now"));
				it("ignores fractions",  () => {
					expect(timeSince(HOUR * -1.5))   .to.equal("An hour from now");
					expect(timeSince(HOUR * -1.95))  .to.equal("An hour from now");
					expect(timeSince(HOUR * -2.5))   .to.equal("2 hours from now");
					expect(timeSince(HOUR * -2.05))  .to.equal("2 hours from now");
					expect(timeSince(HOUR * -11.9))  .to.equal("11 hours from now");
					expect(timeSince(HOUR * -12.01)) .to.equal("12 hours from now");
					expect(timeSince(HOUR * -23.9))  .to.equal("23 hours from now");
				});
			});
		});
		
		describe("Days", () => {
			describe("Past intervals", () => {
				it("formats 1 day",      () => expect(timeSince(DAY * 1)).to.equal("Yesterday"));
				it("formats 2 days",     () => expect(timeSince(DAY * 2)).to.equal("2 days ago"));
				it("formats 3 days",     () => expect(timeSince(DAY * 3)).to.equal("3 days ago"));
				it("formats 6 days",     () => expect(timeSince(DAY * 6)).to.equal("6 days ago"));
				it("ignores fractions",  () => {
					expect(timeSince(DAY * 1.1)).to.equal("Yesterday");
					expect(timeSince(DAY * 1.8)).to.equal("Yesterday");
					expect(timeSince(DAY * 2.2)).to.equal("2 days ago");
					expect(timeSince(DAY * 5.5)).to.equal("5 days ago");
					expect(timeSince(DAY * 6.9)).to.equal("6 days ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 day",      () => expect(timeSince(DAY * -1)).to.equal("Tomorrow"));
				it("formats 2 days",     () => expect(timeSince(DAY * -2)).to.equal("2 days from now"));
				it("formats 3 days",     () => expect(timeSince(DAY * -3)).to.equal("3 days from now"));
				it("formats 6 days",     () => expect(timeSince(DAY * -6)).to.equal("6 days from now"));
				it("ignores fractions",  () => {
					expect(timeSince(DAY * -1.1)).to.equal("Tomorrow");
					expect(timeSince(DAY * -1.8)).to.equal("Tomorrow");
					expect(timeSince(DAY * -2.2)).to.equal("2 days from now");
					expect(timeSince(DAY * -5.5)).to.equal("5 days from now");
					expect(timeSince(DAY * -6.9)).to.equal("6 days from now");
				});
			});
		});
		
		describe("Weeks", () => {
			describe("Past intervals", () => {
				it("formats 1 week",     () => expect(timeSince(WEEK * 1)).to.equal("Last week"));
				it("formats 2 weeks",    () => expect(timeSince(WEEK * 2)).to.equal("2 weeks ago"));
				it("formats 3 weeks",    () => expect(timeSince(WEEK * 3)).to.equal("3 weeks ago"));
				it("formats 4 weeks",    () => expect(timeSince(WEEK * 4)).to.equal("4 weeks ago"));
				it("ignores fractions",  () => {
					expect(timeSince(WEEK * 1.1)).to.equal("Last week");
					expect(timeSince(WEEK * 1.8)).to.equal("Last week");
					expect(timeSince(WEEK * 2.2)).to.equal("2 weeks ago");
					expect(timeSince(WEEK * 4.3)).to.equal("4 weeks ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 week",     () => expect(timeSince(WEEK * -1)).to.equal("Next week"));
				it("formats 2 weeks",    () => expect(timeSince(WEEK * -2)).to.equal("2 weeks from now"));
				it("formats 3 weeks",    () => expect(timeSince(WEEK * -3)).to.equal("3 weeks from now"));
				it("formats 4 weeks",    () => expect(timeSince(WEEK * -4)).to.equal("4 weeks from now"));
				it("ignores fractions",  () => {
					expect(timeSince(WEEK * -1.1)).to.equal("Next week");
					expect(timeSince(WEEK * -1.8)).to.equal("Next week");
					expect(timeSince(WEEK * -2.2)).to.equal("2 weeks from now");
					expect(timeSince(WEEK * -4.3)).to.equal("4 weeks from now");
				});
			});
		});
		
		describe("Months", () => {
			describe("Past intervals", () => {
				it("formats 1 month",    () => expect(timeSince(MON * 1)).to.equal("Last month"));
				it("formats 2 months",   () => expect(timeSince(MON * 2)).to.equal("2 months ago"));
				it("formats 3 months",   () => expect(timeSince(MON * 3)).to.equal("3 months ago"));
				it("formats 6 months",   () => expect(timeSince(MON * 6)).to.equal("6 months ago"));
				it("formats 11 months",  () => expect(timeSince(MON * 11)).to.equal("11 months ago"));
				it("ignores fractions",  () => {
					expect(timeSince(MON * 1.1)).to.equal("Last month");
					expect(timeSince(MON * 1.8)).to.equal("Last month");
					expect(timeSince(MON * 2.2)).to.equal("2 months ago");
					expect(timeSince(MON * 4.3)).to.equal("4 months ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 month",    () => expect(timeSince(MON * -1)).to.equal("Next month"));
				it("formats 2 months",   () => expect(timeSince(MON * -2)).to.equal("2 months from now"));
				it("formats 3 months",   () => expect(timeSince(MON * -3)).to.equal("3 months from now"));
				it("formats 6 months",   () => expect(timeSince(MON * -6)).to.equal("6 months from now"));
				it("formats 11 months",  () => expect(timeSince(MON * -11)).to.equal("11 months from now"));
				it("ignores fractions",  () => {
					expect(timeSince(MON * -1.1)).to.equal("Next month");
					expect(timeSince(MON * -1.8)).to.equal("Next month");
					expect(timeSince(MON * -2.2)).to.equal("2 months from now");
					expect(timeSince(MON * -4.3)).to.equal("4 months from now");
				});
			});
		});
		
		describe("Years", () => {
			describe("Past intervals", () => {
				it("formats 1 year",    () => expect(timeSince(YEAR * 1)).to.equal("Last year"));
				it("formats 2 years",   () => expect(timeSince(YEAR * 2)).to.equal("2 years ago"));
				it("formats 3 years",   () => expect(timeSince(YEAR * 3)).to.equal("3 years ago"));
				it("formats 6 years",   () => expect(timeSince(YEAR * 6)).to.equal("6 years ago"));
				it("formats 9 years",   () => expect(timeSince(YEAR * 9)).to.equal("9 years ago"));
				it("ignores fractions",  () => {
					expect(timeSince(YEAR * 1.1)).to.equal("Last year");
					expect(timeSince(YEAR * 1.8)).to.equal("Last year");
					expect(timeSince(YEAR * 2.2)).to.equal("2 years ago");
					expect(timeSince(YEAR * 3.3)).to.equal("3 years ago");
					expect(timeSince(YEAR * 4.3)).to.equal("4 years ago");
					expect(timeSince(YEAR * 9.9)).to.equal("9 years ago");
				});
			});
			
			describe("Future intervals", () => {
				it("formats 1 year",    () => expect(timeSince(YEAR * -1)).to.equal("Next year"));
				it("formats 2 years",   () => expect(timeSince(YEAR * -2)).to.equal("2 years from now"));
				it("formats 3 years",   () => expect(timeSince(YEAR * -3)).to.equal("3 years from now"));
				it("formats 6 years",   () => expect(timeSince(YEAR * -6)).to.equal("6 years from now"));
				it("formats 9 years",   () => expect(timeSince(YEAR * -9)).to.equal("9 years from now"));
				it("ignores fractions",  () => {
					expect(timeSince(YEAR * -1.1)).to.equal("Next year");
					expect(timeSince(YEAR * -1.8)).to.equal("Next year");
					expect(timeSince(YEAR * -2.2)).to.equal("2 years from now");
					expect(timeSince(YEAR * -3.3)).to.equal("3 years from now");
					expect(timeSince(YEAR * -4.3)).to.equal("4 years from now");
					expect(timeSince(YEAR * -9.9)).to.equal("9 years from now");
				});
			});
		});
		
		describe("Decades", () => {
			describe("Past intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 decade",  () => expect(timeSince(DEC * 1)).to.equal("A decade ago"));
					it("formats 2 decades", () => expect(timeSince(DEC * 2)).to.equal("2 decades ago"));
					it("formats 5 decades", () => expect(timeSince(DEC * 5)).to.equal("5 decades ago"));
					it("formats 9 decades", () => expect(timeSince(DEC * 9)).to.equal("9 decades ago"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 10 years", () => expect(timeSince(DEC * 1, true)).to.equal("10 years ago"));
					it("formats 20 years", () => expect(timeSince(DEC * 2, true)).to.equal("20 years ago"));
					it("formats 50 years", () => expect(timeSince(DEC * 5, true)).to.equal("50 years ago"));
					it("formats 90 years", () => expect(timeSince(DEC * 9, true)).to.equal("90 years ago"));
				});
			});
			
			describe("Future intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 decade",  () => expect(timeSince(DEC * -1)).to.equal("A decade from now"));
					it("formats 2 decades", () => expect(timeSince(DEC * -2)).to.equal("2 decades from now"));
					it("formats 5 decades", () => expect(timeSince(DEC * -5)).to.equal("5 decades from now"));
					it("formats 9 decades", () => expect(timeSince(DEC * -9)).to.equal("9 decades from now"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 10 years", () => expect(timeSince(DEC * -1, true)).to.equal("10 years from now"));
					it("formats 20 years", () => expect(timeSince(DEC * -2, true)).to.equal("20 years from now"));
					it("formats 50 years", () => expect(timeSince(DEC * -5, true)).to.equal("50 years from now"));
					it("formats 90 years", () => expect(timeSince(DEC * -9, true)).to.equal("90 years from now"));
				});
			});
		});
		
		describe("Centuries", () => {
			describe("Past intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 century",   () => expect(timeSince(CENT * 1)).to.equal("A century ago"));
					it("formats 2 centuries", () => expect(timeSince(CENT * 2)).to.equal("2 centuries ago"));
					it("formats 5 centuries", () => expect(timeSince(CENT * 5)).to.equal("5 centuries ago"));
					it("formats 9 centuries", () => expect(timeSince(CENT * 9.1)).to.equal("9 centuries ago"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 100 years", () => expect(timeSince(CENT * 1, true)).to.equal("100 years ago"));
					it("formats 200 years", () => expect(timeSince(CENT * 2, true)).to.equal("200 years ago"));
					it("formats 500 years", () => expect(timeSince(CENT * 5, true)).to.equal("500 years ago"));
					it("formats 909 years", () => expect(timeSince(CENT * 9.1, true)).to.equal("909 years ago"));
				});
			});
			
			describe("Future intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 century",   () => expect(timeSince(CENT * -1)).to.equal("A century from now"));
					it("formats 2 centuries", () => expect(timeSince(CENT * -2)).to.equal("2 centuries from now"));
					it("formats 5 centuries", () => expect(timeSince(CENT * -5)).to.equal("5 centuries from now"));
					it("formats 9 centuries", () => expect(timeSince(CENT * -9.1)).to.equal("9 centuries from now"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 100 years", () => expect(timeSince(CENT * -1, true)).to.equal("100 years from now"));
					it("formats 200 years", () => expect(timeSince(CENT * -2, true)).to.equal("200 years from now"));
					it("formats 500 years", () => expect(timeSince(CENT * -5, true)).to.equal("500 years from now"));
					it("formats 909 years", () => expect(timeSince(CENT * -9.1, true)).to.equal("909 years from now"));
				});
			});
		});
		
		describe("Millennia", () => {
			describe("Past intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 millennium",  () => expect(timeSince(MILL * 1)).to.equal("A millennium ago"));
					it("formats 2 millennia",   () => expect(timeSince(MILL * 2)).to.equal("2 millennia ago"));
					it("formats 5 millennia",   () => expect(timeSince(MILL * 5)).to.equal("5 millennia ago"));
					it("formats 9 millennia",   () => expect(timeSince(MILL * 9)).to.equal("9 millennia ago"));
					it("formats 50 millennia",  () => expect(timeSince(MILL * 50.1)).to.equal("50 millennia ago"));
					it("formats 100 millennia", () => expect(timeSince(MILL * 100.1)).to.equal("100 millennia ago"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 1000 years",   () => expect(timeSince(MILL * 1, true)).to.equal("1000 years ago"));
					it("formats 2000 years",   () => expect(timeSince(MILL * 2, true)).to.equal("2000 years ago"));
					it("formats 5000 years",   () => expect(timeSince(MILL * 5, true)).to.equal("5000 years ago"));
					it("formats 9000 years",   () => expect(timeSince(MILL * 9, true)).to.equal("9000 years ago"));
					it("formats 50100 years",  () => expect(timeSince(MILL * 50.1, true)).to.equal("50100 years ago"));
					it("formats 100100 years", () => expect(timeSince(MILL * 100.1, true)).to.equal("100100 years ago"));
				});
			});
			
			describe("Future intervals", () => {
				describe("When `maxYear = false`", () => {
					it("formats 1 millennium",  () => expect(timeSince(MILL * -1)).to.equal("A millennium from now"));
					it("formats 2 millennia",   () => expect(timeSince(MILL * -2)).to.equal("2 millennia from now"));
					it("formats 5 millennia",   () => expect(timeSince(MILL * -5)).to.equal("5 millennia from now"));
					it("formats 9 millennia",   () => expect(timeSince(MILL * -9)).to.equal("9 millennia from now"));
					it("formats 50 millennia",  () => expect(timeSince(MILL * -50.1)).to.equal("50 millennia from now"));
					it("formats 100 millennia", () => expect(timeSince(MILL * -100.1)).to.equal("100 millennia from now"));
				});
				
				describe("When `maxYear = true`", () => {
					it("formats 1000 years",   () => expect(timeSince(MILL * -1, true)).to.equal("1000 years from now"));
					it("formats 2000 years",   () => expect(timeSince(MILL * -2, true)).to.equal("2000 years from now"));
					it("formats 5000 years",   () => expect(timeSince(MILL * -5, true)).to.equal("5000 years from now"));
					it("formats 9000 years",   () => expect(timeSince(MILL * -9, true)).to.equal("9000 years from now"));
					it("formats 50100 years",  () => expect(timeSince(MILL * -50.1, true)).to.equal("50100 years from now"));
					it("formats 100100 years", () => expect(timeSince(MILL * -100.1, true)).to.equal("100100 years from now"));
				});
			});
		});
	});

	describe("titleCase()", () => {
		const {titleCase} = utils;
		const test = (input, expected) => {
			expect(titleCase(input)).to.equal(expected);
			expect(titleCase(input.toLowerCase())).to.equal(expected);
			expect(titleCase(input.toUpperCase())).to.equal(expected);
		};
		it("doesn't capitalise articles", () => {
			test("Find A Way",          "Find a Way");
			test("Find The Way",        "Find the Way");
			test("Use An Example",      "Use an Example");
		});
		it("doesn't capitalise conjunctions", () => {
			test("Here Nor There",      "Here nor There");
			test("Strange But True",    "Strange but True");
			test("Thelma And Louise",   "Thelma and Louise");
			test("This Or That",        "This or That");
			test("Not Yet Started",     "Not yet Started");
		});
		it("doesn't capitalise prepositions", () => {
			test("Lost In Space",       "Lost in Space");
			test("Bad At Examples",     "Bad at Examples");
			test("Playing With Fire",   "Playing with Fire");
			test("Done For Laughs",     "Done for Laughs");
			test("Glass Of Water",      "Glass of Water");
			test("Glass On Table",      "Glass on Table");
			test("Going To Town",       "Going to Town");
			test("Newcastle Upon Tyne", "Newcastle upon Tyne");
			test("Lord Of The Rings",   "Lord of the Rings");
		});
		it("capitalises principal words", () => {
			test("A Cup of Tea",        "A Cup of Tea");
			test("A few good men",      "A Few Good Men");
			test("Of Mice And Men",     "Of Mice and Men");
			test("the member of",       "The Member Of");
		});
		it("capitalises words between punctuation", () => {
			test('He "Started" it',     'He "Started" It');
			test('He started "It"',     'He Started "It"');
			test('He did "It" first',   'He Did "It" First');
			test('He Said "And?"',      'He Said "And?"');
			test("this And... that",    "This and... That");
			test("He Did It...",        "He Did It...");
		});
		it("capitalises the pronoun “I”", () => {
			test("You and i",           "You and I");
			test("You and i do",        "You and I Do");
			test("i do?",               "I Do?");
		});
		it("capitalises contractions", () => {
			test("I'm okay",            "I'm Okay");
			test("ThaT'S not right",    "That's Not Right");
		});
		it("capitalises short verbs", () => {
			test("This is Dumb",        "This Is Dumb");
			test("These are Dumb",      "These Are Dumb");
		});
		it("capitalises single letters", () => {
			test("A b c d",             "A B C D");
			test("A a c d",             "A a C D");
			test("X y z a",             "X Y Z A");
		});
	});

	describe("tokeniseOutline()", () => {
		const {tokeniseOutline} = utils;
		it("tokenises indented lines", () => {
			const input = ["1.", "\t1.1", "\t1.2", "\t1.3", "2.", "\t2.1", "\t2.2"];
			const root1 = Object.assign([], {level: 0, parent: null, name: "1."});
			const root2 = Object.assign([], {level: 0, parent: null, name: "2."});
			root1.push(
				Object.assign([], {name: "1.1", level: 1, parent: root1}),
				Object.assign([], {name: "1.2", level: 1, parent: root1}),
				Object.assign([], {name: "1.3", level: 1, parent: root1}),
			);
			root2.push(
				Object.assign([], {name: "2.1", level: 1, parent: root2}),
				Object.assign([], {name: "2.2", level: 1, parent: root2}),
			);
			expect(tokeniseOutline(input.join("\n"))).to.eql([root1, root2]);
		});
		it("tokenises unindented lines", () => {
			expect(tokeniseOutline("Foo\nBar\nBaz")).to.eql([
				Object.assign([], {level: 0, parent: null, name: "Foo"}),
				Object.assign([], {level: 0, parent: null, name: "Bar"}),
				Object.assign([], {level: 0, parent: null, name: "Baz"}),
			]);
		});
		it("tokenises multiple levels", () => {
			const input = [
				"1.",
				"\t1.1",
				"\t1.2",
				"\t\t1.2.1",
				"\t\t1.2.2",
				"\t\t\t1.2.2.1",
				"\t\t\t1.2.2.2",
				"\t\t\t1.2.2.3",
				"\t\t1.2.3",
				"\t1.3",
				"2.",
				"\t2.1",
				"\t\t2.1.1",
				"\t\t2.1.2",
				"\t2.2",
			].join("\n");
			const root1 = Object.assign([], {level: 0, parent: null, name: "1."});
			const root2 = Object.assign([], {level: 0, parent: null, name: "2."});
			root1.push(
				Object.assign([], {level: 1, parent: root1, name: "1.1"}),
				Object.assign([], {level: 1, parent: root1, name: "1.2"}),
				Object.assign([], {level: 1, parent: root1, name: "1.3"}),
			);
			root2.push(
				Object.assign([], {level: 1, parent: root1, name: "2.1"}),
				Object.assign([], {level: 1, parent: root1, name: "2.2"}),
			);
			root1[1].push(
				Object.assign([], {level: 2, parent: root1[1], name: "1.2.1"}),
				Object.assign([], {level: 2, parent: root1[1], name: "1.2.2"}),
				Object.assign([], {level: 2, parent: root1[1], name: "1.2.3"}),
			);
			root1[1][1].push(
				Object.assign([], {level: 2, parent: root1[1][1], name: "1.2.2.1"}),
				Object.assign([], {level: 2, parent: root1[1][1], name: "1.2.2.2"}),
				Object.assign([], {level: 2, parent: root1[1][1], name: "1.2.2.3"}),
			);
			root2[0].push(
				Object.assign([], {level: 2, parent: root2[0], name: "2.1.1"}),
				Object.assign([], {level: 2, parent: root2[0], name: "2.1.2"}),
			);
			expect(tokeniseOutline(input)).to.eql([root1, root2]);
		});
		it("treats two indentation levels as one", () => {
			const parent = Object.assign([], {level: 0, name: "Foo", parent: null});
			const uncle  = Object.assign([], {level: 0, name: "Baz", parent: null});
			const child  = Object.assign([], {level: 2, name: "Bar", parent});
			parent.push(child);
			expect(tokeniseOutline("Foo\n\t\tBar\nBaz")).to.eql([parent, uncle]);
		});
		it("strips leading indentation before parsing", () => {
			const input = ["\t1.", "\t\t2.", "\t3.", "\t\t4."];
			const root1 = Object.assign([], {level: 0, parent: null, name: "1."});
			const root2 = Object.assign([], {level: 0, parent: null, name: "3."});
			root1.push(Object.assign([], {level: 1, parent: root1, name: "2."}));
			root2.push(Object.assign([], {level: 1, parent: root2, name: "4."}));
			const tree = [root1, root2];
			expect(tokeniseOutline(input.join("\n"))).to.eql(tree);
			expect(tokeniseOutline(input.map(x => "\t\t" + x).join("\n"))).to.eql(tree);
		});
	});

	describe("wordCount()", () => {
		const {wordCount} = utils;
		it("naïvely counts words separated by whitespace", () => {
			expect(wordCount("Foo")).to.equal(1);
			expect(wordCount("What a")).to.equal(2);
			expect(wordCount("Bunch of odd-looking functions")).to.equal(4);
			expect(wordCount("Foo\nBar")).to.equal(2);
		});
		it("optionally counts hyphenated-segments", () => {
			expect(wordCount("Foo-", true)).to.equal(1);
			expect(wordCount("What-a", true)).to.equal(2);
			expect(wordCount("Bunch of odd-looking functions", true)).to.equal(5);
		});
		it("returns zero for empty input", () => {
			expect(wordCount("")).to.equal(0);
			expect(wordCount(" ")).to.equal(0);
			expect(wordCount("  ")).to.equal(0);
		});
	});

	// TODO: Rewrite this function; its current behaviour makes no sense
	describe("wordWrap()", () => {
		const {wordWrap} = utils;
		it("wraps text to a designated line-length", () => {
			const input = "Lorem ipsum dolor sit amet";
			expect(wordWrap(input, 18)).to.eql(["Lorem ipsum dolor ", "sit amet"]);
			expect(wordWrap(input, 12)).to.eql(["Lorem ipsum ", "dolor sit ", "amet"]);
		});
		it("preserves line-breaks in the original text", () => {
			expect(wordWrap("Foo\nBar Baz", 8))   .to.eql(["Foo\n", "Bar ", "Baz"]);
			expect(wordWrap("Foo\n\nBar\nBaz", 8)).to.eql(["Foo\n\n", "Bar", "\n", "Baz"]);
		});
		it("splits words if they don't fit on one line", () => {
			expect(wordWrap("Foooooooooooo", 4))  .to.eql(["Fooo", "oooo", "oooo", "o"]);
			expect(wordWrap("Foo Baaaaaaar", 10)) .to.eql(["Foo ", "Baaaaaaar"]);
		});
	});
});
