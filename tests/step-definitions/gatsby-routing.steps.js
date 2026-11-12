'use strict';

// Step definitions for how a Gatsby site moves between pages: client-side
// routing through `<Link>`.
//
// What Gatsby does, and what these steps rely on (`gatsby/cache-dir`):
//
//   - `<Link>` renders a plain `<a href>`. Once React has hydrated the page,
//     a click is handled by the router: the document is not requested again.
//     Before hydration the same click is an ordinary browser navigation, so
//     the step waits for hydration first.

const { When } = require('@cucumber/cucumber');
const { budget, escapeRegExp, waitForHydration, friendly } = require('./gatsby-helpers');

/**
 * Click an internal `<Link>` by its visible text and assert the navigation
 * was a client-side transition (no full page reload). The step waits for
 * Gatsby to hydrate the page, stamps a marker on `window` and clicks. A full
 * page reload clears the marker, a client-side navigation keeps it.
 *
 * Example #1: When I click the link "Page 2" without a full page reload
 * Example #2: When we click the link "Go back to the homepage" without a full page reload
 * Example #3: And I click the link "TypeScript" without a full page reload
 * Example #4: When click the link "Continue to page two" without a full page reload
 * Example #5: When I click the link "Gatsby Default Starter" without a full page reload
 */
When(/^(I |we )*click the link "([^"]*)?" without a full page reload$/, async function (pronounCase, linkText) {
  const timeout = budget(this);
  const before = new URL(this.page.url()).pathname;
  const state = await waitForHydration(this, timeout);
  if (!state.hydrated) {
    throw friendly({
      message: `The page did not hydrate within ${timeout} ms, so "${linkText}" would be an ordinary link, not a client-side one.`,
      hint: 'Check that the page scripts load (see "I should see a hydrated page"); a click before hydration reloads the page.',
    });
  }
  const link = this.page.getByRole('link', { name: linkText, exact: true }).or(
    this.page.locator('a').filter({ hasText: new RegExp(`^${escapeRegExp(linkText)}$`) })
  ).first();
  try {
    await link.waitFor({ state: 'visible', timeout });
    await this.page.evaluate(() => { window.__gatsbyStepsMarker = true; });
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
      hint: 'Internal navigation must use the Gatsby `<Link>` component (or `navigate()`), not a plain `<a href>`, for client-side routing.',
    });
  }
});
