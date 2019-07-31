const fs = require('fs')
const path = require('path')

describe('project', () => {
  it('does not have yarn.lock', () => {
    if (fs.existsSync(path.resolve(__dirname, '..', 'yarn.lock'))) {
      throw new Error('yarn.lock is present, delete it and use `npm install` and not `yarn` for this project.')
    }
  })
})
