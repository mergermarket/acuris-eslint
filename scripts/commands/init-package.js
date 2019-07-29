'use strict'

const chalk = require('chalk').default
const { spawn } = require('child_process')
const util = require('util')
const spawnAsync = util.promisify(spawn)
const { notes, emitWarning } = require('../lib/notes')

const referencePackageJson = require('../../package.json')

const { resolveProjectFile, fileExists, findUp } = require('../lib/fs-utils')
const { updateTextFileAsync, readTextFile } = require('../lib/text-utils')
const { sanitisePackageJson, addDevDependencies, hasPackagesToInstall } = require('../lib/package-utils')

module.exports = async () => {
  const packageJsonPath = resolveProjectFile('package.json')

  if (packageJsonPath && packageJsonPath !== findUp('package.json', { directories: false, files: false })) {
    throw new Error(
      `Cannot initialize a sub package. Run this command in the root project. Root project found at ${packageJsonPath}.`
    )
  }

  if (!packageJsonPath) {
    emitWarning(chalk.yellow('package.json not found. Creating one...\n'))
    await spawnAsync('npm', ['init'], { stdio: 'inherit' })
  }

  if (!findUp(resolveProjectFile('.git'), { directories: true, files: false })) {
    notes.gitFolderNotFound = true
  }

  await updateTextFileAsync({
    format: 'json-stringify',
    filePath: packageJsonPath,
    throwIfNotFound: true,
    async content(manifest) {
      if (typeof manifest !== 'object' || manifest === null || Array.isArray(manifest)) {
        throw new TypeError('Invalid package.json')
      }

      if (manifest.private === undefined && !manifest.files && !fileExists(resolveProjectFile('.npmignore'))) {
        notes.packageJsonIsNotPrivateWarning = true
      }

      if (!manifest.scripts) {
        manifest.scripts = {}
      }
      if (manifest.scripts['acuris-eslint'] === undefined) {
        manifest.scripts['acuris-eslint'] = 'acuris-eslint'
      }

      const devDependenciesToAdd = new Set(Object.keys(referencePackageJson.peerDependencies))

      if (manifest.name !== referencePackageJson.name) {
        devDependenciesToAdd.add(manifest.name)
      }

      //addDevDependencies(manifest, devDependenciesToAdd)

      /*
      const manifestAllDependencies = getAllDependencyNames(manifest)
      hasTypescript = getHasTypescript(manifestAllDependencies)
      if (hasTypescript) {
        addTypescriptDependencies(devDependenciesToAdd)
      }

      if (nodeModules.hasLocalPackage('jest')) {
        addDependencies(devDependenciesToAdd, 'jest')
      }

      if (nodeModules.hasLocalPackage('mocha')) {
        addDependencies(devDependenciesToAdd, 'mocha')
      }

      if (nodeModules.hasLocalPackage('mocha') || nodeModules.hasLocalPackage('chai')) {
        addDependencies(devDependenciesToAdd, ['eslint-plugin-chai-expect'])
      }

      if (nodeModules.hasLocalPackage('react') || nodeModules.hasLocalPackage('webpack')) {
        addDependencies(devDependenciesToAdd, 'react')
        addDependencies(devDependenciesToAdd, 'jsx-a11y')
        addDependencies(devDependenciesToAdd, 'css-modules')
      }

      if (addDevDependencies(manifest, devDependenciesToAdd)) {
        notes.needsNpmInstall = true
      }*/

      manifest = sanitisePackageJson(manifest)
      return manifest
    }
  })

  if (!notes.needsNpmInstall && hasPackagesToInstall(readTextFile(packageJsonPath, 'json-stringify'))) {
    notes.needsNpmInstall = true
  }
}

function addTypescriptDependencies(devDependenciesToAdd) {
  for (const dep of Object.keys(referencePackageJson.devDependencies)) {
    if (dep.includes('typescript') || dep.includes('@types/')) {
      devDependenciesToAdd.add(dep)
    }
  }
}

function getHasTypescript(manifestAllDependencies) {
  if (
    manifestAllDependencies.has('tslint') ||
    manifestAllDependencies.has('typescript') ||
    manifestAllDependencies.has('acuris-shared-component-tools') ||
    fileExists(resolveProjectFile('tsconfig.json')) ||
    fileExists(resolveProjectFile('tslint.json'))
  ) {
    return true
  }

  for (const name of manifestAllDependencies) {
    if (name.includes('typescript')) {
      return true
    }
  }

  return false
}

module.exports.description = 'updates package.json'
