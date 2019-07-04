'use strict'

/* eslint-disable node/no-missing-require */
/* eslint-disable global-require */

const fs = require('fs')
const path = require('path')

const { baseFolder, hasLocalPackage, hasPackage } = require('./node-modules')

const defaultReactVersion = '16.8.6'
const extensions = []

const eslintSupport = {
  baseFolder,

  /** Is running in a continous integration server? */
  isCI: 'CI' in process.env,

  /** @type {string} The react version supported by the project */
  reactVersion: getReactVersion(),

  hasTypescript:
    hasLocalPackage('@typescript-eslint/parser') &&
    hasLocalPackage('@typescript-eslint/eslint-plugin') &&
    hasLocalPackage('typescript'),

  hasEslintPluginCssModules: hasLocalPackage('eslint-plugin-css-modules'),

  hasEslintPluginImport: hasLocalPackage('eslint-plugin-import'),

  hasEslintPluginNode: hasLocalPackage('eslint-plugin-node'),

  hasBabelEslintParser: hasLocalPackage('babel-eslint'),

  hasEslintPluginReact: hasLocalPackage('eslint-plugin-react'),

  hasEslintPluginJsxA11y: hasLocalPackage('eslint-plugin-jsx-a11y') && hasPackage('@babel/runtime'),

  hasEslintPluginJest:
    hasPackage('eslint-plugin-jest') && (hasPackage('jest') || fs.existsSync(path.join(baseFolder, 'jest.config.js'))),

  hasEslintPluginMocha: hasLocalPackage('eslint-plugin-mocha') && hasLocalPackage('mocha'),

  hasEslintPluginChaiExpect: hasLocalPackage('eslint-plugin-chai-expect') && hasLocalPackage('chai'),

  hasEslintPluginPromise: hasLocalPackage('eslint-plugin-promise'),

  hasEslintPluginJson: hasLocalPackage('eslint-plugin-json'),

  extensions
}

module.exports = eslintSupport

extensions.push('.js', '.jsx', '.mjs', '.cjs')
if (eslintSupport.hasTypescript) {
  extensions.push('.ts', '.tsx')
}
if (eslintSupport.hasEslintPluginJson) {
  extensions.push('.json')
}

function getReactVersion() {
  let version = defaultReactVersion
  if (hasLocalPackage('react')) {
    try {
      version = require('react/package.json').version
    } catch (_error) {}
  }
  return version
}
