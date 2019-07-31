set -e

git fetch
git checkout master
git pull
#npm i
#npm run lint -- --max-warnings 0
#npm test
npm version patch -m "Version %s"
git push --follow-tags
