module.exports = function defineGrammar(dialect) {
  return grammar(require('tree-sitter-typescript/grammar'), {
    name: dialect,

    precedences: ($, previous) => previous.concat([
      [
        'call',
        $.nominal_wrap_unchecked_expression,
        $.nominal_wrap_expression,
        'unary',
        'binary',
      ],
      [
        $.nominal_type_declaration,
        'type_alias_declaration',
      ],
    ]),

    conflicts: ($, previous) => previous.concat([
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
            optional(
              field('type', $.type_annotation),
              field('nominal_type', optional($.nominal_type_annotation)),
            ),
            ')'
          )
        ),
        field('body', $.statement_block)
      ),

      // Add nominal wrap expressions
      primary_expression: ($, previous) => choice(
        previous,
        $.nominal_wrap_expression,
        $.nominal_wrap_unchecked_expression
      ),

      export_specifier: ($, previous) => choice(
        previous,
        $.nominal_type_identifier_denoted,
      ),

      import_specifier: ($, previous) => choice(
        previous,
        $.nominal_type_identifier_denoted,
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
          field('type', $.type_annotation)
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
        ';',
        field('name', $._nominal_type_identifier),
        field('nominal_type_parameters', optional($.nominal_type_parameters)),
        field('nominal_inherited_types', repeat($.nominal_type_annotation)),
        field('type', optional($.type_annotation)),
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

      nominal_type_annotation: $ => seq(';', $._nominal_type),

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
        $._primary_nominal_type,
        $.function_nominal_type,
      ),

      optional_nominal_type: $ => seq($._nominal_type, '?'),

      _tuple_nominal_type_member: $ => choice(
        alias($.tuple_parameter, $.required_parameter),
        alias($.optional_tuple_parameter, $.optional_parameter),
        $.optional_nominal_type,
        $._nominal_type,
      ),

      _primary_nominal_type: $ => choice(
        $._nominal_type_identifier,
        $.parenthesized_nominal_type,
        $.generic_nominal_type,
        // Literals may be implicitly casted to these types
        $.predefined_nominal_type,
        $.object_nominal_type,
        $.array_nominal_type,
        $.tuple_nominal_type,
      ),

      generic_nominal_type: $ => prec('call', seq(
        field('name', choice(
          $._nominal_type_identifier,
        )),
        field('nominal_type_arguments', $.nominal_type_arguments)
      )),

      parenthesized_nominal_type: $ => seq(
        '(', $._nominal_type, ')'
      ),

      predefined_nominal_type: $ => choice(
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
      ),

      type_arguments: $ => seq(
        '<', commaSep1(choice($._type, $.nominal_type_denoted)), optional(','), '>'
      ),

      nominal_type_denoted: $ => seq(
        ';',
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

      nominal_property_signature: $ => seq(
        field('name', $._property_name),
        field('type', optional($.nominal_type_annotation))
      ),

      type_parameters: $ => seq(
        '<', commaSep1(choice($.type_parameter, $.nominal_type_identifier_denoted)), optional(','), '>'
      ),

      nominal_type_identifier_denoted: $ => seq(
        ';',
        $._nominal_type_identifier
      ),

      nominal_type_parameters: $ => seq(
        '<', commaSep1($._nominal_type_identifier), optional(','), '>'
      ),

      array_nominal_type: $ => seq($._primary_nominal_type, '[', ']'),
      tuple_nominal_type: $ => seq(
        '[', commaSep($._tuple_nominal_type_member), optional(','), ']'
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
