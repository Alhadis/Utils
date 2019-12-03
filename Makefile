all: index.js lint test

# Generate a CommonJS version of ESM libraries
index.js: index.mjs lib/*.mjs
	npx rollup \
		--silent \
		--format cjs \
		--preferConst \
		--no-interop \
		--sourcemap \
		--sourcemapExcludeSources \
		--input index.mjs \
		--file $@
	npx jg typewrite \
		--exclude BlendModes \
		--declare const BlendModes '{[key: string]: (...args: number[]) => number};' \
		--header '// Generated file; run `make types` to update.' \
		--sort index.js
	npx terser \
		--keep-classnames \
		--mangle \
		--compress \
		--source-map "content=$@.map,url=$(@F).map" \
		--output $@ $@


# Nuke generated CJS bundle
clean:
	rm -f index.js*

.PHONY: clean


# Check source for errors and style violations
lint:
	npx jg lint

.PHONY: lint


# Run unit-tests
test: index.js
	npx mocha

.PHONY: test



# Regenerate a base64-encoded list of PNG fixtures
pngs = test/fixtures/rgba/*.png
test/fixtures/base64/rgba.json:
	@ command -v base64 2>&1 >/dev/null || { echo "base64 command not found"; exit 1; };
	printf \{ > $@
	for i in $(pngs); do \
		printf '\n\t"%s": "%s",' "$${i#test/fixtures/}" `base64 $$i` >> $@; \
	done
	perl -0 -pi -e 's/,\z/\n}\n/' $@
