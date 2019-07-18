'use strict'

const chalk = require('chalk').default
const fs = require('fs')
const { resolveProjectFile } = require('../lib/fs-utils')
const { updateTextFileAsync } = require('../lib/text-utils')
const { readJsonFile } = require('../lib/json-utils')

module.exports = async () => {
  const forbiddenFiles = ['.eslintrc.js', '.eslintrc.yaml', '.eslintrc.yml']

  for (const forbiddenFile of forbiddenFiles) {
    if (fs.existsSync(resolveProjectFile(forbiddenFile))) {
      console.warn(
        `${chalk.redBright('[WARNING]')} File ${chalk.yellowBright(
          forbiddenFile
        )} cannot be updated automaticallty.\n  Add ${chalk.whiteBright(
          '"extends": "@acuris/eslint-config"'
        )} to your eslint configuration file manually.`
      )
    }
  }

  let targetName
  try {
    readJsonFile(resolveProjectFile('.eslintrc.json'))
    targetName = '.eslintrc.json'
  } catch (error) {
    const code = error && error.code
    if (code !== 'ENOENT' && code !== 'EISDIR') {
      throw error
    }
  }

  if (!targetName) {
    try {
      readJsonFile(resolveProjectFile('.eslintrc'))
      targetName = '.eslintrc'
    } catch (error) {
      const code = error && error.code
      if (code !== 'ENOENT' && code !== 'EISDIR') {
        throw error
      }
    }
  }

  if (!targetName) {
    targetName = '.eslintrc'
  }

  await updateTextFileAsync({
    filePath: resolveProjectFile(targetName),
    async content(content) {
      if (typeof content !== 'object' || content === null) {
        content = {}
      }
      if (!content.extends) {
        content.extends = []
      }
      if (typeof content.extends === 'string') {
        content.extends = [content.extends]
      }
      if (!Array.isArray(content.extends)) {
        throw new TypeError('extends property must be undefined, a string or an array')
      }
      if (
        !content.extends.includes('@acuris') &&
        !content.extends.includes('@acuris/eslint') &&
        !content.extends.includes('@acuris/eslint-config')
      ) {
        content.extends.push('@acuris')
      }
    }
  })
}

module.exports.description = 'initializes or updates .eslintrc configuration'
