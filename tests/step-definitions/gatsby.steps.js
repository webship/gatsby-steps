'use strict';

// Framework-aware webship-js step definitions for this site.
//
// These steps assert on behaviour specific to how the site builds and
// hydrates a page (client-side routing, page-data.json, optimized images,
// the default 404 page) rather than generic DOM/browser behaviour, which is
// already covered by webship-js's built-in steps. The step phrases below are
// deliberately framework-agnostic (no "Gatsby" in the Gherkin text) even
// though the assertions underneath are Gatsby-specific.

const { When, Then } = require('@cucumber/cucumber');
const assert = require('assert');

/**
 * Assert the client-side runtime has mounted and hydrated the current page.
 * The framework exposes a `window.___gatsby` root container once React has
 * attached, which distinguishes a real hydrated page from a plain static
 * HTML fallback (e.g. during a failed build).
 *
 * Example #1: Then I should see a hydrated page
 * Example #2: Then we should see a hydrated page
 * Example #3: And I should see a hydrated page
 * Example #4: Then should see a hydrated page
 * Example #5: And we should see a hydrated page
 */
Then(/^(I |we )*should see a hydrated page$/, async function (pronounCase) {
  const hydrated = await this.page.evaluate(() => Boolean(window.___gatsby));
  assert.ok(hydrated, 'Expected window.___gatsby to be set, meaning the client-side runtime has not mounted on this page.');
});

/**
 * Assert an optimized responsive image wrapper is present on the page
 * (gatsby-plugin-image renders a `<div data-gatsby-image-wrapper>` around
 * every optimized image).
 *
 * Example #1: Then I should see an optimized image
 * Example #2: Then we should see an optimized image
 * Example #3: And I should see an optimized image
 * Example #4: Then should see an optimized image
 * Example #5: And we should see an optimized image
 */
Then(/^(I |we )*should see an optimized image$/, async function (pronounCase) {
  const count = await this.page.locator('[data-gatsby-image-wrapper]').count();
  assert.ok(count > 0, 'Expected at least one [data-gatsby-image-wrapper] element (optimized image) on the page.');
});

/**
 * Click an internal `<Link>` by its visible text and assert the navigation
 * was a client-side transition (no full page reload). A marker is stamped
 * on `window` before the click; a full page reload would clear it, whereas
 * client-side SPA routing preserves it.
 *
 * Example #1: When I click the link "About" without a full page reload
 * Example #2: When we click the link "Home" without a full page reload
 * Example #3: And I click the link "Page 2" without a full page reload
 * Example #4: When I click the link "Blog" without a full page reload
 * Example #5: When I click the link "Contact" without a full page reload
 */
When(/^(I |we )*click the link "([^"]*)?" without a full page reload$/, async function (pronounCase, linkText) {
  await this.page.evaluate(() => { window.__gatsbyStepsMarker = true; });
  const esc = linkText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const link = this.page.getByRole('link', { name: linkText, exact: true }).or(
    this.page.locator('a').filter({ hasText: new RegExp('^' + esc + '$') })
  ).first();
  await link.click();
  await this.page.waitForLoadState('domcontentloaded');
  const marker = await this.page.evaluate(() => window.__gatsbyStepsMarker);
  assert.ok(marker, `Clicking "${linkText}" caused a full page reload instead of a client-side navigation.`);
});

/**
 * Assert the build's page-data.json for a given path is reachable, meaning
 * the build produced page data for that route. The home page's page-data
 * lives under the "index" segment (e.g. "/" -> page-data/index/page-data.json),
 * and every other path under its trimmed slug (e.g. "/page-2/" ->
 * page-data/page-2/page-data.json).
 *
 * Example #1: Then the page-data for "/" should be available
 * Example #2: Then the page-data for "/page-2/" should be available
 * Example #3: And the page-data for "/using-typescript/" should be available
 * Example #4: Then the page-data for "/blog/" should be available
 * Example #5: Then the page-data for "/about/" should be available
 */
Then(/^the page-data for "([^"]*)?" should be available$/, async function (pagePath) {
  const trimmed = pagePath.replace(/^\/+|\/+$/g, '');
  const segment = trimmed === '' ? 'index' : trimmed;
  const url = new URL(`/page-data/${segment}/page-data.json`, this.page.url()).toString();
  const response = await this.page.request.get(url);
  assert.strictEqual(response.status(), 200, `Expected 200 fetching ${url}, got ${response.status()}.`);
  const body = await response.json();
  assert.ok(body && body.path, `page-data.json at ${url} did not contain a "path" property.`);
});

/**
 * Assert the current page is the site's built-in 404 page.
 *
 * Example #1: Then I should be on the default 404 page
 * Example #2: Then we should be on the default 404 page
 * Example #3: And I should be on the default 404 page
 * Example #4: Then should be on the default 404 page
 * Example #5: And we should be on the default 404 page
 */
Then(/^(I |we )*should be on the default 404 page$/, async function (pronounCase) {
  const text = await this.page.locator('body').innerText();
  assert.ok(
    /404[:\s]*not found/i.test(text),
    'Expected the default starter\'s 404 copy ("404: Not Found") on the current page.'
  );
});

/**
 * Assert the document title matches exactly, e.g. as set by gatsby-plugin-react-helmet / Head export.
 *
 * Example #1: Then the page title should be "Home Page"
 * Example #2: Then the page title should be "404: Not Found"
 * Example #3: And the page title should be "Page two"
 * Example #4: Then the page title should be "Using TypeScript"
 * Example #5: Then the page title should be "Using SSR"
 */
Then(/^the page title should be "([^"]*)?"$/, async function (expected) {
  const title = await this.page.title();
  assert.strictEqual(title, expected, `Expected page title "${expected}", got "${title}".`);
});
