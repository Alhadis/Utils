#!/usr/bin/sed -f

# Fix deprecated subpath mappings (chaijs/chai#1387)
/^ *"exports": *{/, /^  },\{0,1\}$/ {
	/^ *"\.\/": *"\.\/",\{0,1\}$/ {
		s#/":#/*":#
		s#/"#/*.js"#
	}
}
