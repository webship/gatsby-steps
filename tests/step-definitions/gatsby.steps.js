'use strict';

// Framework-aware webship-js step definitions for this site.
//
// These steps assert on behaviour specific to how the site builds and
// hydrates a page (client-side routing, page-data.json, optimized images,
// the default 404 page) rather than generic DOM/browser behaviour, which is
// already covered by webship-js's built-in steps. The step phrases below are
// deliberately framework-agnostic (no "Gatsby" in the Gherkin text) even
// though the assertions underneath are Gatsby-specific.
//
// Every assertion waits for its condition (the assertion is the wait) for
// the `minWaitTime.page` budget, and every failure is a friendly error with
// a hint instead of a raw assertion or Playwright stack.

const { When, Then } = require('@cucumber/cucumber');
const { friendly } = require('webship-js/tests/step-definitions/webship');

/** The per-assertion wait budget: `minWaitTime.page` from cucumber.js, else 10 s. */
function budget(world) {
  return Math.max((world.minWaitTime && world.minWaitTime.page) || 0, 10000);
}

/**
 * Assert the client-side runtime has (or has not) mounted and hydrated the
 * current page. The framework exposes a `window.___gatsby` root container
 * once React has attached, which distinguishes a real hydrated page from a
 * plain static HTML fallback (e.g. during a failed build).
 *
 * Example #1: Then I should see a hydrated page
 * Example #2: Then we should see a hydrated page
 * Example #3: And I should not see a hydrated page
 * Example #4: Then should see a hydrated page
 * Example #5: And we should see a hydrated page
 */
Then(/^(I |we )*should( not)* see a hydrated page$/, async function (pronounCase, notCase) {
  const timeout = budget(this);
  try {
    await this.page.waitForFunction((want) => Boolean(window.___gatsby) === want, !notCase, { timeout });
  } catch {
    throw friendly({
      message: notCase
        ? 'Expected the client-side runtime not to mount, but window.___gatsby is set.'
        : `Expected window.___gatsby to be set within ${timeout} ms, meaning the client-side runtime has not mounted on this page.`,
      hint: 'Hydration needs the page JavaScript to load; check the browser console for a failed bundle, and that the site is served by `gatsby serve` (or a static server with the built `public/` folder).',
    });
  }
});

/**
 * Assert an optimized responsive image wrapper is (or is not) present on
 * the page (gatsby-plugin-image renders a `<div data-gatsby-image-wrapper>`
 * around every optimized image).
 *
 * Example #1: Then I should see an optimized image
 * Example #2: Then we should see an optimized image
 * Example #3: And I should not see an optimized image
 * Example #4: Then should see an optimized image
 * Example #5: And we should see an optimized image
 */
Then(/^(I |we )*should( not)* see an optimized image$/, async function (pronounCase, notCase) {
  const wrapper = this.page.locator('[data-gatsby-image-wrapper]');
  const timeout = budget(this);
  try {
    await wrapper.first().waitFor({ state: notCase ? 'detached' : 'attached', timeout });
  } catch {
    throw friendly({
      message: notCase
        ? 'Expected no optimized image, but a [data-gatsby-image-wrapper] element is on the page.'
        : `Expected at least one optimized image ([data-gatsby-image-wrapper]) within ${timeout} ms, but none appeared.`,
      hint: 'Optimized images come from gatsby-plugin-image (`<StaticImage>` / `<GatsbyImage>`); the page must render one, and the plugin must be in gatsby-config.',
    });
  }
});

/**
 * Click an internal `<Link>` by its visible text and assert the navigation
 * was a client-side transition (no full page reload). A marker is stamped
 * on `window` before the click; a full page reload would clear it, whereas
 * client-side SPA routing preserves it. The step waits for the URL path to
 * change before reading the marker.
 *
 * Example #1: When I click the link "About" without a full page reload
 * Example #2: When we click the link "Home" without a full page reload
 * Example #3: And I click the link "Page 2" without a full page reload
 * Example #4: When click the link "Blog" without a full page reload
 * Example #5: When I click the link "Contact" without a full page reload
 */
When(/^(I |we )*click the link "([^"]*)?" without a full page reload$/, async function (pronounCase, linkText) {
  const timeout = budget(this);
  const before = new URL(this.page.url()).pathname;
  await this.page.evaluate(() => { window.__gatsbyStepsMarker = true; });
  const esc = linkText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const link = this.page.getByRole('link', { name: linkText, exact: true }).or(
    this.page.locator('a').filter({ hasText: new RegExp('^' + esc + '$') })
  ).first();
  try {
    await link.waitFor({ state: 'visible', timeout });
    await link.click();
  } catch (err) {
    throw friendly({
      action: 'click the link',
      target: linkText,
      cause: err,
      hint: 'The link is matched by its exact visible text (accessible name); check the wording on the page.',
    });
  }
  try {
    await this.page.waitForURL((url) => url.pathname !== before, { timeout });
  } catch {
    throw friendly({
      message: `Clicking "${linkText}" did not change the URL path from "${before}" within ${timeout} ms.`,
      hint: 'The link must point at another route of the site; a link to the current page or an external URL cannot be checked this way.',
    });
  }
  const marker = await this.page.evaluate(() => window.__gatsbyStepsMarker).catch(() => false);
  if (!marker) {
    throw friendly({
      message: `Clicking "${linkText}" caused a full page reload instead of a client-side navigation.`,
      hint: 'Internal navigation must use the framework `<Link>` component (or `navigate()`), not a plain `<a href>`, for client-side routing.',
    });
  }
});

/**
 * Assert the build's page-data.json for a given path is (or is not)
 * reachable, meaning the build produced page data for that route. The home
 * page's page-data lives under the "index" segment (e.g. "/" ->
 * page-data/index/page-data.json), and every other path under its trimmed
 * slug (e.g. "/page-2/" -> page-data/page-2/page-data.json).
 *
 * Example #1: Then the page-data for "/" should be available
 * Example #2: Then the page-data for "/page-2/" should be available
 * Example #3: And the page-data for "/using-typescript/" should be available
 * Example #4: Then the page-data for "/no-such-page/" should not be available
 * Example #5: Then page-data for "/about/" should be available
 */
Then(/^(?:the )?page-data for "([^"]*)?" should( not)* be available$/, async function (pagePath, notCase) {
  const trimmed = pagePath.replace(/^\/+|\/+$/g, '');
  const segment = trimmed === '' ? 'index' : trimmed;
  const url = new URL(`/page-data/${segment}/page-data.json`, this.page.url()).toString();
  const hint = 'page-data.json is written by the build for every page under `public/page-data/<segment>/`; rebuild the site and check the route exists in `src/pages` or is created in gatsby-node.';
  let response;
  try {
    response = await this.page.request.get(url, { timeout: budget(this) });
  } catch (err) {
    throw friendly({ action: 'fetch', target: url, cause: err, hint });
  }
  if (notCase) {
    if (response.status() === 200) {
      throw friendly({ message: `Expected no page-data at ${url}, but it answered 200.`, hint: 'The route exists in the build; use a path that is not a page.' });
    }
    return;
  }
  if (response.status() !== 200) {
    throw friendly({ message: `Expected 200 fetching ${url}, got ${response.status()}.`, hint });
  }
  const body = await response.json().catch(() => null);
  if (!body || !body.path) {
    throw friendly({ message: `page-data.json at ${url} did not contain a "path" property.`, hint });
  }
});

/**
 * Assert the current page is (or is not) the site's built-in 404 page, by
 * its "404: Not Found" copy.
 *
 * Example #1: Then I should be on the default 404 page
 * Example #2: Then we should be on the default 404 page
 * Example #3: And I should not be on the default 404 page
 * Example #4: Then should be on the default 404 page
 * Example #5: And we should be on the default 404 page
 */
Then(/^(I |we )*should( not)* be on the default 404 page$/, async function (pronounCase, notCase) {
  const copy = this.page.locator('body').filter({ hasText: /404[:\s]*not found/i });
  const timeout = budget(this);
  try {
    await copy.waitFor({ state: notCase ? 'hidden' : 'visible', timeout });
  } catch {
    throw friendly({
      message: notCase
        ? 'Expected not to be on the default 404 page, but its "404: Not Found" copy is showing.'
        : `Expected the default starter's 404 copy ("404: Not Found") on the current page within ${timeout} ms.`,
      hint: 'The default 404 page is `src/pages/404.js`; a site with a custom 404 page needs its own copy in this step, and `gatsby serve` (not a plain static server) is needed for the 404 fallback.',
    });
  }
});

/**
 * Assert the document title does (or does not) match exactly, e.g. as set
 * by gatsby-plugin-react-helmet / Head export.
 *
 * Example #1: Then the page title should be "Home Page"
 * Example #2: Then the page title should be "404: Not Found"
 * Example #3: And the page title should not be "Page two"
 * Example #4: Then the page title should be "Using TypeScript"
 * Example #5: Then page title should be "Using SSR"
 */
Then(/^(?:the )?page title should( not)* be "([^"]*)?"$/, async function (notCase, expected) {
  try {
    await this.page.waitForFunction(({ title, want }) => (document.title === title) === want, { title: expected, want: !notCase }, { timeout: budget(this) });
  } catch {
    throw friendly({
      message: notCase
        ? `Expected the page title not to be "${expected}", but it is.`
        : `Expected page title "${expected}", got "${await this.page.title()}".`,
      hint: 'The title is set by the page `Head` export (or react-helmet) and the site title in gatsby-config; the match is exact, including any " | Site Title" suffix.',
    });
  }
});
