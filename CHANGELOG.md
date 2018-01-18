Change Log
==========

This project honours [Semantic Versioning](http://semver.org/).

[Unpublished]: ../../compare/v0.1.3...HEAD


[v0.1.3]
------------------------------------------------------------------------
**January 18th, 2018**  
Fixed an oversight where `normalisePath` would mangle a well-formed URL.
This impacted Nuclide's support for [`file-icons`][], which passed local
and remote resource paths in tandem. See [`Alhadis/Atom-FS#1`][].

* [[`120f059`][]] Avoid normalising well-formed URIs by default
* [[`09b8eaf`][]] Add and refurbish an old tweening function
* [[`9168bb3`][]] Add function to retrieve all property descriptors

[`Alhadis/Atom-FS#1`]: https://github.com/Alhadis/Atom-FS/pull/1
[`file-icons`]: https://github.com/file-icons/atom
[`120f059`]: ../../commit/120f05906bb5653b90badb3eba4b09
[`09b8eaf`]: ../../commit/09b8eafd72d090832cb40b57514eae
[`9168bb3`]: ../../commit/9168bb357bc60ee2924d2f0f445285
[v0.1.3]: https://github.com/Alhadis/Utils/releases/tag/v0.1.3



[v0.1.2]
------------------------------------------------------------------------
**March 22nd, 2017**  
Reregistered package without scoped-name due to [`atom/apm#702`][].

[`atom/apm#702`]: https://github.com/atom/apm/issues/702
[v0.1.2]: https://github.com/Alhadis/Utils/releases/tag/v0.1.2



[v0.1.1]
------------------------------------------------------------------------
**March 20th, 2017**  
* [[`0bfefb9`][]] Added [`browser.js`][] to distributed files
* [[`3ee8eba`][]] Added [`MappedDisposable`][] to main exports

[`browser.js`]: ./browser.js
[`MappedDisposable`]: ./lib/classes/mapped-disposable.js
[`0bfefb9`]: ../../commit/0bfefb9b7b3a245aa8fdfd105a3531
[`3ee8eba`]: ../../commit/3ee8eba93293bd32545275fc09776a
[v0.1.1]: https://github.com/Alhadis/Utils/releases/tag/v0.1.1


[v0.1.0]
------------------------------------------------------------------------
**March 16th, 2017**  
Initial release. Features refactored and tidied functions distilled from
a now‑abandoned [snippets repo](https://github.com/Alhadis/Snippets).

[v0.1.0]: https://github.com/Alhadis/Utils/releases/tag/v0.1.0
