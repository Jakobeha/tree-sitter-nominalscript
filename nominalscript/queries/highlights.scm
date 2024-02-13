; inherits typescript
; Keywords

"guard" @keyword

; Punctuation

("<" . ";") @operator

";" @punctuation.delimiter
(nullable_nominal_type "?" @punctuation.delimiter)
(optional_nominal_type "?" @punctuation.special)
(nominal_property_signature "?" @punctuation.special)
(nominal_method_signature "?" @punctuation.special)

; (nominal_wrap_expression ";" @punctuation.special)
; (nominal_wrap_unchecked_expression ["!" ";"] @punctuation.special)

; (nominal_type_annotation ";" @punctuation.delimiter)

; Types

(nominal_type_identifier) @type
(predefined_nominal_type_identifier) @type.builtin

(nominal_type_arguments
  "<" @punctuation.bracket
  ">" @punctuation.bracket)
(nominal_type_parameters
  "<" @punctuation.bracket
  ">" @punctuation.bracket)
(nominal_formal_parameters "this" @variable.builtin)

; Parameters
(nominal_type_guard
  bound: (identifier) @parameter)

; Method signatures
(nominal_method_signature name: (_) @method)

; Property signatures
(property_signature
  name: (property_identifier) @method
  nominal_type: (nominal_type_annotation 
                  [(function_nominal_type)
                   (nullable_nominal_type (parenthesized_nominal_type (function_nominal_type)))]))

(nominal_property_signature
  name: (property_identifier) @method
  type: (nominal_type_annotation
          [(function_nominal_type)
           (nullable_nominal_type (parenthesized_nominal_type (function_nominal_type)))]))
