'use strict'

require('../../core/node-modules')

const path = require('path')
const fs = require('fs')

function resolveAcurisEslintFile(...parts) {
  return path.resolve(__dirname, '..', '..', ...parts)
}

exports.resolveAcurisEslintFile = resolveAcurisEslintFile

function resolveProjectFile(...parts) {
  return path.resolve(process.cwd(), ...parts)
}

exports.resolveProjectFile = resolveProjectFile

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

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile()
  } catch (_error) {
    return false
  }
}

exports.fileExists = fileExists

function findRootPackageJson(baseFolder = process.cwd()) {
  let result
  baseFolder = path.resolve(baseFolder)
  let p = baseFolder
  for (;;) {
    const packageJsonPath = path.resolve(p, 'package.json')
    if (fileExists(packageJsonPath)) {
      result = packageJsonPath
    }
    const parent = path.dirname(p) || ''
    if (parent.length === p.length) {
      break
    }
    p = parent
  }
  return result
}

exports.findRootPackageJson = findRootPackageJson
