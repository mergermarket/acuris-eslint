const { fork } = require('child_process')

describe('eslint', function () {
  this.timeout(8000)

  it('has working rules', () => {
    require('../index')
  })

  it('can lint this file', () => {
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
