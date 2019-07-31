const { fork } = require('child_process')

describe('eslint', () => {
  it('can lint this file', function() {
    this.timeout(5000)
    return new Promise((resolve, reject) => {
      fork(require.resolve('../scripts/acuris-eslint'), [__filename], {
        stdio: 'inherit'
      })
        .on('close', code => {
          if (code !== 0) {
            reject(new Error(`acuris-eslint failed with error code${code}`))
          } else {
            resolve()
          }
        })
        .on('error', error => {
          reject(error || new Error())
        })
    })
  })
})
