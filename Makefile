ob := (
targets   := index.js browser.js
node-only := $(shell grep -irwF lib -e 'require$(ob)' | cut -d : -f 1 | uniq)
browser   := $(filter-out $(node-only),$(wildcard lib/*.js))

all: $(targets)

# Generate a compiled suite of functions from lib/*.js. Assumes Node environment.
index.js: $(wildcard lib/*.js) $(wildcard lib/classes/*.js)
	printf '"use strict";\n' > $@; \
	cat $^ | sed -Ee '/"use strict";$$/d' >> $@; \
	printf '\nmodule.exports = {\n' >> $@; \
	perl -0777 -ne 'print "$$&\n" while /^(?:function|class)\s+\K(\w+)/gm' $^ \
	| sort --ignore-case \
	| sed -Ee "s/^/$$(printf '\t')/g; s/$$/,/g;" >> $@; \
	printf '};\n\n' >> $@; \
	printf '// Generate non-breaking fs functions\n' >> $@; \
	printf 'Object.assign(module.exports, {\n'       >> $@; \
	printf '\tlstat:     nerf(fs.lstatSync),\n'      >> $@; \
	printf '\trealpath:  nerf(fs.realpathSync),\n'   >> $@; \
	printf '});\n' >> $@

# Generate browser-compatible version of function suite
browser.js: $(browser)
	printf '"use strict";\n' > $@; \
	cat $^ | sed -Ee '/"use strict";$$/d' >> $@


# Run tests
test: test-node test-atom

test-node:
	mocha test

test-atom:
	atom -t test


# Delete all generated targets
clean:
	rm -f $(targets)

.PHONY: clean test test-node test-atom
