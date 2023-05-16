; Exports
(export_specifier (nominal_type_identifier) @nominal.export_id alias: (identifier)? @alias.export_id)
(export_specifier (identifier) @value.export_id alias: (identifier)? @alias.export_id)
(export_statement (nominal_type_declaration (nominal_type_identifier) @nominal.export_id))
(export_statement (function_declaration (identifier) @value.export_id))
(export_statement (function_signature (identifier) @value.export_id))
(export_statement (lexical_declaration (variable_declarator (identifier) @value.export_id)))
(export_statement (variable_declaration (variable_declarator (identifier) @value.export_id)))

; Imports
(import_statement) @import

; Nominal type declarations (local and module-root)
(nominal_type_declaration) @nominal_type.decl

; Function declarations (local and module-root)
(function_declaration) @function.decl
(generator_function_declaration) @function.decl
(function_signature) @function.decl

; Value declarations (local and module-root)
(variable_declarator) @value.decl
