set -e

git checkout master
git pull
npm version patch -m "Version %s"
git push --follow-tags