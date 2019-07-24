'use strict'

const prettierInterface = require('../../core/prettier-interface')
const mkdirp = require('mkdirp')
const hjson = require('hjson')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk').default

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

function parse(source, format, filename) {
  if (source === null || source === undefined) {
    return source
  }
  try {
    if (Buffer.isBuffer(source)) {
      source = source.toString('utf8')
    } else if (Array.isArray(source)) {
      source = source.join('\n')
    } else if (typeof source !== 'string') {
      source = source.toString()
    }
    if (source.charCodeAt(0) === 0xfeff) {
      source = source.slice(1)
    }

    if (format === 'json' || format === 'json5' || format === 'json-stringify') {
      if (source.length === 0) {
        return undefined
      }
      source = prettierInterface.format(source, { ignoreErrors: true, parser: format || 'json' })
      if (format === 'json-stringify') {
        try {
          return JSON.parse(source)
        } catch (error) {
          try {
            return hjson.parse(source, { keepWsc: true })
          } catch (_error) {
            throw error
          }
        }
      } else {
        return hjson.parse(source, { keepWsc: true })
      }
    }

    if (format && format !== 'text') {
      return prettierInterface.format(source, { ignoreErrors: true, parser: format })
    }
    return source
  } catch (error) {
    if (filename && error && !error.path) {
      error.path = filename
    }
    throw error
  }
}

exports.parse = parse

function getTextFileFormat(filename) {
  if (typeof filename !== 'string' || filename.length === 0) {
    return 'text'
  }
  const bname = path.basename(filename)
  if (
    bname === '.prettierrc' ||
    bname === '.eslintrc' ||
    (bname.endsWith('.json') && filename.indexOf('.vscode') > 0)
  ) {
    return 'json'
  }
  if (bname === 'package.json') {
    return 'json-stringify'
  }
  const prettier = prettierInterface.tryGetPrettier()
  if (prettier) {
    try {
      const info = prettier.getFileInfo.sync(filename)
      if (info) {
        const format = info && info.inferredParser
        if (format) {
          return format
        }
      }
    } catch (_error) {}
  }
  return bname.endsWith('.json') ? 'json' : 'text'
}

exports.getTextFileFormat = getTextFileFormat

/**
 * @param {*} obj The object to strigify.
 * @param {string} format The format to use. Typical values are 'text', 'json', 'json-stringify'
 * @param {string} [filename] The optional filename.
 */
function stringify(obj, format, filename = null) {
  try {
    let result

    if (!format || format === 'text') {
      if (Array.isArray(result)) {
        result = result.join('\n')
      } else {
        result = obj.toString()
      }

      format = getTextFileFormat(filename)
      obj = parse(result, format, filename)
    } else if (format === 'json5') {
      format = 'json'
    }

    if (format === 'json-stringify') {
      result = JSON.stringify(obj, null, 2)
    } else if (format === 'json') {
      result = hjson.stringify(obj, {
        emitRootBraces: true,
        bracesSameLine: true,
        separator: true,
        quotes: 'all',
        multiline: 'std',
        space: 2,
        eol: '\n',
        keepWsc: true
      })
    }

    if (format !== 'text') {
      result = prettierInterface.format(result, { ignoreErrors: true, parser: format })
    }

    if (result.charCodeAt(0) === 0xfeff) {
      result = result.slice(1)
    }
    result = result.replace(/[\r\n]/gm, '\n')
    if (result.length !== 0 && !result.endsWith('\n')) {
      result += '\n'
    }
    return result
  } catch (error) {
    if (filename && error && !error.path) {
      error.path = filename
    }
    throw error
  }
}

exports.stringify = stringify

/**
 * @param {string} filename The path of the file to read.
 * @param {string} format The format to use. Typical values are 'text', 'json', 'json-stringify'
 */
function readTextFile(filename, format) {
  if (!format) {
    format = getTextFileFormat(filename)
  }
  try {
    return parse(fs.readFileSync(filename, 'utf8'), format)
  } catch (error) {
    if (error && !error.path) {
      error.path = filename
    }
    throw error
  }
}

exports.readTextFile = readTextFile

function prettifyFile(filename, format = '', source = null) {
  try {
    source = typeof source === 'string' ? source : fs.readFileSync(filename, 'utf8')
    let formatted = source
    if (formatted.charCodeAt(0) === 0xfeff) {
      formatted = formatted.slice(1)
    }
    if (!format || format === 'text') {
      format = getTextFileFormat(filename)
    }

    formatted = stringify(parse(source, format, filename), format, filename)
    if (source !== formatted) {
      fs.writeFileSync(filename, formatted, { encoding: 'utf8' })
      return true
    }
  } catch (error) {
    if (error && !error.path) {
      error.path = filename
    }
    throw error
  }
  return false
}

exports.prettifyFile = prettifyFile

async function updateTextFileAsync({ filePath, content, beforeWrite, basePath = process.cwd(), format = '' }) {
  let source

  const filePaths = Array.isArray(filePath) ? filePath : [filePath]
  if (filePaths.length === 0) {
    return false
  }

  let exists = false

  let targetPath
  for (let f of filePaths) {
    f = path.resolve(basePath, f)
    if (content !== false) {
      try {
        source = fs.readFileSync(f)
        exists = true
        break
      } catch (error) {
        const code = error && error.code
        if (code !== 'ENOENT' && code !== 'EISDIR') {
          if (error && !error.path) {
            error.path = f
          }
          throw error
        }
      }
    }
  }
  if (!targetPath) {
    targetPath = path.resolve(basePath, filePaths[0])
  }

  const previousContent = parse(source, format)

  if (typeof content === 'function') {
    content = await content(parse(source, format), targetPath, path.relative(basePath, targetPath))
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
      mkdirp.sync(path.dirname(targetPath))

      fs.writeFileSync(targetPath, stringify(content, format, targetPath), { encoding: 'utf8' })

      if (!exists) {
        console.log(` ${chalk.green('+')} ${path.relative(basePath, targetPath)} ${chalk.greenBright('created')}.`)
      } else {
        console.log(` ${chalk.yellow('+')} ${path.relative(basePath, targetPath)} ${chalk.yellowBright('updated')}.`)
      }
    } catch (error) {
      if (error && !error.path) {
        error.path = targetPath
      }
      throw error
    }
  } else if (previousContent !== undefined && prettifyFile(targetPath, format, source)) {
    console.log(` ${chalk.gray('-')} ${path.relative(basePath, targetPath)} ${chalk.yellow('prettified')}.`)
  } else {
    console.log(` ${chalk.gray('-')} ${path.relative(basePath, targetPath)} ${chalk.grey('already up to date')}.`)
  }

  if (!exists) {
    return 'created'
  }

  if (shouldUpdate) {
    return 'updated'
  }

  return false
}

exports.updateTextFileAsync = updateTextFileAsync
