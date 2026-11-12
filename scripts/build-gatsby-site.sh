#!/usr/bin/env bash
# Clone (if needed) gatsby-starter-default at a pinned commit, copy the pages
# of fixture/ over it, and build it into .gatsby-site, so the webship-js suite
# in tests/features/ has a real Gatsby production build to run against.
# Serving it is a separate step: see README.md and ci.yml.
#
# STARTER_REF can name another commit, branch or tag of the starter.

set -eu -o pipefail

SITE_DIR=".gatsby-site"
STARTER_REPO="https://github.com/gatsbyjs/gatsby-starter-default.git"
STARTER_REF="${STARTER_REF:-e75499f}"
FIXTURE_DIR="$(cd "$(dirname "$0")/.." && pwd)/fixture"

if [ ! -d "$SITE_DIR/.git" ]; then
  echo "Cloning gatsby-starter-default ($STARTER_REF) into $SITE_DIR ..."
  git clone "$STARTER_REPO" "$SITE_DIR"
fi

git -C "$SITE_DIR" checkout --quiet "$STARTER_REF"

echo "Copying the fixture pages ..."
cp -R "$FIXTURE_DIR"/. "$SITE_DIR"/

cd "$SITE_DIR"
echo "Installing dependencies ..."
npm install --no-audit --no-fund
echo "Building site ..."
npm run build

echo "Gatsby build complete: $SITE_DIR/public"
