#!/usr/bin/env bash
# Clone (if needed) and build gatsby-starter-default into .gatsby-site,
# so the webship-js suite in tests/features/ has a real Gatsby site to run
# against. Serving it is a separate step — see README.md / ci.yml.

set -eu -o pipefail

SITE_DIR=".gatsby-site"
STARTER_REPO="https://github.com/gatsbyjs/gatsby-starter-default.git"

if [ ! -d "$SITE_DIR/.git" ]; then
  echo "Cloning gatsby-starter-default into $SITE_DIR ..."
  git clone --depth 1 "$STARTER_REPO" "$SITE_DIR"
fi

cd "$SITE_DIR"
echo "Installing dependencies ..."
npm install --no-audit --no-fund
echo "Building site ..."
npm run build

echo "Gatsby build complete: $SITE_DIR/public"
