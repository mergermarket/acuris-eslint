'use strict'

const inquirer = require('inquirer')
const chalk = require('chalk').default
const fs = require('fs')
const util = require('util')
const { resolveProjectFile, resolveAcurisEslintFile, fileExists } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const { sortObjectKeys } = require('../lib/json-utils')
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
  const prettierConfig = sortObjectKeys(prettierInterface.tryGetPrettierConfig())

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
    console.log(
      chalk.yellowBright('[WARNING]'),
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
      return JSON.stringify(prettierConfig, null, 2)
    }
  })

  for (const fileToDelete of filesToDelete) {
    try {
      fs.unlinkSync(resolveProjectFile(fileToDelete))
      console.log(` ${chalk.redBright('-')} ${fileToDelete} ${chalk.redBright('deleted')}!`)
    } catch (error) {
      if (!error || error.code !== 'ENOENT') {
        console.log(
          chalk.yellowBright('[WARNING]'),
          chalk.yellow('could not delete file'),
          chalk.red(fileToDelete),
          chalk.gray(error || error.message)
        )
      }
    }
  }
}

module.exports.description = 'writes .eslintrc and .eslintignore configuration'
