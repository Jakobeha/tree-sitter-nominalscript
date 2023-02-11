module.exports = function defineGrammar(dialect) {
  return grammar(require('tree-sitter-typescript/typescript/grammar'), {
    name: dialect,

    externals: ($, previous) => previous.concat([
      $._nominal_token,
    ]),

    precedences: ($, previous) => previous.concat([
      [
        $.nominal_type_declaration,
        $.nominal_type_annotation,
        $._primary_nominal_type,
      ],
      [
        $.nominal_type_declaration,
        $._property_name,
        $._primary_nominal_type,
      ],
      [
        $.nominal_type_declaration,
        $.primary_expression
      ],
      [
        $.nominal_wrap_unchecked_expression,
        $.nominal_wrap_expression,
      ],
      [
        $.nominal_formal_parameters,
        $.parenthesized_nominal_type,
      ],
      [
        'nominal_wrap_expression',
        $.expression,
      ],
      [
        'nominal_wrap_expression',
        $.subscript_expression,
      ],
      [
        'nominal_wrap_expression',
        $.member_expression,
      ],
      [
        $.rest_pattern,
        $._primary_nominal_type,
      ],
      [
        $.type_query,
        $._primary_nominal_type,
      ],
    ]),

    conflicts: ($, previous) => previous.concat([
      [$.primary_expression, $._primary_nominal_type],
      [$.primary_expression, $.generic_nominal_type],
      [$.primary_expression, $._property_name, $._primary_nominal_type],
      [$.primary_expression, $._property_name, $.generic_nominal_type],
      [$.primary_expression, $.pattern, $._primary_nominal_type],
      [$.primary_expression, $._primary_type, $._primary_nominal_type],
      [$.primary_expression, $.generic_type, $.generic_nominal_type],
      [$.primary_expression, $.pattern, $._primary_type, $._primary_nominal_type],
      [$.pattern, $._primary_nominal_type],
      [$._primary_type, $._primary_nominal_type],
      [$.pattern, $._primary_type, $._primary_nominal_type],
      [$.type_parameter, $.nominal_type_parameters],
      [$.formal_parameters, $.nominal_formal_parameters],
      [$.property_signature, $.nominal_property_signature],
      [$.array, $.tuple_nominal_type],
      [$.array, $.array_pattern, $.tuple_nominal_type],
      [$.array, $.tuple_type, $.tuple_nominal_type],
      [$.array, $.array_pattern, $.tuple_type, $.tuple_nominal_type],
      [$.array_pattern, $.tuple_nominal_type],
      [$.tuple_type, $.tuple_nominal_type],
      [$.array_pattern, $.tuple_type, $.tuple_nominal_type],
      [$.optional_tuple_parameter, $._primary_nominal_type],
      [$.optional_tuple_parameter, $._primary_type, $._primary_nominal_type],
      [$._tuple_type_member, $._nominal_type],
      [$.object, $.object_nominal_type],
      [$.object, $.object_pattern, $.object_nominal_type],
      [$.object, $.object_type, $.object_nominal_type],
      [$.object, $.object_pattern, $.object_type, $.object_nominal_type],
      [$.object_pattern, $.object_nominal_type],
      [$.object_pattern, $.object_type, $.object_nominal_type],
      [$.object_type, $.object_nominal_type],
      [$.statement_block, $.object, $.object_nominal_type],
      [$.empty_statement, $.object_nominal_type],
      [$._primary_type, $.type_parameter, $.nominal_type_parameters],
      [$._primary_nominal_type, $.nominal_type_identifier_denoted],
    ]),

    supertypes: ($, previous) => previous.concat([
      $._primary_nominal_type,
    ]),

    inline: ($, previous) => previous.concat([
      $._nominal_type_identifier,
    ]),

    rules: {
      // Add optional nominal type annotation to a lot of these nodes
      // (this is what we do to each rule unless otherwise noted)
      public_field_definition: $ => seq(
        optional('declare'),
        optional($.accessibility_modifier),
        choice(
          seq(optional('static'), optional($.override_modifier), optional('readonly')), 
          seq(optional('abstract'), optional('readonly')),
          seq(optional('readonly'), optional('abstract')),
        ),
        field('name', $._property_name),
        optional(choice('?', '!')),
        field('type', optional($.type_annotation)),
        field('nominal_type', optional($.nominal_type_annotation)),
        optional($._initializer)
      ),


      catch_clause: $ => seq(
        'catch',
        optional(
          seq(
            '(',
            field(
              'parameter',
              choice($.identifier, $._destructuring_pattern)
            ),
            // note that it's optional(field(...)) in the original grammar...
            // is there a difference?
            field('type', optional($.type_annotation)),
            field('nominal_type', optional($.nominal_type_annotation)),
            ')'
          )
        ),
        field('body', $.statement_block)
      ),

      // Add nominal wrap expressions
      primary_expression: ($, previous) => choice(
        previous,
        $.nominal_wrap_expression,
        $.nominal_wrap_unchecked_expression,
      ),

      nominal_wrap_expression: $ => prec('nominal_wrap_expression', seq(
        $._nominal_type,
        $._nominal_token,
        $.primary_expression,
      )),

      nominal_wrap_unchecked_expression: $ => prec('nominal_wrap_expression', seq(
        $._nominal_type,
        '!',
        $._nominal_token,
        $.primary_expression,
      )),

      export_specifier: ($, previous) => choice(
        previous,
        $.nominal_import_export_specifier,
      ),

      import_specifier: ($, previous) => choice(
        previous,
        $.nominal_import_export_specifier,
      ),

      nominal_import_export_specifier: $ => seq(
        $._nominal_token,
        $._nominal_type_identifier,
        field('as', optional(seq('as', $.identifier))),
      ),

      variable_declarator: $ => choice(
        seq(
          field('name', choice($.identifier, $._destructuring_pattern)),
          field('type', optional($.type_annotation)),
          field('nominal_type', optional($.nominal_type_annotation)),
          optional($._initializer)
        ),
        prec('declaration', seq(
          field('name', $.identifier),
          '!',
          field('type', $.type_annotation),
          field('nominal_type', optional($.nominal_type_annotation)),
        )),
        prec('declaration', seq(
          field('name', $.identifier),
          '!',
          field('nominal_type', $.nominal_type_annotation),
        ))
      ),

      parenthesized_expression: $ => seq(
        '(',
        choice(
          seq(
            $.expression,
            field('type', optional($.type_annotation)),
            field('nominal_type', optional($.nominal_type_annotation)),
          ),
          $.sequence_expression
        ),
        ')'
      ),

      declaration: ($, previous) => choice(
        previous,
        $.nominal_type_declaration,
      ),

      nominal_type_declaration: $ => seq(
        'type',
        $._nominal_token,
        field('name', $._nominal_type_identifier),
        field('nominal_type_parameters', optional($.nominal_type_parameters)),
        field('type', optional($.type_annotation)),
        field('nominal_inherited_types', repeat(prec(500, $.nominal_type_annotation))),
        field('guard', optional($.nominal_type_guard)),
        $._semicolon
      ),

      nominal_type_guard: $ => seq(
        'guard',
        '(',
        field('bound', $._identifier),
        ')',
        field('body', $.statement_block)
      ),

      required_parameter: $ => seq(
        $._parameter_name,
        field('type', optional($.type_annotation)),
        field('nominal_type', optional($.nominal_type_annotation)),
        optional($._initializer)
      ),

      optional_parameter: $ => seq(
        $._parameter_name,
        '?',
        field('type', optional($.type_annotation)),
        field('nominal_type', optional($.nominal_type_annotation)),
        optional($._initializer)
      ),

      nominal_type_annotation: $ => prec.dynamic(999, seq(
        $._nominal_token, 
        $._nominal_type,
      )),

      tuple_parameter: $ => seq(
        field('name', choice($.identifier, $.rest_pattern)),
        field('type', $.type_annotation),
        field('nominal_type', optional($.nominal_type_annotation)),
      ),

      optional_tuple_parameter: $ => seq(
        field('name', $.identifier),
        '?',
        field('type', $.type_annotation),
        field('nominal_type', optional($.nominal_type_annotation)),
      ),

      _nominal_type: $ => prec.dynamic(-500, choice(
        $._primary_nominal_type,
        $.function_nominal_type,
        $.nullable_nominal_type,
      )),

      nullable_nominal_type: $ => seq($._primary_nominal_type, '?'),

      _primary_nominal_type: $ => choice(
        $._nominal_type_identifier,
        $.parenthesized_nominal_type,
        $.generic_nominal_type,
        // Literals may be implicitly casted to these types
        // TODO: This confuses tree-sitter because it seems to lex this when it shouldn't,
        //   so for now we just parse these as nominal_type_identifier
        // $.predefined_nominal_type,
        $.object_nominal_type,
        $.array_nominal_type,
        $.tuple_nominal_type,
      ),

      generic_nominal_type: $ => prec('call', seq(
        field('name', $._nominal_type_identifier),
        field('nominal_type_arguments', $.nominal_type_arguments)
      )),

      parenthesized_nominal_type: $ => seq(
        '(', $._nominal_type, ')'
      ),

      /* predefined_nominal_type: $ => choice(
        'Number',
        'Integer',
        'Float',
        'Boolean',
        'String',
        'Symbol',
        'Any',
        'Never',
        'Object',
        'Array',
        'Function',
      ), */

      type_arguments: $ => seq(
        '<', commaSep1(choice($._type, $.nominal_type_denoted)), optional(','), '>'
      ),

      nominal_type_denoted: $ => seq(
        $._nominal_token,
        $._nominal_type
      ),

      nominal_type_arguments: $ => seq(
        '<', commaSep1($._nominal_type), optional(','), '>'
      ),

      object_nominal_type: $ => prec.dynamic(-100, seq(
        choice('{', '{|'),
        optional(seq(
          optional(choice(',', ';')),
          sepBy1(
            choice(',', $._semicolon),
            choice(
              $.nominal_property_signature,
              $.nominal_method_signature
            )
          ),
          optional(choice(',', $._semicolon))
        )),
        choice('}', '|}')
      )),

      property_signature: $ => seq(
        optional($.accessibility_modifier),
        optional('static'),
        optional($.override_modifier),
        optional('readonly'),
        field('name', $._property_name),
        optional('?'),
        field('type', optional($.type_annotation)),
        field('nominal_type', optional($.nominal_type_annotation)),
      ),

      nominal_property_signature: $ => seq(
        field('name', $._property_name),
        field('type', $.nominal_type_annotation)
      ),

      _call_signature: $ => seq(
        field('type_parameters', optional($.type_parameters)),
        field('parameters', $.formal_parameters),
        field('return_type', optional(
          choice($.type_annotation, $.asserts, $.type_predicate_annotation)
        )),
        field('nominal_return_type', optional($.nominal_type_annotation)),
      ),

      nominal_method_signature: $ => seq(
        field('name', $._property_name),
        field('nominal_type_parameters', optional($.nominal_type_parameters)),
        field('parameters', $.nominal_formal_parameters),
        field('return_type', optional($.nominal_type_annotation)),
      ),

      type_parameters: $ => seq(
        '<', commaSep1(choice($.type_parameter, $.nominal_type_identifier_denoted)), optional(','), '>'
      ),

      nominal_type_identifier_denoted: $ => seq(
        $._nominal_token,
        $._nominal_type_identifier,
      ),

      nominal_type_parameters: $ => seq(
        '<', commaSep1($._nominal_type_identifier), optional(','), '>'
      ),

      array_nominal_type: $ => seq($._primary_nominal_type, '[', ']'),
      tuple_nominal_type: $ => seq(
        '[', commaSep($._nominal_type), optional(','), ']'
      ),

      function_nominal_type: $ => prec.left(seq(
        field('nominal_type_parameters', optional($.nominal_type_parameters)),
        field('parameters', $.nominal_formal_parameters),
        '=>',
        field('return_type', $._nominal_type),
      )),

      nominal_formal_parameters: $ => seq(
        '(',
        optional(seq(
          commaSep1($._nominal_type),
          optional(',')
        )),
        ')',
      ),

      _nominal_type_identifier: $ => alias($.identifier, $.nominal_type_identifier),

      /* nominal_type_identifier: $ => {
        const uppercaseAlpha = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/;
        const alphanumeric = /[^\x00-\x1F\s\p{Zs}:;`"'@#.,|^&<=>+\*-/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/;
        return token(prec(2, seq(uppercaseAlpha, repeat(alphanumeric))));
      }, */

      _reserved_identifier: ($, previous) => choice(
        'guard',
        previous
      ),
    },
  });
}

function commaSep1 (rule) {
  return sepBy1(',', rule);
}

function commaSep (rule) {
  return sepBy(',', rule);
}

function sepBy (sep, rule) {
  return optional(sepBy1(sep, rule))
}

function sepBy1 (sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}
