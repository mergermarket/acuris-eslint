'use strict'

const chalk = require('chalk').default
const fs = require('fs')
const eslintSupport = require('../../core/eslint-support')
const { resolveProjectFile, resolveAcurisEslintFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const { notes, emitWarning, emitNote } = require('../lib/notes')
const IgnoreFile = require('../lib/IgnoreFile')

module.exports = async () => {
  const packageJsonEslintConfig = await getEslintConfigFromPackageJson()
  await initEslintIgnore(packageJsonEslintConfig)
  const initEslintRcResult = await initEslintrc(packageJsonEslintConfig)
  await removeEslintConfigFromPackageJson({
    removeEslintConfig: initEslintRcResult !== null,
    removeEslintIgnore: true
  })
}

async function getEslintConfigFromPackageJson() {
  let manifest
  try {
    manifest = readTextFile(resolveProjectFile('package.json'), 'json-stringify')
  } catch (_error) {}
  const result = {}

  if (typeof manifest === 'object' && manifest !== null && !Array.isArray(manifest)) {
    if (Array.isArray(manifest.eslintIgnore)) {
      result.eslintIgnore = manifest.eslintIgnore
    }
    const eslintConfig = manifest.eslintConfig
    if (
      typeof eslintConfig === 'object' &&
      eslintConfig !== null &&
      !Array.isArray(eslintConfig) &&
      Object.keys.length(eslintConfig) !== 0
    ) {
      result.eslintConfig = eslintConfig
    }
  }

  return typeof manifest !== 'object' || Array.isArray(manifest) || manifest === null ? {} : manifest
}

async function initEslintIgnore(packageJsonEslintConfig) {
  await updateTextFileAsync({
    filePath: resolveProjectFile('.eslintignore'),
    async content(previousContent) {
      const target = new IgnoreFile(previousContent)
      if (packageJsonEslintConfig.eslintIgnore) {
        target.merge(new IgnoreFile(packageJsonEslintConfig.eslintIgnore), false)
      }
      target.merge(new IgnoreFile(readTextFile(resolveAcurisEslintFile('.eslintignore'))))
      if (!target.changed) {
        return undefined
      }
      return target.toString()
    }
  })
}

async function initEslintrc(packageJsonEslintConfig) {
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
        content = {}
      }
      if (packageJsonEslintConfig.eslintConfig) {
        content = eslintSupport.mergeEslintConfigs(packageJsonEslintConfig.eslintConfig, content)
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

async function removeEslintConfigFromPackageJson({ removeEslintConfig, removeEslintIgnore }) {
  await updateTextFileAsync({
    format: 'json-stringify',
    filePath: 'package.json',
    async content(content) {
      const fieldsToRemove = []
      if (content) {
        if (removeEslintConfig && content.eslintConfig !== undefined) {
          fieldsToRemove.push('eslintConfig')
        }
        if (removeEslintIgnore && content.eslintIgnore !== undefined) {
          fieldsToRemove.push('eslintIgnore')
        }
      }

      if (fieldsToRemove.length !== 0) {
        for (const field of fieldsToRemove) {
          delete content[field]
        }

        emitWarning(
          `Fields ${fieldsToRemove.map(x => chalk.yellowBright(x)).join(',')} removed from  ${chalk.yellowBright(
            'package.json'
          )}. All content was copied in ${chalk.whiteBright('.eslintrc')} and/or ${chalk.whiteBright('.eslintignore')}.`
        )
      }
      return content
    }
  })
}
