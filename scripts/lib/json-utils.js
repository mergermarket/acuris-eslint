'use strict'

const prettierInterface = require('../../core/prettier-interface')
const hjson = require('hjson')
const fs = require('fs')

const { isArray } = Array
const { keys: objectKeys } = Object

/**
 * Compares two json objects for equality
 */
function jsonEqual(a, b) {
  if (!(a !== b)) {
    return true
  }
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false
  }
  if (isArray(a)) {
    if (!isArray(b) || a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length; ++i) {
      if (!jsonEqual(a[i], b[i])) {
        return false
      }
    }
    return true
  }
  const keys = objectKeys(a)
  if (keys.length !== objectKeys(b).length) {
    return false
  }
  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i]
    if (!jsonEqual(a[key], b[key])) {
      return false
    }
  }
  return true
}

exports.jsonEqual = jsonEqual

function jsoncParse(text) {
  if (text === undefined || text === null) {
    return text
  }
  if (Buffer.isBuffer(text)) {
    text = text.toString('utf8')
  }
  if (!text) {
    return {}
  }
  return hjson.parse(prettierInterface.format(text, { ignoreErrors: true, parser: 'json' }), { keepWsc: true })
}

exports.jsoncParse = jsoncParse

function jsonStringify(obj) {
  return prettierInterface.format(JSON.stringify(obj, null, 2), { ignoreErrors: true, parser: 'json' })
}

exports.jsonStringify = jsonStringify

function jsoncStringify(obj) {
  return prettierInterface.format(
    hjson.stringify(obj, {
      emitRootBraces: true,
      bracesSameLine: true,
      separator: true,
      quotes: 'all',
      multiline: 'std',
      space: 2,
      eol: '\n',
      keepWsc: true
    }),
    { ignoreErrors: true, parser: 'json' }
  )
}

exports.jsoncStringify = jsoncStringify

function stripBOM(content) {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
}

function readJsoncFile(filePath) {
  return jsoncParse(stripBOM(fs.readFileSync(filePath, 'utf8')))
}

exports.readJsoncFile = readJsoncFile

function readJsonFile(filePath) {
  const text = stripBOM(fs.readFileSync(filePath, 'utf8'))
  return text.length === 0 ? undefined : JSON.parse(text)
}

exports.readJsonFile = readJsonFile

exports.prettifyJsonFile = prettifyJsonFile

function prettifyJsonFile(jsonFilePath) {
  try {
    const source = stripBOM(fs.readFileSync(jsonFilePath, 'utf8'))
    let formatted = source
    const prettier = prettierInterface.tryGetPrettier()
    if (prettier) {
      const fileInfo = prettier.getFileInfo.sync(jsonFilePath)
      let parser = fileInfo && fileInfo.inferredParser
      if (!parser || !parser.includes('json')) {
        parser = 'json'
      }
      formatted = prettierInterface.format(source, { ignoreErrors: true, parser })
    } else {
      try {
        formatted = JSON.stringify(JSON.parse(source))
      } catch (_error) {
        formatted = jsoncStringify(jsoncParse(source))
      }
    }
    formatted = formatted.replace(/[\r\n]/gm, '\n')
    if (formatted.length !== 0 && !formatted.endsWith('\n')) {
      formatted += '\n'
    }
    if (source !== formatted) {
      fs.writeFileSync(jsonFilePath, formatted, 'utf8')
      return true
    }
  } catch (_error) {}
  return false
}

exports.prettifyJsonFile = prettifyJsonFile

function sortObjectKeys(object) {
  if (typeof object !== 'object' || object === null) {
    return object
  }
  if (Array.isArray(object)) {
    return object.slice().sort()
  }
  const result = {}
  for (const key of Object.keys(object).sort()) {
    const value = object[key]
    result[key] = Array.isArray(value) ? value.slice() : sortObjectKeys(value)
  }
  return result
}

exports.sortObjectKeys = sortObjectKeys
