'use strict'

/* eslint-disable node/no-missing-require */
/* eslint-disable global-require */

const fs = require('fs')
const path = require('path')

const { hasLocalPackage, hasPackage } = require('./node-modules')

const defaultReactVersion = '16.8.6'

function getReactVersion() {
  let version = defaultReactVersion
  if (hasLocalPackage('react')) {
    try {
      version = require('react/package.json').version
    } catch (_error) {}
  }
  return version
}

function getEslintSupport() {
  const extensions = []
  extensions.push('.js', '.jsx', '.mjs', '.cjs')

  const eslintSupport = {
    /** Is running in a continous integration server? */
    isCI: 'CI' in process.env,

    /** @type {string} The react version supported by the project */
    reactVersion: getReactVersion(),

    hasEslint: hasPackage('eslint'),

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
      hasPackage('eslint-plugin-jest') &&
      (hasPackage('jest') || fs.existsSync(path.join(process.cwd(), 'jest.config.js'))),

    hasEslintPluginMocha: hasLocalPackage('eslint-plugin-mocha') && hasLocalPackage('mocha'),

    hasEslintPluginChaiExpect: hasLocalPackage('eslint-plugin-chai-expect') && hasLocalPackage('chai'),

    hasEslintPluginPromise: hasLocalPackage('eslint-plugin-promise'),

    hasEslintPluginJson: hasLocalPackage('eslint-plugin-json'),

    extensions
  }

  if (eslintSupport.hasTypescript) {
    extensions.push('.ts', '.tsx')
  }
  if (eslintSupport.hasEslintPluginJson) {
    extensions.push('.json')
  }

  return eslintSupport
}

module.exports = getEslintSupport()
