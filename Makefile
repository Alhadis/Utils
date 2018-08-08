targets := index.js browser.js
sources := $(wildcard lib/*.js)

all: $(targets)

# Generate a compiled suite of functions from lib/*.js. Assumes Node environment.
index.js: $(wildcard lib/*.js)
	printf '"use strict";\n' > $@; \
	cat $^ | sed -Ee '/"use strict";$$/d' >> $@; \
	printf '\nmodule.exports = {\n' >> $@; \
	perl -0777 -ne 'print "$$&\n" while /^(?:(?:async\s+)?function|class)\s+\K(\w+)/gm' $^ \
	| sort --ignore-case \
	| sed -Ee "s/^/$$(printf '\t')/g; s/$$/,/g;" >> $@; \
	printf '};\n' >> $@;

# Generate browser-compatible version of function suite
browser.js: $(filter-out lib/node.js,$(sources))
	printf '"use strict";\n' > $@; \
	cat $^ | sed -Ee '/"use strict";$$/d' >> $@

# Run unit tests
test:
	mocha test

# Delete all generated targets
clean:
	rm -f $(targets)

.PHONY: clean test
