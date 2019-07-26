npm config set '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}"
npm version 0.0.${BUILD_NUMBER}
npm publish --access public
