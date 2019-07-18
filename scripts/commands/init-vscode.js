'use strict'

const chalk = require('chalk').default
const { resolveAcurisEslintFile, resolveProjectFile } = require('../lib/fs-utils')
const { readJsonFile } = require('../lib/json-utils')
const { updateTextFileAsync } = require('../lib/text-utils')

module.exports = async () => {
  if (
    await updateTextFileAsync({
      isJSON: true,
      filePath: resolveProjectFile('xvscode/settings.json'),
      async content(settings) {
        const defaultSettings = readJsonFile(resolveAcurisEslintFile('.vscode/settings.json'))

        if (typeof settings !== 'object' || settings === null) {
          settings = {}
        }
        settings = mergeConfigs(settings, defaultSettings)

        settings['eslint.validate'] = mergeEslintValidate(
          settings['eslint.validate'],
          defaultSettings['eslint.validate']
        )
        return settings
      }
    })
  ) {
    console.log(
      `\n${chalk.blueBright('[NOTE]')} ${chalk.cyanBright(
        '.vscode/settings.json was updated. You may need to restart Visual Studio Code.'
      )}\n`
    )
  }

  if (
    await updateTextFileAsync({
      isJSON: true,
      filePath: resolveProjectFile('xvscode/extensions.json'),
      async content(extensions) {
        const defaultExtensions = readJsonFile(resolveAcurisEslintFile('.vscode/extensions.json'))

        if (typeof extensions !== 'object' || extensions === null) {
          extensions = {}
        }
        extensions = mergeConfigs(extensions)

        const recommendationsSet = new Set(defaultExtensions.recommendations)
        if (Array.isArray(extensions.recommendations)) {
          for (const recommendation of extensions.recommendations) {
            recommendationsSet.add(recommendation)
          }
        }
        extensions.recommendations = Array.from(recommendationsSet)

        for (const key of Object.keys(defaultExtensions)) {
          if (!(key in extensions)) {
            extensions[key] = defaultExtensions[key]
          }
        }

        return extensions
      }
    })
  ) {
    console.log(
      `\n${chalk.blueBright('[NOTE]')} ${chalk.cyanBright(
        '.vscode/extensions.json was updated.\n  When you restart Visual Studio Code you may be asked to install some recommended plugins.\n  If so, is recommended to install the recommended plugins.'
      )} \n  ${chalk.blue(
        'https://code.visualstudio.com/docs/editor/extension-gallery#_workspace-recommended-extensions\n'
      )}`
    )
  }
}

function mergeConfigs(target, source) {
  if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
    if (Array.isArray(target) || Array.isArray(source)) {
      return target
    }
    for (const key of Object.keys(source)) {
      target[key] = mergeConfigs(target[key], source[key])
    }
  }
  if (target === undefined) {
    console.log(target, source)
    return source
  }
  return target === undefined ? source : target
}

function mergeEslintValidate(target, source) {
  if (!source) {
    return target
  }
  if (!Array.isArray(target) || target.length === 0) {
    return source
  }

  const languages = new Set()
  for (let i = 0; i < target.length; ++i) {
    if (typeof target[i] === 'string') {
      target[i] = { language: target[i], autoFix: true }
    }
    if (typeof target[i] === 'object' && target[i] !== null && target[i].language) {
      languages.add(target[i].language)
    }
  }

  for (let i = 0; i < source.length; ++i) {
    if (!languages.has(source[i].language)) {
      languages.add(source[i].language)
      target.push(typeof source[i] === 'string' ? { language: source[i], autoFix: true } : source[i])
    }
  }

  return target
}

module.exports.description = 'initializes common Visual Studio Code settings'
