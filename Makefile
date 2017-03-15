all: index.js

\n := $$'\n'

index.js: $(wildcard lib/*.js) lib/classes/pattern-lists.js
	@echo '"use strict";' > $@
	@cat $^ | sed -Ee '/"use strict";$$/d' >> $@
	@printf $(\n)"module.exports = {"$(\n) >> $@
	@perl -0777 -ne 'print "$$&\n" while /^(?:function|class)\s+\K(\w+)/gm' $^ \
	| sort --ignore-case \
	| sed -e 's/^/\t/g; s/$$/,/g;' >> $@;
	@printf "};"$(\n) >> $@;

clean:
	@rm -f index.js

.PHONY: clean
