'use strict'

const fs = require('fs')
const { resolveAcurisEslintFile, resolveProjectFile } = require('../lib/fs-utils')
const { readTextFile, updateTextFileAsync } = require('../lib/text-utils')
const { notes } = require('../lib/notes')

module.exports = async () => {
  if (fs.existsSync(resolveProjectFile('.idea'))) {
    notes.hasIdea = true
  }

  if (
    await updateTextFileAsync({
      format: 'json',
      filePath: resolveProjectFile('.vscode/settings.json'),
      async content(settings) {
        const defaultSettings = readTextFile(resolveAcurisEslintFile('.vscode/settings.json'))

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
    notes.shouldRestartVsCode = true
  }

  if (
    await updateTextFileAsync({
      format: 'json',
      filePath: resolveProjectFile('.vscode/extensions.json'),
      async content(extensions) {
        const defaultExtensions = readTextFile(resolveAcurisEslintFile('.vscode/extensions.json'))

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
    notes.shouldInstallVsCodePlugins = true
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

module.exports.description = 'writes Visual Studio Code workspace settings'
