tree-sitter-nominalscript
===========================

[![Build Status](https://github.com/Jakobeha/tree-sitter-nominalscript/workflows/build/badge.svg)](https://github.com/Jakobeha/tree-sitter-nominalscript/actions?query=workflow%3Abuild)

[Nominalscript](https://github.com/Jakobeha/nominalscript.git) grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

This is derived from [tree-sitter-typescript](https://github.com/tree-sitter/tree-sitter-typescript). As such, the grammar is inside the `nominalscript` folder/field. In the future there may be an NSX equivalent, but probably not.

```js
require('tree-sitter-nominalscript').nominalscript; // Nominalscript grammar
```

## How to use / install / test

See [tree-sitter's documentation](https://tree-sitter.github.io/tree-sitter/)


## Package Structure

This follows [tree-sitter-typescript's](https://github.com/tree-sitter/tree-sitter-typescript) package structure.

- `common/`: This is where basically all of the grammar is implemented and tested (not `src`)
  - `define-grammar.js`: This is where most the grammar is implemented.
  - `scanner.h`: A custom scanner for the `;` in expressions
  - `corpus/nominalscript/declarations.txt`: Tests the NominalScript grammar. These are run by `tree-sitter test`
- `queries/`: Provides some nominalscript queries for syntax highlighters like NeoVim
