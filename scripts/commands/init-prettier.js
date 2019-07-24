'use strict'

const inquirer = require('inquirer')
const chalk = require('chalk').default
const fs = require('fs')
const util = require('util')
const { resolveProjectFile, resolveAcurisEslintFile, fileExists } = require('../lib/fs-utils')
const { sortObjectKeys, readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const { warning } = require('../lib/notes')
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
  const defaultPrettierConfig = prettierInterface.loadDefaultPrettierConfig()
  let prettierConfig = { ...prettierInterface.tryGetPrettierConfig() }

  if (prettierConfig.printWidth < defaultPrettierConfig.printWidth) {
    prettierConfig.printWidth = defaultPrettierConfig.printWidth
  }
  if (defaultPrettierConfig.endOfLine) {
    prettierConfig.endOfLine = defaultPrettierConfig.endOfLine
  }
  if (defaultPrettierConfig.semi !== undefined) {
    prettierConfig.semi = defaultPrettierConfig.semi
  }
  if (defaultPrettierConfig.singleQuote !== undefined) {
    prettierConfig.singleQuote = defaultPrettierConfig.singleQuote
  }
  if (defaultPrettierConfig.tabWidth) {
    prettierConfig.tabWidth = defaultPrettierConfig.tabWidth
  }

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
    warning(
      chalk.yellow(
        `.prettierrc configuration should be a .prettierrc json file and not ${chalk.redBright(
          filesToDelete.join(', ')
        )}.`
      ),
      chalk.gray(`\n.prettierrc will have the following content: ${util.inspect(prettierConfig)}`)
    )

    const answer = await inquirer.prompt({
      name: 'confirm',
      type: 'confirm',
      message: `Can I delete ${chalk.redBright(filesToDelete.join(', '))}?`
    })
    if (!answer.confirm) {
      filesToDelete = []
    }
  }

  await updateTextFileAsync({
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
        warning(chalk.yellow('could not delete file'), chalk.red(fileToDelete), chalk.gray(error || error.message))
      }
    }
  }
}

module.exports.description = 'writes .eslintrc and .eslintignore configuration'
