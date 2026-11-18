<p align="center"><img src="https://raw.githubusercontent.com/webship/gatsby-steps/2.0.x/assets/logo.svg" alt="Gatsby logo" width="96"></p>

# gatsby-steps

A [webship-js](https://webship.co/docs/webship-js/2.0.x) step pack for
[Gatsby](https://www.gatsbyjs.com/) sites. It tests what Gatsby itself does:
the production build, hydration, client-side routing, the route announcer,
prefetching, scroll restoration, optimized images, page-data, the 404 page,
the Head API and the web app manifest.

Published to npm as [`@webship-js/gatsby-steps`](https://www.npmjs.com/package/@webship-js/gatsby-steps).

## From nothing to a green run

What the machine needs: git, bash and Node.js 22 or later with npm. No
container: the site is a production build that `gatsby serve` serves.

**1. The site.** The fixture site of this repository, built the way CI builds
it: [gatsby-starter-default](https://github.com/gatsbyjs/gatsby-starter-default)
at a pinned commit with the pages of [`fixture/`](fixture/) copied over it
(see [The fixture site](#the-fixture-site)). Leave `gatsby serve` running in
its own terminal.

```bash
git clone https://github.com/webship/gatsby-steps.git
cd gatsby-steps
bash scripts/build-gatsby-site.sh
cd .gatsby-site && npx gatsby serve -p 8000
```

The site answers at `http://localhost:8000`.

**2. A test project**, in another terminal:

```bash
mkdir gatsby-tests && cd gatsby-tests
npm init -y
npm install --save-dev webship-js @webship-js/gatsby-steps
npx init-webship-js
```

`npx init-webship-js` writes `cucumber.js`, `playwright.config.ts`, the
`tests/` folders with a first feature and the `npm test` scripts, and installs
Chromium. npm usually runs it already when it installs webship-js; a second
run changes nothing.

**3. `cucumber.js`.** Replace the file with the wiring of the pack: the step
files of webship-js and the entry file of the pack, and the address of the
site. The suite needs no account (see [Test users](#test-users)).

```javascript
module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'node_modules/@webship-js/gatsby-steps/tests/step-definitions/gatsby.steps.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
    format: ['@cucumber/pretty-formatter', 'json:tests/reports/cucumber_report.json'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://localhost:8000',
      // The waits webship-js adds around each page, scenario and step (milliseconds).
      minWaitTime: { page: 3000, before_scenario: 0, after_scenario: 0, before_step: 0, after_step: 0 },
    },
  },
};
```

**4. A first feature**, `tests/features/first-run.feature`:

```gherkin
Feature: First run
  Scenario: The home page is a production build
    Given I am on the homepage
    Then the site should be a production build
    And the page generator version should start with "5"

  Scenario: A link opens the next page without a full page reload
    Given I am on the homepage
    When I click the link "Page 2" without a full page reload
    Then I should be on "/page-2/"
    And I should see a hydrated page
```

**5. Run it.**

```bash
npm test
```

A green first run prints every step, then the summary (the starter feature of
`npx init-webship-js` and the two scenarios above, passed) and the HTML report
it wrote:

```
3 scenarios (3 passed)
9 steps (9 passed)
0m10.959s (executing steps: 0m10.923s)
[webship-js] HTML report → …/gatsby-tests/tests/reports/cucumber_report.html
```

From there, copy the features of [`tests/features/`](tests/features/) (they
also ship in the package, under
`node_modules/@webship-js/gatsby-steps/tests/features/`): together they use
every step of the pack, against the pages of [the fixture site](#the-fixture-site).

### What the suite tests

The features of this repository run every step of the pack against the
fixture site's production build, and CI builds it and runs them on every
change: the build itself (the generator, a production build and not the
development server, a page of the current build, page-data, the 404 page and
its page-data, the web app manifest, the Head API); hydration of every page,
and a page that renders differently in the browser shown to fail the
hydration check; content rendered at build time and seen without JavaScript;
client-side routing (links and the back button without a full page reload,
the route announcer, prefetching of the links in the viewport and under the
mouse, scroll restoration, a link to a section); the rendering modes of a page
rendered on the server on every request and of a page generated on its first
request; optimized images of gatsby-plugin-image (the placeholder, lazy
loading, the formats); the page titles; and the structural accessibility
checks of the main pages.

Not tested: `gatsby develop` (the pack refuses it on purpose),
gatsby-plugin-offline, a site with a `pathPrefix`, sourcing content from a CMS
or files through GraphQL beyond what the starter does, Gatsby Functions, and
the hosting adapters. A run leaves nothing: the site is static.

## Install in your own project

```bash
npm install --save-dev webship-js @webship-js/gatsby-steps
```

Add the entry file to `require` in your `cucumber.js`:

```javascript
require: [
  'node_modules/webship-js/tests/step-definitions/**/*.js',                      // webship-js core steps
  'node_modules/@webship-js/gatsby-steps/tests/step-definitions/gatsby.steps.js', // this pack
  'tests/step-definitions/**/*.js',                                               // your own steps
],
```

Point `LAUNCH_URL` at a **production build** (`gatsby build` and `gatsby serve`),
not at `gatsby develop`. The development server keeps a hot-reload connection
open, so the page never goes network-idle and webship-js waits for tens of
seconds on every navigation. It also has no build hash and a different 404
page; the step "the site should be a production build" tells you at once when
the wrong server is behind `LAUNCH_URL`.

## Test users

None. The suite tests a production build (`gatsby build`, served by
`gatsby serve`), which has no sign-in: `cucumber.js` lists no accounts (its
`worldParameters` has no `users`), no scenario logs in, and the fixture site
that [`scripts/build-gatsby-site.sh`](scripts/build-gatsby-site.sh) builds has
no account to create. The JSON of the accounts is empty:

```json
{}
```

## Steps

Every Then step takes `should` or `should not`, every step takes `I`, `we` or
no pronoun, and every failure is a message with a hint, never a raw assertion
or Playwright stack. Each assertion polls its condition for the
`minWaitTime.page` budget (at least 10 seconds), so a page that is still
hydrating is waited for rather than failed. The sentences are plain English;
each one is documented in its step file with five examples.

### Build and runtime (`gatsby-site.steps.js`)

| Step | What it relies on in Gatsby |
| --- | --- |
| `the page generator should( not) (be\|start with\|contain) "Gatsby"` | `<meta name="generator" content="Gatsby 5.x.y">`, written by a production build only; the name is a value of the step |
| `the page generator version should( not) (be\|start with) "5.16"` | the first number of the generator meta tag, matched by whole parts from its start |
| `the site should( not) be a production build` | `window.___webpackCompilationHash` is set and there is no `socket.io` script (`gatsby develop` has no hash and loads one) |
| `I should( not) see a hydrated page` | React has attached to `#___gatsby` and `#gatsby-focus-wrapper` (`__reactContainer$`, `__reactFiber$` on the nodes) |
| `there should be (no) hydration errors` | React's hydration messages (`Minified React error #418`, `#423`, `#425`, or "Hydration failed") on `pageerror` and the console, recorded for every scenario |
| `the page should( not) be from the current build` | the inline build hash equals `page-data/app-data.json` |
| `the page head should( not) be set by the Head API` | tags rendered by the `Head` export carry `data-gatsby-head="true"` |
| `the web app manifest should be valid` | `<link rel="manifest">`, JSON with a name, `start_url` and icons that are served as images (gatsby-plugin-manifest) |
| `I should( not) see "text" without JavaScript` | a second browser context with JavaScript off sees the HTML rendered at build time (or on the server) |

`window.___gatsby` is not a Gatsby global: browsers expose every element that
has an `id` on `window`, so it is the server-rendered `<div>` and is set before
React runs. The hydration steps look for React's own markers instead.

### Routing (`gatsby-routing.steps.js`)

| Step | What it relies on in Gatsby |
| --- | --- |
| `I click the link "text" without a full page reload` | `<Link>` renders an `<a href>` that the router handles once the page is hydrated; a marker on `window` survives a client-side navigation and not a reload. The step waits for hydration first: a click before it is an ordinary navigation |
| `I go back without a full page reload` | the router handles `popstate` |
| `the page should( not) have a route announcer` | `#gatsby-announcer` with `aria-live` and `aria-atomic="true"` |
| `the route announcer should( not) announce "name"` | after a client-side navigation Gatsby says "Navigated to" and the first h1 of the page, else the page title |
| `the page "/path/" should( not) be prefetched` | `<link rel="prefetch" as="fetch">` for `page-data/<path>/page-data.json` of links in the viewport or hovered |
| `the scroll position should( not) be restored` | the position noted by the click step comes back after going back (gatsby-react-router-scroll, session storage) |

### Content (`gatsby-content.steps.js`)

| Step | What it relies on in Gatsby |
| --- | --- |
| `I should( not) see an optimized image` | gatsby-plugin-image's `[data-gatsby-image-wrapper]` |
| `the optimized image should( not) be loaded` | the main `img[data-main-image]` is decoded and shown (`opacity: 1`) and the placeholder has faded out; a lazy image is not loaded until it is near the viewport |
| `the optimized image should( not) offer the "webp" format` | one `<source type="image/...">` per format of the `formats` option |
| `the optimized image should( not) have a placeholder` | `[data-placeholder-image]` |
| `the page-data for "/path/" should( not) be available` | `page-data/<path>/page-data.json` is JSON, has the same path and a `componentChunkName` (the home page is `index`) |
| `the 404 page should( not) be available` | `404.html` and `page-data/404.html/page-data.json` |
| `I should( not) be on a 404 page` | the address answers 404, the Gatsby 404 page is hydrated, and it is not the development 404 page |
| `I should( not) be on the default 404 page` | the copy "404: Not Found" of gatsby-starter-default (a site with its own 404 page uses the step above) |
| `the page title should( not) be "title"` | the exact `document.title` set by the `Head` export |

The steps read the first image of the page when a page has several. They
assume the site has no `pathPrefix`.

Not covered: `gatsby-plugin-offline` (the starter does not use it) and
`gatsby develop`, which this pack deliberately refuses.

`npm run test:examples` checks that every example matches its own step (and no
webship-js core step) and that every feature step is defined exactly once; CI
runs it before the suite.

## The fixture site

By default the suite tests
[gatsby-starter-default](https://github.com/gatsbyjs/gatsby-starter-default)
at a pinned commit, built by `scripts/build-gatsby-site.sh` into `.gatsby-site`
(gitignored) with the pages of `fixture/` copied over it, and served by
`gatsby serve -p 8000`. This is exactly what CI does.

| Fixture page | Proves |
| --- | --- |
| `long-page.js` | scroll restoration, a link to a section, prefetching on hover (its links are below the fold) |
| `images.js` | a lazy optimized image with a blurred placeholder, far below the fold |
| `no-placeholder.js` | an optimized image with `placeholder="none"` and its own format only, so the placeholder and format checks are shown in their negative form |
| `static/plain.html` | a plain HTML file that the site serves as it is, so the hydration, route announcer and Head API checks are shown in their negative form |
| `hydration-mismatch.js` | a page that renders differently in the browser, so the hydration check is shown to fail |
| `using-ssr.js` | the starter's page without its call to an external service, so the suite needs no network |

`STARTER_REF=<commit, branch or tag>` builds another version of the starter.
To test your own Gatsby site, set `LAUNCH_URL` to its production build and copy
the features you need.

## Running locally

Requires Node.js 22 or later.

```bash
npm install
npx playwright install chromium
bash scripts/build-gatsby-site.sh
(cd .gatsby-site && npx gatsby serve -p 8000 &)
npm test                      # LAUNCH_URL defaults to http://localhost:8000
```

### Lanes, subsets and the settings webship-js reads

- `npx cucumber-js tests/features/homepage.feature` runs one feature and `npx cucumber-js tests/features/homepage.feature:<line>` one scenario (the line of its `Scenario:`; the paths of `cucumber.js` are left out when the command line names any, and `npm run test:paths` checks it); `FEATURES=tests/features/a.feature,tests/features/b.feature npm test` runs a subset of the feature files too; `CUCUMBER_TAGS=@critical npm test` runs a tag lane (the default run leaves `@wip` out).
- `cucumber.js` carries the `video` block (`WEBSHIP_VIDEO=on-failure` records the browser) and the `javascript` block (`WEBSHIP_JS_ERROR_MODE=fail` fails a scenario on a JavaScript error; `@js-off` silences one scenario) that webship-js reads.
- The step timeout is webship-js's own (45 seconds, set when it loads); `WEBSHIP_STEP_TIMEOUT=<milliseconds>` changes it, a `timeout` key in `cucumber.js` does not.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `2.0.x`: it
builds the fixture site, serves it with `gatsby serve`, checks the examples,
that a feature named on the command line runs alone (`npm run test:paths`) and
the step definitions (`--dry-run`), runs the suite and uploads the report.

## Layout

```
cucumber.js                  webship-js configuration
fixture/                     pages copied over gatsby-starter-default before the build
scripts/
  build-gatsby-site.sh       clone at a pinned commit, copy fixture/, build
  check-examples.js          npm run test:examples
  check-paths.js             npm run test:paths
tests/
  features/                  the scenarios
  step-definitions/          gatsby.steps.js (entry) and the step files
.github/workflows/ci.yml
```

## Publishing

Releases are published to npm as `@webship-js/gatsby-steps` from the `2.0.x` branch, following the webship-js 2.0.x line.

## License

MIT

## Logo

The Gatsby logo in this README comes from Simple Icons 16.37.0 (CC0-1.0), filled with the colour the set lists for the brand. The Gatsby name and logo are trademarks of their owner; this pack is not affiliated with or endorsed by them.
