# exit when any command fails
set -e
npm version patch -m "Version %s"
git push origin master
npm config set '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}"
npm publish --access public
