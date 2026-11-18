#!/usr/bin/env bash
# Clone (if needed) gatsby-starter-default at a pinned commit, copy the pages
# of fixture/ over it, and build it into .gatsby-site, so the webship-js suite
# in tests/features/ has a real Gatsby production build to run against.
# Serving it is a separate step: see README.md and ci.yml.
#
# STARTER_REF can name another commit, branch or tag of the starter, and
# STARTER_REPO another repository to clone it from.

set -eu -o pipefail

SITE_DIR=".gatsby-site"
STARTER_REPO="${STARTER_REPO:-https://github.com/gatsbyjs/gatsby-starter-default.git}"
STARTER_REF="${STARTER_REF:-e75499f}"
FIXTURE_DIR="$(cd "$(dirname "$0")/.." && pwd)/fixture"

if [ ! -d "$SITE_DIR/.git" ]; then
  echo "Cloning gatsby-starter-default ($STARTER_REF) into $SITE_DIR ..."
  # A clone can fail for a moment on the forge's side (an HTTP 403 or 5xx on a
  # CI runner): try three times before giving up.
  for ATTEMPT in 1 2 3; do
    if git clone "$STARTER_REPO" "$SITE_DIR"; then
      break
    fi
    rm -rf "$SITE_DIR"
    if [ "$ATTEMPT" = 3 ]; then
      echo "Could not clone $STARTER_REPO after 3 attempts." >&2
      exit 1
    fi
    echo "The clone failed (attempt $ATTEMPT of 3); trying again in 10 seconds ..."
    sleep 10
  done
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
