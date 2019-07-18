'use strict'

const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const mkdirp = require('mkdirp')
const { resolveProjectFile } = require('./fs-utils')
const { jsoncParse, jsonEqual, jsoncStringify, prettifyJsoncFile } = require('./json-utils')

function stripBOM(content) {
  content = content.toString()
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
}

function readTextFile(filePath) {
  return stripBOM(fs.readFileSync(filePath, 'utf8')).replace(/[\r\n]/gm, '\n')
}

exports.readTextFile = readTextFile

async function updateTextFileAsync({ filePath, content, beforeWrite, basePath = process.cwd(), isJSON = false }) {
  let previousContent

  filePath = resolveProjectFile(filePath)
  if (content !== false) {
    try {
      previousContent = fs.readFileSync(filePath, 'utf8')
    } catch (error) {
      const code = error && error.code
      if (code !== 'ENOENT' && code !== 'EISDIR') {
        if (error && !error.path) {
          error.path = filePath
        }
        throw error
      }
    }
  }

  if (typeof content === 'function') {
    content = await content(isJSON ? jsoncParse(previousContent) : previousContent, filePath)
  }

  if (isJSON) {
    previousContent = jsoncParse(previousContent)
  }

  let shouldUpdate = true

  if (content === undefined || jsonEqual(previousContent, content)) {
    shouldUpdate = false
  }

  if (beforeWrite && !(await beforeWrite(previousContent, content))) {
    shouldUpdate = false
  }

  if (shouldUpdate) {
    try {
      mkdirp(path.dirname(filePath))

      fs.writeFileSync(filePath, isJSON ? jsoncStringify(content) : content, { encoding: 'utf8' })

      if (previousContent === undefined) {
        console.log(` ${chalk.green('+')} ${path.relative(basePath, filePath)} ${chalk.greenBright('created')}.`)
      } else {
        console.log(` ${chalk.yellow('+')} ${path.relative(basePath, filePath)} ${chalk.yellowBright('updated')}.`)
      }
    } catch (error) {
      if (error && !error.path) {
        error.path = filePath
      }
      throw error
    }
  } else if (isJSON && previousContent !== undefined) {
    if (prettifyJsoncFile(filePath)) {
      console.log(` ${chalk.gray('-')} ${path.relative(basePath, filePath)} ${chalk.yellow('prettified')}.`)
    } else {
      console.log(` ${chalk.gray('-')} ${path.relative(basePath, filePath)} ${chalk.grey('already up to date')}.`)
    }
  }

  return shouldUpdate
}

exports.updateTextFileAsync = updateTextFileAsync
