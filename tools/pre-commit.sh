#!/bin/sh
set -e

# Sanity check
test -x tools/check-sorted.mjs || {
	printf 'Failed to locate %s; bailing\n' "$_"
	exit 2
}

# Avoid committing new functions or tests that're incorrectly sorted
files=`git diff --cached --name-only HEAD | grep -e '^\(lib\|test\)/.*\.mjs$' || true`
[ -z "$files" ] || tools/check-sorted.mjs $files
