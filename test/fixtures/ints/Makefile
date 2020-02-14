lists = int8.mjs int16.mjs int32.mjs int64.mjs

all: test

test: $(lists)
	NODE_NO_WARNINGS=1 node run-tests.mjs

$(lists): write-ints
	echo $@ | tr -d .a-zA-Z | xargs ./$^ > $@
	node -c $@

write-ints: write-ints.c
	cc -o $@ $^


# Nuke generated targets and build artefacts
clean:
	rm -f $(lists) write-ints

.PHONY: clean
