'use strict'

require('../../core/node-modules')

const path = require('path')
const fs = require('fs')
const chalk = require('chalk').default
const util = require('util')
const { jsonEqual, jsoncParse, jsoncStringify } = require('../../core/mergeEslintConfigs')
const mkdirp = require('mkdirp')

const readFileAsync = util.promisify(fs.readFile)
const writeFileAsync = util.promisify(fs.writeFile)

function resolveAcurisEslintFile(...parts) {
  return path.resolve(__dirname, '..', '..', ...parts)
}

exports.resolveAcurisEslintFile = resolveAcurisEslintFile

function resolveProjectFile(...parts) {
  return path.resolve(process.cwd(), ...parts)
}

exports.resolveProjectFile = resolveProjectFile

function stripBOM(content) {
  content = content.toString()
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
}

function isErrorIgnored(error, ignoreErrors) {
  if (error && (ignoreErrors.includes(error.code) || ignoreErrors.includes(error.constructor))) {
    return true
  }
  return false
}

async function readTextFile(filePath, ignoreErrors = []) {
  try {
    return stripBOM(await readFileAsync(filePath, 'utf8')).replace(/[\r\n]/gm, '\n')
  } catch (error) {
    if (isErrorIgnored(error, ignoreErrors)) {
      return null
    }
    throw error
  }
}

exports.readTextFile = readTextFile

async function updateTextFile({
  filePath,
  content,
  beforeWrite = () => true,
  ignoreErrors = [],
  basePath = process.cwd(),
  isJSON = false
}) {
  let previousContent

  filePath = resolveProjectFile(filePath)
  if (content !== false) {
    try {
      previousContent = await readFileAsync(filePath, 'utf8')
    } catch (error) {
      if (!isErrorIgnored(error, ['EISDIR', 'ENOENT', ...ignoreErrors])) {
        if (error && !error.path) {
          error.xpath = filePath
        }
        throw error
      }
    }
  }

  if (isJSON && previousContent !== undefined) {
    previousContent = jsoncParse(previousContent)
  }

  if (typeof content === 'function') {
    content = await content(previousContent, filePath)
  }

  if (content === undefined /*|| jsonEqual(previousContent, content)*/) {
    console.log(` ${chalk.gray('-')} ${path.relative(basePath, filePath)} ${chalk.grey('already up to date')}.`)
    return false
  }

  if (beforeWrite && !(await beforeWrite(content))) {
    return false
  }

  try {
    await mkdirpAsync(path.dirname(filePath))

    await writeFileAsync(filePath, isJSON ? jsoncStringify(content) : content, { encoding: 'utf8' })

    if (previousContent === undefined) {
      console.log(` ${chalk.green('+')} ${path.relative(basePath, filePath)} ${chalk.greenBright('created')}.`)
    } else {
      console.log(` ${chalk.yellow('+')} ${path.relative(basePath, filePath)} ${chalk.yellowBright('updated')}.`)
    }
  } catch (error) {
    if (isErrorIgnored(error, ignoreErrors)) {
      return false
    }
    if (error && !error.path) {
      error.path = filePath
    }
    throw error
  }

  return true
}

exports.updateTextFile = updateTextFile

class DeleteFileOrDirResult {
  constructor() {
    this.folders = 0
    this.files = 0
  }

  get count() {
    return this.folders + this.files
  }

  toString() {
    const folderMsg = this.folders > 0 && `${this.folders} ${this.folders > 1 ? 'folders' : 'folder'}`
    const filesMsg = this.files > 0 && `${this.files} ${this.files > 1 ? 'folders' : 'folder'}`
    if (folderMsg) {
      return filesMsg ? `${folderMsg} and ${filesMsg} deleted` : `${folderMsg} deleted`
    }
    if (filesMsg) {
      return `${filesMsg} deleted`
    }
    return 'Nothing was deleted.'
  }
}

function deleteFileOrDir(pathToDelete) {
  const result = new DeleteFileOrDirResult()
  if (!pathToDelete) {
    return result
  }
  if (typeof pathToDelete !== 'string') {
    for (const item of pathToDelete) {
      const d = deleteFileOrDir(item)
      result.files += d.files
      result.folders += d.folders
    }
    return result
  }
  pathToDelete = path.resolve(pathToDelete)
  try {
    const stats = fs.lstatSync(pathToDelete)
    if (stats.isDirectory()) {
      for (const file of fs.readdirSync(pathToDelete)) {
        const d = deleteFileOrDir(path.join(pathToDelete, file))
        result.files += d.files
        result.folders += d.folders
      }
      fs.rmdirSync(pathToDelete)
      ++result.folders
    } else {
      fs.unlinkSync(pathToDelete)
      ++result.files
    }
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error
    }
  }
  return result
}

exports.deleteFileOrDir = deleteFileOrDir

function mkdirpAsync(dir, opts) {
  return new Promise((resolve, reject) => {
    mkdirp(dir, opts, (err, made) => {
      if (err) {
        reject(err)
      } else {
        resolve(made)
      }
    })
  })
}
