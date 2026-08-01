# gatsby-steps

A [webship-js](https://webship.co/docs/webship-js/2.0.x) test project for
[Gatsby](https://www.gatsbyjs.com/) sites, using the standard webship-js
project layout (as installed by `webship-js`'s own scaffolding) with custom
Gatsby-aware step definitions in `tests/step-definitions/gatsby.steps.js`.

By default it tests [gatsby-starter-default](https://github.com/gatsbyjs/gatsby-starter-default)
running under ddev at `http://gatsby-site.ddev.site:33000` (see
`/var/www/html/test/gatsby-site`), a production build (`gatsby build` +
`gatsby serve`) sitting behind nginx HTTP Basic Auth (`admin`/`admin` by
default — override with `BASIC_AUTH_USER`/`BASIC_AUTH_PASS`, wired up in
`playwright.config.ts`). Point `LAUNCH_URL` at any other Gatsby site to test
it instead — CI does exactly that against a locally built-and-served copy.

The target **must** be a production build (`gatsby build && gatsby serve`),
not `gatsby develop`: the dev server's live-reload WebSocket/HMR traffic
never lets the page go network-idle, which makes webship-js's smart-wait
stall for tens of seconds on every navigation.

Status: not yet published to npm (see [Publishing](#publishing)).

## Layout

This is the layout `webship-js`'s own installer generates — nothing custom,
just filled in:

```
cucumber.js                          # webship-js config (require paths, worldParameters, launchUrl)
playwright.config.ts                 # browser launch/context options
tsconfig.json
tests/
  features/                          # .feature files (this repo's Gatsby main-page scenarios)
  step-definitions/
    gatsby.steps.js                  # custom Gatsby-aware steps — no custom.js
  reports/                           # generated HTML/JSON report (gitignored)
  selectors/                         # named selector registry (empty by default)
scripts/
  build-gatsby-site.sh               # clones + builds gatsby-starter-default into .gatsby-site (gitignored)
.github/workflows/ci.yml             # build + serve + webship-js suite on every push/PR
```

## Custom steps

`tests/step-definitions/gatsby.steps.js` adds steps for things generic
webship-js steps don't know about. The step phrases are deliberately
framework-agnostic (no "Gatsby" in the Gherkin text), even though what they
check under the hood is specific to how this framework builds and hydrates a
page:

| Step | What it checks |
| --- | --- |
| `Then I should see a hydrated page` | `window.___gatsby` is set — the client-side runtime mounted/hydrated |
| `Then I should see an optimized image` | a `gatsby-plugin-image` (`[data-gatsby-image-wrapper]`) is on the page |
| `When I click the link "..." without a full page reload` | clicking navigates client-side (no full page reload) |
| `Then the page-data for "/path/" should be available` | `page-data/<segment>/page-data.json` for that route returns 200 with a `path` |
| `Then I should be on the default 404 page` | body text matches gatsby-starter-default's `404: Not Found` copy |
| `Then the page title should be "..."` | exact `document.title` match |
| `Then requesting "/path/" without credentials should return 401` | an unauthenticated fetch is rejected — verifies the ddev site's nginx Basic Auth independently of the browser context's saved credentials |

See the file for full JSDoc + Gherkin examples per step.

## Feature coverage

`tests/features/` covers gatsby-starter-default's main pages: `/`,
`/page-2/`, `/using-typescript/`, and the 404 fallback. `basic-auth.feature`
(tagged `@requires-auth`, run separately via `npm run test:auth`) covers the
ddev site's Basic Auth specifically — it doesn't apply to CI's plain
`gatsby serve` target, so it's excluded from the default `npm test` run.

`/using-ssr/` and `/using-dsg/` aren't covered yet, though `gatsby serve`
(unlike a plain static file server) does serve them correctly — that's
tracked as further test coverage, not a current limitation of the setup.

## Running locally

Requires Node.js 22+.

Against the ddev site (the default target):

```bash
npm install
npx playwright install chromium
npm test                            # LAUNCH_URL defaults to http://gatsby-site.ddev.site:33000
npm run test:auth                   # the @requires-auth Basic Auth scenarios
```

Against a locally built copy instead (what CI does):

```bash
bash scripts/build-gatsby-site.sh   # clones + builds gatsby-starter-default into .gatsby-site
npx --prefix .gatsby-site gatsby serve -p 8000 &
LAUNCH_URL=http://localhost:8000 npm test
```

To test a different Gatsby site instead, point `LAUNCH_URL` at that site's
URL when running `npm test`; if it doesn't sit behind Basic Auth,
`BASIC_AUTH_USER`/`BASIC_AUTH_PASS` are simply unused.

## Continuous integration

`.github/workflows/ci.yml` runs the same flow on every push/PR to `2.0.x`:
build gatsby-starter-default, serve it with `gatsby serve`, install
dependencies, run the webship-js suite in `tests/features/` against it, and
upload the HTML/JSON report as a workflow artifact.

## Publishing

This is structured to be published to npm at some point, but `npm publish`
has **not** been run — that's tracked separately.

## License

MIT
