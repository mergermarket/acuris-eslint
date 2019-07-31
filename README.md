# acuris-eslint

@acuris/eslint-config

# acuris-eslint

## For administrators:

To publish a new version in npm run `./CI/release.sh`, this will bump the patch version number (0.0.x), add a new release on git and start the `npm publish` operation in CI.
To update to a major version (x.x.0), update the version in package.json, commit and push before running ./CI/release.sh
