all: lint index.js test

# Generate a CommonJS version of ESM libraries
index.js: index.mjs lib/*.mjs
	npx rollup \
		--no-interop \
		--format cjs \
		--input $< \
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
	npx mocha --require chai/register-expect

.PHONY: test
