{
  "targets": [
    {
      "target_name": "tree_sitter_nominalscript_binding",
      "include_dirs": [
        "<!(node -e \"require('nan')\")",
        "nominalscript/src"
      ],
      "sources": [
        "nominalscript/src/parser.c",
        "nominalscript/src/scanner.c",
        "bindings/node/binding.cc"
      ],
      "cflags_c": [
        "-std=c99",
      ]
    },
  ]
}
