'use strict'

const { jsonEqual, sortPackageJson } = require('eslint-plugin-quick-prettier/json-utils')
const prettierInterface = require('eslint-plugin-quick-prettier/prettier-interface')
const { mkdirSync } = require('./fs-utils')
const CJSON = require('comment-json')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

exports.askConfirmation = async function askConfirmation(message, defaultValue = true) {
  if (!process.stdin || !process.stdout || !process.stdout.isTTY) {
    return true
  }
  return new Promise((resolve) => {
    const rl = require('readline').createInterface(process.stdin, process.stdout)
    const question = `${chalk.greenBright('?')} ${chalk.whiteBright(message)} ${chalk.gray(
      defaultValue ? '(Y/n)' : '(N/y)'
    )} `
    rl.question(question, (answer) => {
      rl.close()
      answer = (answer || '').trim()
      const confirm = /^[yY]/.test(answer || (defaultValue ? 'Y' : 'N'))
      console.log(confirm ? chalk.greenBright('  Yes') : chalk.redBright('  No'))
      console.log()
      resolve(confirm)
    })
  })
}

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
            return CJSON.parse(source)
          } catch (_error) {
            throw error
          }
        }
      } else {
        return CJSON.parse(source)
      }
    }

    if (format && format !== 'text') {
      return prettierInterface.format(source, { ignoreErrors: true, parser: format })
    }

    return source
  } catch (error) {
    if (error) {
      if (filename && !error.path) {
        error.path = filename
      }
      if (!error.format) {
        error.format = format
      }
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

    if (!format) {
      format = getTextFileFormat(filename) || 'text'
    }

    if (format === 'text') {
      if (Buffer.isBuffer(format)) {
        format = format.toString('utf8')
      } else if (Array.isArray(result)) {
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
      if (filename && path.basename(filename) === 'package.json') {
        obj = sortPackageJson(obj)
      }
      result = JSON.stringify(obj, null, 2)
    } else if (format === 'json') {
      result = CJSON.stringify(obj, null, 2)
    }

    if (format !== 'text') {
      result = prettierInterface.format(result, { ignoreErrors: true, parser: format })
    }

    return cleanupText(result)
  } catch (error) {
    if (filename && error && !error.path) {
      error.path = filename
    }
    throw error
  }
}

function cleanupText(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }
  text = text.replace(/[\r\n]/gm, '\n')
  if (text.length !== 0 && !text.endsWith('\n')) {
    text += '\n'
  }
  return text
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

    const prettier = prettierInterface.tryGetPrettier()
    if (prettier && format !== 'text' && path.basename(filename) !== 'package.json') {
      formatted = cleanupText(prettierInterface.format(formatted, { ignoreErrors: true, parser: format }))
    } else {
      formatted = stringify(parse(source, format, filename), format, filename)
    }

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

async function updateTextFileAsync({
  filePath,
  content,
  beforeWrite,
  basePath = process.cwd(),
  format = '',
  throwIfNotFound = false,
  askConfirmation = false
}) {
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
        targetPath = f
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

    if (throwIfNotFound) {
      fs.statSync(targetPath)
    } else if (fs.existsSync(targetPath)) {
      exists = true
    }
  }

  const previousContent = parse(source, format)

  const targetName = path.relative(basePath, targetPath)
  if (typeof content === 'function') {
    content = await content(parse(source, format), targetPath, targetName)
  }

  let shouldUpdate = true

  if (content === undefined || jsonEqual(previousContent, content)) {
    shouldUpdate = false
  }

  if (shouldUpdate && beforeWrite && !(await beforeWrite(previousContent, content))) {
    shouldUpdate = false
  }

  if (shouldUpdate && askConfirmation) {
    const confirmed = await exports.askConfirmation(
      `Can I ${exists ? 'update' : 'create'} file ${chalk.yellowBright(targetName)}?`
    )
    if (!confirmed) {
      shouldUpdate = false
    }
  }

  if (shouldUpdate) {
    try {
      mkdirSync(path.dirname(targetPath))

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
    console.log(` ${chalk.yellow('-')} ${path.relative(basePath, targetPath)} ${chalk.yellow('prettified')}.`)
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
