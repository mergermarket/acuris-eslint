const path = require('path')
const fs = require('fs')

function deleteFileOrDir(pathToDelete) {
  let count = 0
  if (!pathToDelete) {
    return count
  }
  if (typeof pathToDelete !== 'string') {
    for (const item of pathToDelete) {
      if (deleteFileOrDir(item)) {
        ++count
      }
    }
  }
  pathToDelete = path.resolve(pathToDelete)
  try {
    const stats = fs.lstatSync(pathToDelete)
    if (stats.isDirectory()) {
      for (const file of fs.readdirSync(pathToDelete)) {
        count += deleteFileOrDir(path.join(pathToDelete, file))
      }
      fs.rmdirSync(pathToDelete)
      ++count
    } else {
      fs.unlinkSync(pathToDelete)
    }
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error
    }
  }
  return count
}

exports.deleteFileOrDir = deleteFileOrDir
