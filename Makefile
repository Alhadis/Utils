\n := $$'\n'
ob := (

targets   := index.js browser.js
node-only := $(shell grep -irwF lib -e 'require$(ob)' | cut -d : -f 1 | uniq)
browser   := $(filter-out $(node-only),$(wildcard lib/*.js))

all: $(targets)

# Generate a compiled suite of functions from lib/*.js. Assumes Node environment.
index.js: $(wildcard lib/*.js) $(wildcard lib/classes/*.js)
	@echo '"use strict";' > $@
	@cat $^ | sed -Ee '/"use strict";$$/d' >> $@
	@printf $(\n)"module.exports = {"$(\n) >> $@
	@perl -0777 -ne 'print "$$&\n" while /^(?:function|class)\s+\K(\w+)/gm' $^ \
	| sort --ignore-case \
	| sed -e 's/^/\t/g; s/$$/,/g;' >> $@;
	@printf "};"$(\n) >> $@;

# Generate browser-compatible version of function suite
browser.js: $(browser)
	@echo '"use strict";' > $@
	@cat $^ | sed -Ee '/"use strict";$$/d' >> $@

clean:
	@rm -f $(targets)

.PHONY: clean
