'use strict'

const prettierInterface = require('../../core/prettier-interface')
const hjson = require('hjson')
const util = require('util')
const fs = require('fs')

const readFileAsync = util.promisify(fs.readFile)

const { isArray } = Array
const { keys: objectKeys } = Object

/**
 * Compares two json objects for equality
 */
function jsonEqual(a, b) {
  if (!(a !== b)) {
    return true
  }
  if (typeof a === 'object' && typeof b === 'object') {
    if (a === null || b === null) {
      return false
    }
    if (isArray(a)) {
      const aLen = a.length
      if (!isArray(b) || aLen !== b.length) {
        return false
      }
      for (let i = 0; i !== aLen; ++i) {
        if (!jsonEqual(a[i], b[i])) {
          return false
        }
      }
      return true
    }
    for (const key of objectKeys(a)) {
      if (!jsonEqual(a[key], b[key])) {
        return false
      }
    }
    return true
  }
  return false
}

exports.jsonEqual = jsonEqual

function jsoncParse(text) {
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

async function readJsonFile(filePath) {
  return jsoncParse(await readFileAsync(filePath, 'utf8'))
}

exports.readJsonFile = readJsonFile
