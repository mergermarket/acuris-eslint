const eslintSupport = require('../../core/eslint-support')
const { expect } = require('chai')

describe('core/eslint-support', () => {
  it('contains all packages for @acuris/eslint-config dev configuration', () => {
    expect(eslintSupport).to.deep.include({
      isCI: 'CI' in process.env,
      reactVersion: '16.8.6',
      hasEslint: true,
      hasTypescript: true,
      hasEslintPluginCssModules: true,
      hasEslintPluginImport: true,
      hasEslintPluginNode: true,
      hasBabelEslintParser: true,
      hasEslintPluginReact: true,
      hasEslintPluginJsxA11y: true,
      hasEslintPluginJest: false,
      hasEslintPluginMocha: true,
      hasEslintPluginChaiExpect: true,
      hasEslintPluginPromise: true,
      hasEslintPluginJson: true,
      extensions: ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json']
    })
  })
})
