'use strict'

const { prettierInterface } = require('../../core/node-modules')
const { askConfirmation } = require('../lib/inquire')
const chalk = require('chalk').default
const fs = require('fs')
const util = require('util')
const { resolveProjectFile, resolveAcurisEslintFile, fileExists } = require('../lib/fs-utils')
const { sortObjectKeys, readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const { emitWarning } = require('../lib/notes')
const IgnoreFile = require('../lib/IgnoreFile')

module.exports = async () => {
  await initPrettierrc()
  await initPrettierIgnore()
}

async function initPrettierIgnore() {
  await updateTextFileAsync({
    format: 'text',
    filePath: resolveProjectFile('.prettierignore'),
    async content(previousContent) {
      const target = new IgnoreFile(previousContent)
      target.merge(new IgnoreFile(readTextFile(resolveAcurisEslintFile('.prettierignore'))))
      if (!target.changed) {
        return undefined
      }
      return target.toString()
    }
  })

  let editorConfig
  try {
    editorConfig = readTextFile(resolveAcurisEslintFile('.editorconfig'), 'text')
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error
    }
  }

  if (editorConfig) {
    await updateTextFileAsync({
      format: 'text',
      filePath: resolveProjectFile('.editorconfig'),
      async content(previousContent) {
        if (!previousContent) {
          return editorConfig
        }
        return previousContent
      }
    })
  }
}

async function initPrettierrc() {
  const defaultPrettierConfig = prettierInterface.loadDefaultPrettierConfig()
  let prettierConfig = { ...defaultPrettierConfig, ...prettierInterface.tryGetPrettierConfig() }

  prettierConfig = sortObjectKeys(prettierConfig)

  const forbiddenFiles = [
    '.prettierrc.yaml',
    '.prettierrc.yml',
    '.prettierrc.toml',
    'prettier.config.js',
    '.prettierrc.js'
  ]

  let filesToDelete = []
  for (const forbiddenFile of forbiddenFiles) {
    if (fileExists(resolveProjectFile(forbiddenFile))) {
      filesToDelete.push(forbiddenFile)
    }
  }

  if (filesToDelete.length !== 0) {
    emitWarning(
      chalk.yellow(
        `.prettierrc configuration should be a .prettierrc json file and not ${chalk.redBright(
          filesToDelete.join(', ')
        )}.`
      ),
      chalk.gray(`\n.prettierrc will have the following content: ${util.inspect(prettierConfig)}`)
    )

    if (!(await askConfirmation(`Can I delete ${chalk.redBright(filesToDelete.join(', '))}?`))) {
      filesToDelete = []
    }
  }

  await updateTextFileAsync({
    format: 'text',
    filePath: ['.prettierrc', '.prettierrc.json'],
    content() {
      return `${JSON.stringify(prettierConfig, null, 2)}\n`
    }
  })

  for (const fileToDelete of filesToDelete) {
    try {
      fs.unlinkSync(resolveProjectFile(fileToDelete))
      console.log(` ${chalk.redBright('-')} ${fileToDelete} ${chalk.redBright('deleted')}!`)
    } catch (error) {
      if (!error || error.code !== 'ENOENT') {
        emitWarning(chalk.yellow('could not delete file'), chalk.red(fileToDelete), chalk.gray(error || error.message))
      }
    }
  }
}
