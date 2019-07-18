'use strict'

const chalk = require('chalk').default
const fs = require('fs')
const { resolveProjectFile, resolveAcurisEslintFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const { notes } = require('../lib/notes')
const GitIgnore = require('../lib/GitIgnore')

module.exports = async () => {
  await initEslintrc()
  await initEslintIgnore()
}

async function initEslintIgnore() {
  await updateTextFileAsync({
    filePath: resolveProjectFile('.eslintignore'),
    async content(previousContent) {
      const target = new GitIgnore(previousContent)
      target.merge(new GitIgnore(readTextFile(resolveAcurisEslintFile('.eslintignore'))))
      if (!target.changed) {
        return undefined
      }
      return target.toString()
    }
  })
}

async function initEslintrc() {
  const forbiddenFiles = ['.eslintrc.js', '.eslintrc.yaml', '.eslintrc.yml']

  for (const forbiddenFile of forbiddenFiles) {
    if (fs.existsSync(resolveProjectFile(forbiddenFile))) {
      let hasAcuisConfig = false
      try {
        const text = fs.readFileSync(forbiddenFile)
        hasAcuisConfig = text.includes('@acuris')
      } catch (_error) {}

      if (!hasAcuisConfig) {
        console.warn(
          `${chalk.redBright('[WARNING]')} File ${chalk.yellowBright(
            forbiddenFile
          )} cannot be updated automaticallty.\n  Add ${chalk.whiteBright(
            '"extends": "@acuris/eslint-config"'
          )} to your eslint configuration file manually.`
        )
      }
      return
    }
  }

  if (
    await updateTextFileAsync({
      isJSON: true,
      filePath: ['.eslintrc', '.eslintrc.json'],
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
          throw new TypeError(
            `"extends" property must a string, an array or undefined but is ${typeof content.extends}`
          )
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
  ) {
    notes.shouldRestartIde = true
  }
}

module.exports.description = 'writes .eslintrc and .eslintignore configuration'
