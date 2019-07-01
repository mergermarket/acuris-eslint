// eslint rules specific for trendy team
const eslintHelpers = require('../eslint-helpers')
const baseEslintConfig = require('..')

const baseNoUnusedVarsRule = Array.isArray(baseEslintConfig.rules['no-unused-vars'])
  ? baseEslintConfig.rules['no-unused-vars']
  : [0, {}]

module.exports = eslintHelpers.mergeEslintConfigs(baseEslintConfig, {
  overrides: [
    {
      files: ['*.spec.js'],
      rules: {
        'no-console': 0,
        'no-unused-vars': [baseNoUnusedVarsRule[0], { ...baseNoUnusedVarsRule[1], args: 'none' }]
      }
    }
  ]
})
