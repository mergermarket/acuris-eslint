'use strict'

const eslintSupport = require('../core/eslint-support')

if (eslintSupport.hasEslintPluginReact) {
  module.exports = eslintSupport.mergeEslintConfigs({
    plugins: ['react'],
    parserOptions: {
      ecmaFeatures: { jsx: true }
    },
    env: {
      browser: true
    },
    rules: {
      'react/display-name': 0,
      'react/jsx-key': 2,
      'react/jsx-no-comment-textnodes': 2,
      'react/jsx-no-duplicate-props': 2,
      'react/jsx-no-target-blank': 2,
      'react/jsx-no-undef': 2,
      'react/jsx-uses-react': 2,
      'react/jsx-uses-vars': 2,
      'react/no-children-prop': 2,
      'react/no-danger-with-children': 2,
      'react/no-deprecated': 2,
      'react/no-direct-mutation-state': 2,
      'react/no-find-dom-node': 2,
      'react/no-is-mounted': 2,
      'react/no-render-return-value': 2,
      'react/no-string-refs': 2,
      'react/no-unescaped-entities': 2,
      'react/no-unknown-property': 2,
      'react/no-unsafe': 0,
      'react/prop-types': 2,
      'react/react-in-jsx-scope': 2,

      'react/require-render-return': 2,

      'react/jsx-child-element-spacing': 'off',
      'react/jsx-closing-bracket-location': 'off',
      'react/jsx-closing-tag-location': 'off',
      'react/jsx-curly-newline': 'off',
      'react/jsx-curly-spacing': 'off',
      'react/jsx-equals-spacing': 'off',
      'react/jsx-first-prop-new-line': 'off',
      'react/jsx-indent': 'off',
      'react/jsx-indent-props': 'off',
      'react/jsx-max-props-per-line': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-props-no-multi-spaces': 'off',
      'react/jsx-tag-spacing': 'off',
      'react/jsx-wrap-multilines': 'off'
    },
    settings: {
      react: {
        version: eslintSupport.reactVersion
      }
    }
  })
}
