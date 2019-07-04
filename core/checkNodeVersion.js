'use strict'

if (!process || !process.version || process.version.match(/v(\d+)\./)[1] < 8) {
  throw new Error(`Node 8.10.0 or greater is required. Current version is ${process && process.version}`)
}
