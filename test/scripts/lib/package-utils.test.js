const semver = require('semver')
const packageJson = require('../../../package.json')
const {
  sanitisePackageJson,
  semverToVersion,
  getMaxSemver,
  inferPackageVersion,
  addDevDependencies,
  isPackageInstalled,
  getPackagesToInstall
} = require('../../../scripts/lib/package-utils')
require('chai/register-expect')

describe('package-utils', () => {
  describe('sanitisePackageJson', () => {
    it('throws if an invalid package.json is provided', () => {
      expect(() => sanitisePackageJson(null)).to.throw()
      expect(() => sanitisePackageJson(null)).to.throw()
      expect(() => sanitisePackageJson('')).to.throw()
      expect(() => sanitisePackageJson([])).to.throw()
      expect(() => sanitisePackageJson({})).to.throw()
      expect(() => sanitisePackageJson({ name: '' })).to.throw()
      expect(() => sanitisePackageJson({ name: '', version: '' })).to.throw()
    })

    it('adds missing fields', () => {
      expect(
        sanitisePackageJson({
          name: 'xxx',
          version: '1.2.3'
        })
      ).to.deep.include({
        name: 'xxx',
        version: '1.2.3',
        description: 'xxx',
        keywords: ['xxx'],
        license: 'UNLICENSED',
        repository: packageJson.repository,
        homepage: packageJson.homepage,
        engines: packageJson.engines
      })
    })
  })

  describe('semverToVersion', () => {
    it('handes invalid types', () => {
      expect(semverToVersion(null)).to.equal(null)
      expect(semverToVersion(undefined)).to.equal(null)
      expect(semverToVersion('')).to.equal(null)
    })

    it('works for a simple version', () => {
      expect(semverToVersion('1.2.3')).to.equal('1.2.3')
    })

    it('works for ~ ^ and >=', () => {
      expect(semverToVersion('^1.2.3')).to.equal('1.2.3')
      expect(semverToVersion('~1.2.3')).to.equal('1.2.3')
      expect(semverToVersion('>=1.2.3')).to.equal('1.2.3')
    })

    it('works for <=', () => {
      expect(semverToVersion('<=1.2.3')).to.equal('1.2.3')
      expect(semverToVersion('<=1.2.3-alpha')).to.equal('1.2.3-alpha')
    })

    it('works for a range with >=', () => {
      expect(semverToVersion('<20.0.0 >=1.2.3')).to.equal('1.2.3')
      expect(semverToVersion('<20.0.0 >=1.2.3-alpha')).to.equal('1.2.3-alpha')
    })

    it('works for an invalid range with >=', () => {
      expect(semverToVersion('>=1.2.3<20.0.0')).to.equal('1.2.3')
    })

    it('works for <', () => {
      expect(semverToVersion('<1.2.3-alpha')).to.equal('1.2.3')
    })

    it('returns file: as they are', () => {
      expect(semverToVersion('file:hello/xxx')).to.equal('file:hello/xxx')
    })
  })

  describe('getMaxSemver', () => {
    it('returns default for empty', () => {
      expect(getMaxSemver(null)).to.equal(null)
      expect(getMaxSemver(undefined)).to.equal(null)
      expect(getMaxSemver('')).to.equal(null)
    })

    it('returns the maximum of two versions', () => {
      expect(getMaxSemver('0.0.1', '0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('0.0.0', '0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('0.1.0', '0.0.1')).to.equal('0.1.0')
    })

    it('returns the maximum of two versions, with prefixes', () => {
      expect(getMaxSemver('0.0.1', '^0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('0.0.0', '^0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('0.1.0', '^0.0.1')).to.equal('0.1.0')

      expect(getMaxSemver('^0.0.1', '0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('^0.0.0', '0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('^0.1.0', '0.0.1')).to.equal('0.1.0')

      expect(getMaxSemver('~0.0.1', '^0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('~0.0.0', '~0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('~0.1.0', '0.0.1')).to.equal('0.1.0')

      expect(getMaxSemver('>=0.0.1', '^0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('>=0.0.0', '~0.0.1')).to.equal('0.0.1')
      expect(getMaxSemver('>=0.1.0', '0.0.1')).to.equal('0.1.0')
    })

    it('returns the maximum of a version and a range', () => {
      expect(getMaxSemver('0.0.1', '>=2.1.0<4.0.0')).to.equal('2.1.0')
    })
  })

  describe('inferPackageVersion', () => {
    it('returns null for invalid package names', () => {
      expect(inferPackageVersion('---invalid-package-')).to.equal(null)
    })

    it('infers typescript version correctly', () => {
      expect(semver.gte(inferPackageVersion('typescript'), '3.5.3')).to.equal(true)
    })

    it('infers package version from a manifest', () => {
      expect(
        inferPackageVersion('xxx---custom-package', { devDependencies: { 'xxx---custom-package': '4.0.0' } })
      ).to.equal('4.0.0')
    })
  })

  describe('addDevDependencies', () => {
    it('adds dependencies to an empty package.json', () => {
      const p = {}
      expect(addDevDependencies(p, ['typescript', 'eslint'])).to.equal(true)
      validateSemver(p.devDependencies.typescript)
      validateSemver(p.devDependencies.eslint)
      expect(p.dependencies).to.equal(undefined)
    })

    it('updates version', () => {
      const p = {
        dependencies: { typescript: '1.0.0' },
        devDependencies: { eslint: '^1.0.0' }
      }
      expect(addDevDependencies(p, ['typescript', 'eslint'])).to.equal(true)
      validateSemverGreater(p.dependencies.typescript, '1.0.0')
      validateSemverGreater(p.devDependencies.eslint, '1.0.0')
      expect(addDevDependencies(p, ['typescript', 'eslint'])).to.equal(false)
    })

    it('ignores packages that cannot be found', () => {
      const source = {
        dependencies: { typescript: '1.0.0' },
        devDependencies: { eslint: '^1.0.0' }
      }
      const p = JSON.parse(JSON.stringify(source))
      expect(addDevDependencies(p, ['---invalid-package'])).to.equal(false)
      expect(p).to.deep.equal(source)
    })
  })

  describe('isPackageInstalled', () => {
    it('is true for typescript', () => {
      expect(isPackageInstalled('typescript')).to.equal(true)
    })

    it('is true for typescript, with a specific version', () => {
      expect(isPackageInstalled('typescript', '1.0.0')).to.equal(true)
    })

    it('is true for typescript, with a non existing version', () => {
      expect(isPackageInstalled('typescript', '9999.98.97')).to.equal(false)
    })

    it('is false for a non existing package', () => {
      expect(isPackageInstalled('---not-existing-pkg')).to.equal(false)
    })
  })

  describe('getPackagesToInstall', () => {
    it('is empty for this package', () => {
      expect(getPackagesToInstall(packageJson).length).to.equal(0)
    })

    it('it shows missing packages', () => {
      expect(
        getPackagesToInstall({
          ...packageJson,
          devDependencies: { ...packageJson.devDependencies, 'xxx--not-existing-pkg': '1.0.0' }
        })
      ).to.deep.equal(['xxx--not-existing-pkg@1.0.0'])
    })
  })
})

function validateSemver(v) {
  expect(typeof v).to.equal('string')
  if (v.startsWith('^')) {
    v = v.slice(1)
  }
  const parsed = semver.parse(v)
  expect(parsed && parsed.version).to.equal(v)
  return parsed.version
}

function validateSemverGreater(a, b) {
  expect(semver.gt(validateSemver(a), b)).to.equal(true)
}
