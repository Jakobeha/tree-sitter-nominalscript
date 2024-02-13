module.exports = function defineGrammar(dialect) {
  return grammar(require('tree-sitter-typescript/typescript/grammar'), {
    name: dialect,

    precedences: ($, previous) => previous.concat([
      ['nominal_wrap', 'unary', 'binary', $.await_expression, $.arrow_function],
      [$.generic_nominal_type, $._primary_nominal_type],
      [$._optional_nominal_type, $.parenthesized_nominal_type],
      [$.array_nominal_type, $._nominal_type],
      [$.nominal_type_guard, $.nominal_type_declaration],
    ]),

    conflicts: ($, previous) => previous.concat([
      [$.nominal_type_parameter, $._primary_nominal_type],
      [$.nominal_type_parameter, $._atomic_nominal_type],
    ]),

    supertypes: ($, previous) => previous.concat([
      $._primary_nominal_type,
    ]),

    inline: ($, previous) => previous.concat([
      $._nominal_type_identifier,
      $._nominal_remaining_parameters
    ]),

    rules: {
      // Add optional nominal type annotation to a lot of these nodes
      // (this is what we do to each rule unless otherwise noted)
      public_field_definition: $ => seq(
        repeat(field('decorator', $.decorator)),
        optional(choice(
            seq('declare', optional($.accessibility_modifier)),
            seq($.accessibility_modifier, optional('declare')),
        )),
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
      expression: ($, previous) => choice(
        previous,
        $.nominal_wrap_expression,
        $.nominal_wrap_unchecked_expression,
      ),

      nominal_wrap_expression: $ => prec.left('nominal_wrap', seq(
        $.expression,
        'as:',
        $._nominal_type,
      )),

      nominal_wrap_unchecked_expression: $ => prec.left('nominal_wrap', seq(
        $.expression,
        'as!:',
        $._nominal_type,
      )),

      export_specifier: ($, previous) => choice(
        previous,
        $._nominal_import_export_specifier,
      ),

      import_specifier: ($, previous) => choice(
        previous,
        $._nominal_import_export_specifier,
      ),

      _nominal_import_export_specifier: $ => seq(
        ':',
        $._nominal_type_identifier,
        optional(seq(
          'as',
          field('alias', $.identifier)
        )),
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
        'type:',
        field('name', $._nominal_type_identifier),
        field('nominal_type_parameters', optional($.nominal_type_parameters)),
        field('nominal_supertypes', optional($.nominal_supertypes)),
        field('type', optional($.typescript_supertype)),
        field('guard', optional($.nominal_type_guard)),
        $._semicolon
      ),

      typescript_supertype: $ => seq(
        // Can't lex <: directly because it will also lex in `function foo<:T>() {}`
        '<:',
        $._type
      ),

      nominal_supertypes: $ => seq(
        '<::',
        sepBy1('&', $._nominal_type)
      ),

      nominal_type_guard: $ => seq(
        // Optional semicolon makes this parseable
        //   type; Foo<cov A, con B, inv C, biv B <; C>
        //       <: number
        //       <; (this; A) => Void & (this; B, Bar) => Void & (this; C, ...Baz) => <cov D>(this; D ,) => Void
        //       guard(this) { return !guard(this, cov, con, inv, biv); }
        optional($._automatic_semicolon),
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

      nominal_type_annotation: $ => seq(
        '::',
        $._nominal_type,
      ),

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

      _nominal_type: $ => choice(
        $.function_nominal_type,
        $._primary_nominal_type,
      ),

      nullable_nominal_type: $ => seq($._primary_nominal_type, '?'),

      _primary_nominal_type: $ => choice(
        $._atomic_nominal_type,
        $.generic_nominal_type,
        $.parenthesized_nominal_type,
        $.object_nominal_type,
        $.array_nominal_type,
        $.tuple_nominal_type,
        $.nullable_nominal_type,
      ),

      generic_nominal_type: $ => prec('call', seq(
        field('name', $._atomic_nominal_type),
        field('nominal_type_arguments', $.nominal_type_arguments)
      )),

      parenthesized_nominal_type: $ => seq(
        '(', $._nominal_type, ')'
      ),

      type_arguments: $ => seq(
        '<', commaSep1(choice(
          $._nominal_type_denoted,
          $._type,
          alias($._type_query_member_expression_in_type_annotation, $.member_expression),
          alias($._type_query_call_expression_in_type_annotation, $.call_expression),
        )), optional(','), '>'
      ),

      _nominal_type_denoted: $ => seq(
        ':',
        $._nominal_type
      ),

      nominal_type_arguments: $ => seq(
        '<', commaSep1($._nominal_type), optional(','), '>'
      ),

      object_nominal_type: $ => seq(
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
      ),

      property_signature: $ => seq(
        optional($.accessibility_modifier),
        optional('static'),
        optional($.override_modifier),
        optional('readonly'),
        field('name', $._property_name),
        field('is_optional', optional('?')),
        field('type', optional($.type_annotation)),
        field('nominal_type', optional($.nominal_type_annotation)),
      ),

      nominal_property_signature: $ => seq(
        field('name', $._property_name),
        field('is_optional', optional('?')),
        field('type', $.nominal_type_annotation)
      ),

      _call_signature: $ => seq(
        field('type_parameters', optional($.type_parameters)),
        field('parameters', $.formal_parameters),
        field('return_type', optional(
          choice($.type_annotation, $.asserts_annotation, $.type_predicate_annotation),
        )),
        field('nominal_return_type', optional($.nominal_type_annotation)),
      ),

      nominal_method_signature: $ => seq(
        field('name', $._property_name),
        field('is_optional', optional('?')),
        field('nominal_type_parameters', optional($.nominal_type_parameters)),
        field('parameters', $.nominal_formal_parameters),
        field('return_type', $.nominal_type_annotation),
      ),

      type_parameters: $ => seq(
        '<', commaSep1(choice($._nominal_type_parameter_denoted, $.type_parameter)), optional(','), '>'
      ),

      _nominal_type_parameter_denoted: $ => seq(
        ':',
        $.nominal_type_parameter,
      ),

      nominal_type_parameters: $ => seq(
        '<', commaSep1($.nominal_type_parameter), optional(','), '>'
      ),

      nominal_type_parameter: $ => seq(
        field('variance', optional(choice('biv', 'cov', 'con', 'inv'))),
        $._nominal_type_identifier,
        optional($.nominal_supertypes)
      ),

      array_nominal_type: $ => seq($._primary_nominal_type, '[', ']'),
      tuple_nominal_type: $ => seq(
        '[', commaSep($._optional_nominal_type), optional(','), ']'
      ),

      _optional_nominal_type: $ => choice($.optional_nominal_type, $._nominal_type),

      optional_nominal_type: $ => seq('?', $._nominal_type),

      function_nominal_type: $ => prec.left(seq(
        field('nominal_type_parameters', optional($.nominal_type_parameters)),
        field('parameters', $.nominal_formal_parameters),
        '=>',
        field('return_type', $._nominal_type),
      )),

      nominal_formal_parameters: $ => seq(
        '(',
        optional(choice(
          seq(
            'this', '::', field('this_type', $._nominal_type),
            optional(seq(',', optional($._nominal_remaining_parameters))),
          ),
          $._nominal_remaining_parameters
        )),
        ')',
      ),

      _nominal_remaining_parameters: $ => choice(
        seq(
          commaSep1($._optional_nominal_type),
          optional(seq(',', optional($._nominal_rest_parameter)))
        ),
        $._nominal_rest_parameter,
      ),

      _nominal_rest_parameter: $ => seq(
        '...',
        field('rest_type', $._nominal_type),
        optional(','), // trailing comma
      ),

      _atomic_nominal_type: $ => choice(
        $._nominal_type_identifier,
        // Literals may be implicitly casted to these types
        $.predefined_nominal_type_identifier,
      ),

      predefined_nominal_type_identifier: $ => choice(
        'Number',
        'Int',
        'Float',
        'Bool',
        'String',
        'Symbol',
        'Any',
        'Never',
        'Object',
        'Array',
        'Function',
      ),

      _nominal_type_identifier: $ => alias($.identifier, $.nominal_type_identifier),

      // nominal_type_identifier: $ => {
      //   const uppercaseAlpha = /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/;
      //   const alphanumeric = /[^\x00-\x1F\s\p{Zs}:;`"'@#.,|^&<=>+\*-/\\%?!~()\[\]{}\uFEFF\u2060\u200B]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/;
      //   return token(prec(2, seq(uppercaseAlpha, repeat(alphanumeric))));
      // },

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
