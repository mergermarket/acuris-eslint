const eslintSupport = require('../core/eslint-support')

const quickPrettierRules = {
  'padding-line-between-statements': [
    1,
    {
      blankLine: 'always',
      next: 'import',
      prev: 'let'
    },
    {
      blankLine: 'always',
      next: 'import',
      prev: 'var'
    },
    {
      blankLine: 'always',
      next: '*',
      prev: 'directive'
    },
    {
      blankLine: 'always',
      next: '*',
      prev: 'function'
    },
    {
      blankLine: 'always',
      next: 'function',
      prev: '*'
    },
    {
      blankLine: 'always',
      next: '*',
      prev: 'class'
    },
    {
      blankLine: 'always',
      next: 'class',
      prev: '*'
    },
    {
      blankLine: 'always',
      next: 'export',
      prev: '*'
    },
    {
      blankLine: 'always',
      next: '*',
      prev: 'export'
    },
    {
      blankLine: 'always',
      next: 'cjs-export',
      prev: '*'
    },
    {
      blankLine: 'always',
      next: '*',
      prev: 'cjs-export'
    },
    {
      blankLine: 'always',
      next: 'cjs-import',
      prev: 'let'
    },
    {
      blankLine: 'always',
      next: 'cjs-import',
      prev: 'var'
    },
    {
      blankLine: 'always',
      next: 'cjs-import',
      prev: 'import'
    },
    {
      blankLine: 'always',
      next: 'import',
      prev: 'cjs-import'
    },
    {
      blankLine: 'always',
      next: 'class',
      prev: 'cjs-import'
    },
    {
      blankLine: 'always',
      next: 'function',
      prev: 'cjs-import'
    },
    {
      blankLine: 'always',
      next: 'let',
      prev: 'cjs-import'
    },
    {
      blankLine: 'always',
      next: 'var',
      prev: 'cjs-import'
    },
    {
      blankLine: 'always',
      next: 'class',
      prev: 'import'
    },
    {
      blankLine: 'always',
      next: 'function',
      prev: 'import'
    },
    {
      blankLine: 'always',
      next: 'let',
      prev: 'import'
    },
    {
      blankLine: 'always',
      next: 'var',
      prev: 'import'
    }
  ]
}

if (eslintSupport.hasEslintPluginImport) {
  quickPrettierRules['import/newline-after-import'] = 1
}

const formattingRules = {
  'arrow-body-style': 0,
  'lines-around-comment': 0,
  'no-confusing-arrow': 0,
  'no-tabs': 0,
  'no-unexpected-multiline': 0,
  'array-bracket-newline': 'off',
  'array-bracket-spacing': 'off',
  'array-element-newline': 'off',
  'arrow-parens': 'off',
  'arrow-spacing': 'off',
  'block-spacing': 'off',
  'brace-style': 'off',
  'comma-dangle': 'off',
  'comma-spacing': 'off',
  'comma-style': 'off',
  'computed-property-spacing': 'off',
  'dot-location': 'off',
  'eol-last': 'off',
  'func-call-spacing': 'off',
  'function-call-argument-newline': 'off',
  'function-paren-newline': 'off',
  'generator-star': 'off',
  'generator-star-spacing': 'off',
  'implicit-arrow-linebreak': 'off',
  'jsx-quotes': 'off',
  'key-spacing': 'off',
  'keyword-spacing': 'off',
  'linebreak-style': 'off',
  'multiline-ternary': 'off',
  'newline-per-chained-call': 'off',
  'new-parens': 'off',
  'no-arrow-condition': 'off',
  'no-comma-dangle': 'off',
  'no-extra-parens': 'off',
  'no-extra-semi': 'off',
  'no-floating-decimal': 'off',
  'no-mixed-spaces-and-tabs': 'off',
  'no-multi-spaces': 'off',
  'no-multiple-empty-lines': 'off',
  'no-reserved-keys': 'off',
  'no-space-before-semi': 'off',
  'no-trailing-spaces': 'off',
  'no-whitespace-before-property': 'off',
  'no-wrap-func': 'off',
  'nonblock-statement-body-position': 'off',
  'object-curly-newline': 'off',
  'object-curly-spacing': 'off',
  'object-property-newline': 'off',
  'one-var-declaration-per-line': 'off',
  'operator-linebreak': 'off',
  'padded-blocks': 'off',
  'quote-props': 'off',
  'rest-spread-spacing': 'off',
  semi: 'off',
  'semi-spacing': 'off',
  'semi-style': 'off',
  'space-after-function-name': 'off',
  'space-after-keywords': 'off',
  'space-before-blocks': 'off',
  'space-before-function-paren': 'off',
  'space-before-function-parentheses': 'off',
  'space-before-keywords': 'off',
  'space-in-brackets': 'off',
  'space-in-parens': 'off',
  'space-infix-ops': 'off',
  'space-return-throw-case': 'off',
  'space-unary-ops': 'off',
  'space-unary-word-ops': 'off',
  'switch-colon-spacing': 'off',
  'template-curly-spacing': 'off',
  'template-tag-spacing': 'off',
  'unicode-bom': 'off',
  'wrap-iife': 'off',
  'wrap-regex': 'off',
  'yield-star-spacing': 'off',
  'indent-legacy': 'off',
  'no-spaced-func': 'off',

  'quick-prettier/prettier': [1, { 'prettify-package-json': true, rules: quickPrettierRules }],
  curly: 1,
  'max-len': [0, 120],
  'prefer-arrow-callback': [1, { allowNamedFunctions: true, allowUnboundThis: true }],
  'no-mixed-operators': [
    1,
    {
      allowSamePrecedence: false,
      groups: [
        ['&', '|', '^', '~', '<<', '>>', '>>>'],
        ['==', '!=', '===', '!==', '>', '>=', '<', '<='],
        ['&&', '||'],
        ['in', 'instanceof']
      ]
    }
  ],
  quotes: [1, 'single', { avoidEscape: true, allowTemplateLiterals: false }],
  indent: [
    0,
    2,
    {
      SwitchCase: 1,
      ArrayExpression: 1,
      ObjectExpression: 1,
      ImportDeclaration: 1,
      MemberExpression: 1,
      VariableDeclarator: 1,
      outerIIFEBody: 1,
      FunctionDeclaration: { parameters: 1, body: 1 },
      FunctionExpression: { parameters: 1, body: 1 },
      CallExpression: { arguments: 1 },
      flatTernaryExpressions: false,
      ignoredNodes: ['JSXElement', 'JSXElement *']
    }
  ]
}

module.exports = {
  plugins: ['quick-prettier'],
  rules: formattingRules
}
