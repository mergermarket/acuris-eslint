'use strict'

const eslintSupport = require('../core/eslint-support')

const common = require('./common')

const baseKey = '@typescript-eslint/'

if (eslintSupport.hasTypescript) {
  const parserOptions = {
    ...common.parserOptions
  }

  let hasTypeCheck = false
  const tsConfigPath = eslintSupport.tsConfigPath
  if (tsConfigPath) {
    parserOptions.project = tsConfigPath
    hasTypeCheck = true
  }

  const allRules = require('@typescript-eslint/eslint-plugin/dist/configs/all.json').rules
  const pluginConfigRecommended = require('@typescript-eslint/eslint-plugin/dist/configs/recommended.json').rules
  const pluginConfigRecommendedRequiringTypeChecking = require('@typescript-eslint/eslint-plugin/dist/configs/recommended-requiring-type-checking.json')
    .rules

  //const eslintPlugin = require('@typescript-eslint/eslint-plugin')
  //const allRuleKeys = Object.keys(eslintPlugin.configs.all.rules)

  const baseRules = {}
  mergeEslintPluginRules(baseRules, pluginConfigRecommended)

  if (hasTypeCheck) {
    mergeEslintPluginRules(baseRules, pluginConfigRecommendedRequiringTypeChecking)
  }

  Object.assign(baseRules, pluginConfigRecommended, {
    '@typescript-eslint/quotes': 0,
    '@typescript-eslint/brace-style': 'off',
    '@typescript-eslint/func-call-spacing': 'off',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/no-extra-parens': 'off',
    '@typescript-eslint/no-extra-semi': 'off',
    '@typescript-eslint/semi': 'off',
    '@typescript-eslint/space-before-function-paren': 'off',
    '@typescript-eslint/type-annotation-spacing': 'off'
  })

  const commonRules = common.rules

  const rulesThatRequireTypeChecks = {
    '@typescript-eslint/no-throw-literal': true,
    '@typescript-eslint/no-implied-eval': true
  }

  for (const ruleKey of Object.keys(allRules)) {
    if (ruleKey.startsWith(baseKey)) {
      const commonRuleKey = ruleKey.slice(baseKey.length)
      if (commonRuleKey in commonRules) {
        if (hasTypeCheck || !rulesThatRequireTypeChecks[ruleKey]) {
          const baseRule = commonRules[commonRuleKey]
          if (baseRule !== undefined) {
            baseRules[commonRuleKey] = 0
            baseRules[ruleKey] = baseRule
          }
        }
      }
    } else if (!(ruleKey in baseRules)) {
      baseRules[ruleKey] = 0
    }
  }

  const tsRules = {
    ...baseRules,
    ...(eslintSupport.hasEslintPluginNode && {
      'node/no-unsupported-features/es-syntax': 0
    }),

    ...(eslintSupport.hasEslintPluginImport && {
      // TODO: These rules may be useful but they are too slow on big projects. Disable for typescript, typescript should cover enough.
      'import/namespace': 0,
      'import/named': 0,
      'import/default': 0,
      'import/no-unresolved': 0,
      'import/no-named-as-default': 0,
      'import/no-named-as-default-member': 0,
      'import/no-duplicates': 0
    }),

    // TODO: this would be a useful thing, but at the moment is buggy with overloads.
    'no-dupe-class-members': 0,

    // This gives false positives
    '@typescript-eslint/unbound-method': 0,

    '@typescript-eslint/prefer-includes': 0,
    '@typescript-eslint/adjacent-overload-signatures': 1,
    '@typescript-eslint/array-type': 1,
    '@typescript-eslint/ban-types': 1,
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/class-name-casing': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-member-accessibility': 1,
    '@typescript-eslint/indent': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/member-delimiter-style': [
      1,
      {
        multiline: { delimiter: 'none', requireLast: false },
        singleline: { delimiter: 'semi', requireLast: false }
      }
    ],
    '@typescript-eslint/consistent-type-assertions': 0,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-empty-interface': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-this-alias': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/no-misused-new': 2,
    '@typescript-eslint/no-namespace': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-parameter-properties': 0,
    '@typescript-eslint/no-var-requires': 0,
    '@typescript-eslint/prefer-namespace-keyword': 1,
    '@typescript-eslint/type-annotation-spacing': 1,
    '@typescript-eslint/triple-slash-reference': 0,
    '@typescript-eslint/consistent-type-definitions': 0
  }

  if (eslintSupport.hasEslintPluginReact) {
    tsRules['react/prop-types'] = 0
  }

  module.exports = {
    overrides: [
      {
        files: ['*.ts', '*.tsx'],
        parser: '@typescript-eslint/parser',
        parserOptions,
        plugins: ['@typescript-eslint'],
        rules: tsRules
      },
      {
        files: ['*.d.ts'],
        rules: {
          '@typescript-eslint/explicit-member-accessibility': 0
        }
      }
    ]
  }

  if (eslintSupport.hasEslintPluginImport) {
    module.exports = eslintSupport.mergeEslintConfigs(module.exports, require('eslint-plugin-import/config/typescript'))
  }
}

function mergeEslintPluginRules(baseRules, rules) {
  for (const key of Object.keys(rules)) {
    const value = rules[key]
    if (value === 0 || value === 'off') {
      baseRules[key] = 0
    } else if (key.startsWith(baseKey)) {
      baseRules[key] = value
    }
  }
}
