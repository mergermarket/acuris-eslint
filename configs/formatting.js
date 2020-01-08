const eslintSupport = require('../core/eslint-support')
const eslintConfigPrettier = require('eslint-config-prettier')

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

const rules = {
  ...eslintConfigPrettier.rules,
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
  rules
}
