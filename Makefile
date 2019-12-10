all: lint types test


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


# Check source for errors and style violations
lint:
	npx jg lint

.PHONY: lint


# Run unit-tests
test:
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
