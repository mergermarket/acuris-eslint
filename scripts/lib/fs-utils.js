'use strict'

require('../../core/node-modules')

const { spawn } = require('child_process')
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

function mkdirSync(p) {
  p = path.resolve(p)
  if (p === '/' || path.dirname(p) === p) {
    return
  }

  try {
    fs.mkdirSync(p, 511 & ~process.umask())
  } catch (err0) {
    if (err0 && err0.code === 'ENOENT') {
      mkdirSync(path.dirname(p))
      return
    }
    let stat
    try {
      stat = fs.statSync(p)
    } catch (err1) {
      throw err0
    }
    if (!stat.isDirectory()) {
      throw err0
    }
  }
}

exports.mkdirSync = mkdirSync

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
    const filesMsg = this.files > 0 && `${this.files} ${this.files > 1 ? 'files' : 'files'}`
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

function directoryExists(filePath) {
  try {
    return fs.statSync(filePath).isDirectory()
  } catch (_error) {
    return false
  }
}

exports.directoryExists = directoryExists

function findUp(filename, { directories = true, files = true, cwd = process.cwd() }) {
  let result
  cwd = path.resolve(cwd)
  let p = cwd
  for (;;) {
    const resolvedPath = path.resolve(p, filename)
    if (files && !directories) {
      if (fileExists(resolvedPath)) {
        result = resolvedPath
      }
    } else if (directories && !files) {
      if (directoryExists(resolvedPath)) {
        result = resolvedPath
      }
    } else if (fs.existsSync(resolvedPath)) {
      result = resolvedPath
    }
    const parent = path.dirname(p) || ''
    if (parent.length === p.length) {
      break
    }
    p = parent
  }
  return result
}

exports.findUp = findUp

function getRepositoryFromGitConfig(cwd = process.cwd()) {
  let gitConfig
  try {
    const found = findUp('.git/config', { files: true, directories: false, cwd })
    gitConfig = found && fs.readFileSync(found, 'utf8').split('\n')
  } catch (_error) {}
  if (gitConfig) {
    const indexOfRemoteOrigin = gitConfig.indexOf('[remote "origin"]')
    for (let i = indexOfRemoteOrigin + 1; i < gitConfig.length; ++i) {
      const line = gitConfig[i].trim()
      if (line.startsWith('url = ')) {
        let repo = line.slice('url = '.length).trim()
        if (repo.startsWith('git@github.com:')) {
          repo = repo.slice('git@github.com:'.length).trim()
          if (repo.length !== 0) {
            repo = `https://github.com/${repo}`
          }
        }
        if (repo) {
          return {
            repository: 'git',
            url: repo
          }
        }
      }
    }
  }
  return undefined
}

exports.getRepositoryFromGitConfig = getRepositoryFromGitConfig

async function runAsync(command, args = [], options) {
  const oldEnv = process.env.ACURIS_ESLINT_RUN_ASYNC
  process.env.ACURIS_ESLINT_RUN_ASYNC = command
  try {
    await new Promise((resolve, reject) => {
      const opt = {
        stdio: 'inherit',
        ...options
      }

      const outputToString = opt.stdio === 'string'
      if (outputToString) {
        delete opt.stdio
      }

      let result
      const child = spawn(command, args, opt)
      child
        .on('exit', code => {
          if (code !== 0) {
            reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`))
          } else {
            resolve(result)
          }
        })
        .on('error', error => {
          reject(error || new Error(`${command} failed`))
        })
        .on('data', d => {
          result += d
        })
    })
  } finally {
    if (oldEnv !== undefined) {
      process.env.ACURIS_ESLINT_RUN_ASYNC = oldEnv
    } else {
      delete process.env.ACURIS_ESLINT_RUN_ASYNC
    }
  }
}

exports.runAsync = runAsync
