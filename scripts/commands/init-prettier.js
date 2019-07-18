'use strict'

const fs = require('fs')
const { resolveProjectFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync, resolveAcurisEslintFile } = require('../lib/text-utils')
const GitIgnore = require('../lib/GitIgnore')
const prettierInterface = require('../../core/prettier-interface')

module.exports = async () => {
  await initPrettierrc()
  await initPrettierIgnore()
}

async function initPrettierIgnore() {
  await updateTextFileAsync({
    filePath: resolveProjectFile('.prettierignore'),
    async content(previousContent) {
      const target = new GitIgnore(previousContent)
      target.merge(new GitIgnore(readTextFile(resolveAcurisEslintFile('.prettierignore'))))
      if (!target.changed) {
        return undefined
      }
      return target.toString()
    }
  })
}

async function initPrettierrc() {
  await updateTextFileAsync({
    filePath: ['.prettierrc', '.prettierrc.json'],
    content() {
      return JSON.stringify(prettierInterface.tryGetPrettierConfig(), null, 2)
    }
  })

  const forbiddenFiles = [
    '.prettierrc.yaml',
    '.prettierrc.yml',
    '.prettierrc.toml',
    'prettier.config.js',
    '.prettierrc.js'
  ]

  for (const forbiddenFile of forbiddenFiles) {
    try {
      fs.unlinkSync(resolveProjectFile(forbiddenFile))
    } catch (_error) {}
  }
}

module.exports.description = 'writes .eslintrc and .eslintignore configuration'
