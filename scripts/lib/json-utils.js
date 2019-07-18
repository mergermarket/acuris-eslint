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

function readJsonFile(filePath) {
  return jsoncParse(fs.readFileSync(filePath, 'utf8'))
}

exports.readJsonFile = readJsonFile

function prettifyJsoncFile(jsonFilePath) {
  try {
    const source = fs.readFileSync(jsonFilePath, 'utf8')
    jsoncParse(source)
    const formatted = prettierInterface.format(source, { ignoreErrors: true, parser: 'json' })
    if (source !== formatted) {
      fs.writeFileSync(jsonFilePath, formatted, 'utf8')
      return true
    }
  } catch (_error) {}
  return false
}

exports.prettifyJsoncFile = prettifyJsoncFile
