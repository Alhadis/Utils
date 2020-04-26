all: hooks lint types test


# Generate TypeScript declarations from JSDoc
types: index.d.ts
index.d.ts: index.mjs lib/*.mjs
	npx jg typewrite \
		--exclude BlendModes \
		--declare const BlendModes '{[key: string]: (...args: number[]) => number};' \
		--header '// Generated file; run `make types` to update.' \
		--sort $^
	cat lib/*.d.ts | sort | uniq > $@
	rm  lib/*.d.ts
	npx jg lint -t


# Symlink pre-commit script
hooks: .git/hooks/pre-commit
.git/hooks/pre-commit:
	ln -s ../../tools/pre-commit.sh $@
	head $@ >/dev/null 2>&1


# Check source for errors and style violations
lint:
	tools/check-sorted.mjs {lib,test}/*.mjs
	npx jg lint

.PHONY: lint


# Run unit-tests
test:
	npx c8 mocha

.PHONY: test


# Run browser-based tests
test-browser:
	eval `jg where -s mocha chai`; \
	jg serve --mount "$$mocha" --mount "$$chai" .

.PHONY: test-browser


# Aliased tasks
browser-tests browser-test: test-browser


# Nuke generated and untracked files
clean:
	cd test/fixtures/ints && make clean
	rm -rf test/fixtures/rmrf/{junk*,rm}
	rm -rf test/fixtures/ls/{*.lnk,tmp}
	rm -rf coverage
	rm  -f lib/*.d.ts

.PHONY: clean


# Generate an HTML coverage report
html-report: coverage/index.html
coverage/index.html: index.mjs lib/*.mjs test/*.mjs
	npx c8 --reporter=html mocha
	sed -i.bak -e 's/tab-size: *2;*/tab-size: 4;/g' coverage/base.css
	rm coverage/base.css.bak
	case `uname -s` in Darwin) open $@;; *) xdg-open $@;; esac


# Regenerate a base64-encoded list of PNG fixtures
pngs = test/fixtures/rgba/*.png
test/fixtures/base64/rgba.json:
	@ command -v base64 2>&1 >/dev/null || { echo "base64 command not found"; exit 1; };
	printf \{ > $@
	for i in $(pngs); do \
		printf '\n\t"%s": "%s",' "$${i#test/fixtures/}" `base64 $$i` >> $@; \
	done
	perl -0 -pi -e 's/,\z/\n}\n/' $@


# Regenerate font used for testing HTML <canvas> rendering
test/browser/fonts/canvas-test.woff2:
	@ command 2>&1 >/dev/null -v fontforge      || { echo "FontForge is required"; exit 1; }
	@ command 2>&1 >/dev/null -v woff2_compress || { echo "woff2_compress not found"; exit 1; }
	font=`printf '%s' '$@' | sed 's/\.woff2$$//'`; \
	fontforge 2>/dev/null -lang=ff -c 'Open($$1); Generate($$2)' "$$font.svg" "$$font.ttf"; \
	woff2_compress "$$font.ttf" && rm -f "$$font.ttf"
