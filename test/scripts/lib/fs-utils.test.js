const packageJson = require('../../../package.json')
const { getRepositoryFromGitConfig } = require('../../../scripts/lib/fs-utils')
require('chai/register-expect')

describe('fs-utils', () => {
  describe('getRepositoryFromGitConfig', () => {
    it('returns the correct repository', () => {
      expect(getRepositoryFromGitConfig()).to.deep.equal(packageJson.repository)
    })

    it('works also if given a subdirectory', () => {
      expect(getRepositoryFromGitConfig(__dirname)).to.deep.equal(packageJson.repository)
    })

    it('returns undefined if .git does not exists', () => {
      expect(getRepositoryFromGitConfig('/')).to.equal(undefined)
    })
  })
})
