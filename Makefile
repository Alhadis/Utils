all: install lint types test


# Generate TypeScript declarations from JSDoc
types: index.d.ts
index.d.ts: index.mjs lib/*.mjs
	"`npx jg -p typewrite`" \
		--exclude BlendModes \
		--declare const BlendModes '{[key: string]: (...args: number[]) => number};' \
		--header '// Generated file; run `make types` to update.' \
		--sort $^
	cat lib/*.d.ts | sort | uniq > $@
	rm  lib/*.d.ts
	npx jg lint -t


# Install or symlink dependencies needed for build-tasks
install: hooks node_modules

node_modules:
	npm install >/dev/null \
		--ignore-scripts \
		--link \
		--no-audit \
		--no-bin-links \
		--no-fund \
		--no-optional \
		--no-package-lock \
		--no-save \
		--no-shrinkwrap
	git checkout -- package.json
	rm -f package-lock.json
	tools/fix-chai-exports.sed -i.bak $@/chai/package.json


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
	@ $(require) base64 perl
	printf \{ > $@
	for i in $(pngs); do \
		printf '\n\t"%s": "%s",' "$${i#test/fixtures/}" `base64 $$i` >> $@; \
	done
	perl -0 -pi -e 's/,\z/\n}\n/' $@


# Regenerate font used for testing HTML <canvas> rendering
font = test/browser/fonts/canvas-test
canvas-font: $(font).woff2
$(font).woff2: $(font).svg
	@ $(require) fontforge woff2_compress
	fontforge 2>/dev/null -lang=ff -c 'Open("$(font).svg"); Generate("$(font).ttf");'
	woff2_compress $(font).ttf
	rm -f $(font).ttf


# Declare a list of programs as recipe dependencies
require = \
	require(){ \
		while [ $$\# -gt 0 ]; do command 2>&1 >/dev/null -v "$$1" || { \
			printf >&2 'Required command `%s` not found\n' "$$1"; \
			return 1; \
		}; shift; done; \
	}; require
