'use strict'

const chalk = require('chalk').default
const path = require('path')
const { spawn } = require('child_process')
const util = require('util')
const spawnAsync = util.promisify(spawn)

const { resolveProjectFile, findRootPackageJson } = require('../lib/fs-utils')
const { readJsonFile } = require('../lib/json-utils')
const { updateTextFileAsync } = require('../lib/text-utils')

module.exports = async () => {
  let packageJsonPath = resolveProjectFile('package.json')

  if (packageJsonPath && packageJsonPath !== findRootPackageJson(path.dirname(packageJsonPath))) {
    throw new Error(
      `Cannot initialize a sub package. Run this command in the root project. Root project found at ${packageJsonPath}.`
    )
  }

  if (!packageJsonPath) {
    console.log(chalk.yellow('package.json not found. Creating one...\n'))
    await spawnAsync('npm', ['init'], { stdio: 'inherit' })
    packageJsonPath = findRootPackageJson()
  }

  await updateTextFileAsync({
    isJSON: true,
    filePath: packageJsonPath,
    async content(manifest) {
      sanitiseManifest(manifest)

      console.log(manifest)
      return manifest
    }
  })
}

module.exports.description = 'creates or updates packages'

function sanitiseManifest(manifest) {
  if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
    throw new Error('package.json must be an object')
  }
  if (typeof manifest.name !== 'string' || manifest.name.trim().length === 0) {
    throw new Error('package.json must contain a valid "name" property')
  }
  if (typeof manifest.version !== 'string' || manifest.version.trim().length === 0) {
    throw new Error('package.json must contain a valid "version" property')
  }
  if (!manifest.description) {
    manifest.description = manifest.name
  }
  if (!manifest.keywords) {
    manifest.keywords = [manifest.name]
  }
  if (!manifest.license) {
    manifest.license = 'UNLICENSED'
  }
  if (!manifest.engines) {
    manifest.engines = {}
  }
  if (typeof manifest.engines === 'object' && !manifest.engines.node) {
    manifest.engines.node = '>=8.10.0'
  }
}
