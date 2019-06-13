all: lint index.js test

# Generate a CommonJS version of ESM libraries
index.js: index.mjs lib/*.mjs
	npx rollup \
		--format cjs \
		--input index.mjs \
		--file $@
	npx eslint --fix --no-ignore $@
	sed -i~ -e '/__esModule/ s/{ \(value: true\) }/{\1}/' $@ && rm -f $@~


# Nuke generated CJS bundle
clean:
	rm -f index.js

.PHONY: clean


# Check source for errors and style violations
lint:
	npx eslint --ext mjs,js .

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
