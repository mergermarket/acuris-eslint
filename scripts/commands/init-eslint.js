'use strict'

const chalk = require('chalk').default
const inquirer = require('inquirer')
const fs = require('fs')
const { resolveProjectFile, resolveAcurisEslintFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const { notes, emitWarning, emitNote } = require('../lib/notes')
const GitIgnore = require('../lib/GitIgnore')

module.exports = async () => {
  await initEslintIgnore()

  const packageJsonConfig = await getPackageJsonEslintConfig()
  const initEslintRcResult = await initEslintrc(packageJsonConfig)
  if (initEslintRcResult !== null && packageJsonConfig) {
    await removeEslintConfigFromPackageJson()
  }
}

async function getPackageJsonEslintConfig() {
  let manifest
  try {
    manifest = readTextFile(resolveProjectFile('package.json'), 'json-stringify')
  } catch (_error) {}
  return (manifest && typeof manifest.eslintConfig === 'object' && manifest.eslintConfig) || undefined
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

async function initEslintrc(packageJsonConfig) {
  const forbiddenFiles = ['.eslintrc.js', '.eslintrc.yaml', '.eslintrc.yml']

  for (const forbiddenFile of forbiddenFiles) {
    if (fs.existsSync(resolveProjectFile(forbiddenFile))) {
      let hasAcuisConfig = false
      try {
        const text = fs.readFileSync(forbiddenFile)
        hasAcuisConfig = text.includes('@acuris')
      } catch (_error) {}

      if (!hasAcuisConfig) {
        emitWarning(
          `File ${chalk.yellowBright(forbiddenFile)} cannot be updated automaticallty.\n  Add ${chalk.whiteBright(
            '"extends": ["@acuris/eslint-config"]'
          )} to your eslint configuration file manually.`
        )
      }
      return null
    }
  }

  const extendsToRemove = []

  const eslintConfigUpdateResult = await updateTextFileAsync({
    format: 'json',
    filePath: ['.eslintrc', '.eslintrc.json'],
    async content(content, targetPath) {
      if (typeof content !== 'object' || content === null) {
        content = packageJsonConfig || {}
      }
      if (!content.extends) {
        content.extends = []
      }
      if (typeof content.extends === 'string') {
        content.extends = [content.extends]
      }
      if (!Array.isArray(content.extends)) {
        content.extends = []
      }

      content.extends = Array.from(new Set(content.extends.filter(x => x)))

      let hasAcurisEslintConfig = false

      for (const value of content.extends) {
        if (value.includes('@acuris')) {
          hasAcurisEslintConfig = true
        }
      }

      if (!hasAcurisEslintConfig) {
        const extendsSet = new Set(content.extends)
        if (targetPath !== resolveAcurisEslintFile('.eslintrc')) {
          extendsSet.add('@acuris')
        }

        for (const item of extendsSet) {
          if (
            typeof item === 'string' &&
            (item.includes('airbnb') ||
              item === 'standard' ||
              item.startsWith('eslint-config-standard') ||
              item.startsWith('standard-') ||
              item.startsWith('eslint:'))
          ) {
            extendsToRemove.push(item)
          }
        }

        if (extendsToRemove.length !== 0) {
          for (const item of extendsToRemove) {
            extendsSet.delete(item)
          }
        }

        content.extends = Array.from(extendsSet)
      }

      return content
    }
  })

  notes.shouldRestartIde = !!eslintConfigUpdateResult
  notes.eslintConfigUpdated = eslintConfigUpdateResult === 'updated'

  if (eslintConfigUpdateResult) {
    emitNote(
      `Removed ${extendsToRemove.map(x => chalk.yellow(x)).join(',')} from eslint configuration. ${chalk.gray(
        'Check your package.json to remove unused packages.'
      )}`
    )
  }

  return eslintConfigUpdateResult
}

async function removeEslintConfigFromPackageJson() {
  await updateTextFileAsync({
    format: 'json-stringify',
    filePath: 'package.json',
    async content(content) {
      if (content && content.eslintConfig) {
        emitWarning(
          `File ${chalk.yellowBright('package.json')} contains an ${chalk.yellowBright(
            'eslintConfig'
          )} field.\n  This is discouraged, you should use a ${chalk.whiteBright('.eslintrc')} file instead`
        )
        const answer = await inquirer.prompt({
          name: 'confirm',
          type: 'confirm',
          message: `Can I remove eslintConfig field from package.json?`
        })
        if (answer.confirm) {
          delete content.eslintConfig
        }
      }
      return content
    }
  })
}

module.exports.description = 'updates .eslintrc and .eslintignore configuration'
