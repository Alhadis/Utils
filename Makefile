all: lint index.js test

# Generate a CommonJS version of ESM libraries
index.js: index.mjs
	npx rollup \
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

index.mjs: lib/*.mjs
	(for file in lib/*.mjs; do printf 'export * from "./%s";\n' "$$file"; done) | sort > $@
	mv $@ tmp.$@
	npx rollup \
		--format esm \
		--sourcemap \
		--sourcemapExcludeSources \
		--file $@ tmp.$@
	rm -f tmp.$@
	perl -pi~ -E '\
		s/new\s+Array\((\d+)\)/$$1<10?"[".","x$$1."]":$$&/ge; \
		s/await import\(/require\(/g;' $@ && rm -f "$@~"


# Nuke generated CJS bundle
clean:
	rm -f index.js
	rm -f index.mjs
	rm -f *.map

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
