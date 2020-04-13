Utils
=====

This is an eclectic collection of utility functions I've written over the years.
Like most of my projects, it doesn't have a name; it's simply called whatever it
exists to do. Hence the uncreatively generic name `Utils`, an apt descriptor for
something which started life as a [PasteBin snippet dump][1].

[1]: https://pastebin.com/CRCaVN99

These functions share little in common with each other, each having been written
for different projects with very different time allocations. They vary vastly in
usefulness, specificity, and readability; their only consistent quality is being
able to work in isolation. Anything not 100% self-contained has its dependencies
listed in [JSDoc](https://jsdoc.app):

~~~js
/**
 * @uses {@link foo}, {@link bar}
 */
function fooBar(){
	return foo() + bar();
}
~~~
