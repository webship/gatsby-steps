'use strict';

// Step definitions for how a Gatsby site moves between pages: client-side
// routing through `<Link>`, the route announcer, prefetching and scroll
// restoration.
//
// What Gatsby does, and what these steps rely on (`gatsby/cache-dir`):
//
//   - `<Link>` renders a plain `<a href>`. Once React has hydrated the page,
//     a click is handled by the router: the document is not requested again.
//     Before hydration the same click is an ordinary browser navigation, so
//     the steps wait for hydration first.
//   - After each client-side navigation the route announcer
//     (`#gatsby-announcer`, `aria-live="assertive"`) is set to
//     "Navigated to <first h1>", or to the page title, or to "new page at
//     <path>".
//   - Links in the viewport, and links under the mouse, are prefetched: the
//     page-data file of the target is requested with
//     `<link rel="prefetch" as="fetch">`.
//   - The scroll position of a page is stored in the session storage and
//     restored when the visitor goes back.

const { When, Then } = require('@cucumber/cucumber');
const {
  budget, escapeRegExp, pageDataSegment, waitForHydration, poll, friendly,
} = require('./gatsby-helpers');

/**
 * Click an internal `<Link>` by its visible text and assert the navigation
 * was a client-side transition (no full page reload). The step waits for
 * Gatsby to hydrate the page, scrolls the link into view and notes the scroll
 * position (for "the scroll position should be restored"), stamps a marker on
 * `window` and clicks. A full page reload clears the marker, a client-side
 * navigation keeps it.
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
    await link.scrollIntoViewIfNeeded();
    const scrollY = await this.page.evaluate(() => Math.round(window.scrollY));
    this.gatsbyScroll = { path: before, y: scrollY };
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

/**
 * Go back in the browser history and assert the previous page came back
 * without a full page reload, as Gatsby's router handles it on `popstate`.
 *
 * Example #1: When I go back without a full page reload
 * Example #2: When we go back without a full page reload
 * Example #3: And I go back without a full page reload
 * Example #4: When go back without a full page reload
 * Example #5: And we go back without a full page reload
 */
When(/^(I |we )*go back without a full page reload$/, async function (pronounCase) {
  const timeout = budget(this);
  const before = new URL(this.page.url()).pathname;
  await this.page.evaluate(() => { window.__gatsbyStepsMarker = true; });
  await this.page.goBack({ timeout });
  try {
    await this.page.waitForURL((url) => url.pathname !== before, { timeout });
  } catch {
    throw friendly({
      message: `Going back did not leave "${before}" within ${timeout} ms.`,
      hint: 'There is no earlier entry in the browser history: open a page and click a link first.',
    });
  }
  const marker = await this.page.evaluate(() => window.__gatsbyStepsMarker).catch(() => false);
  if (!marker) {
    throw friendly({
      message: 'Going back reloaded the page instead of using the client-side router.',
      hint: 'Check that the previous page was reached with the Gatsby `<Link>` component and that the page scripts are loaded.',
    });
  }
});

/**
 * Assert the page has (or has not) Gatsby's route announcer: the live region
 * `#gatsby-announcer` that tells screen readers about client-side navigation.
 *
 * Example #1: Then the page should have a route announcer
 * Example #2: And the page should have a route announcer
 * Example #3: But the page should not have a route announcer
 * Example #4: Then page should have a route announcer
 * Example #5: And the page should have a route announcer
 */
Then(/^(?:the )?page should( not)* have a route announcer$/, async function (notCase) {
  const ok = await poll(this, async () => {
    const found = await this.page.evaluate(() => {
      const node = document.getElementById('gatsby-announcer');
      return Boolean(node) && Boolean(node.getAttribute('aria-live')) && node.getAttribute('aria-atomic') === 'true';
    });
    return found === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? 'Expected no route announcer, but #gatsby-announcer is on the page.'
        : 'Expected the route announcer (#gatsby-announcer with aria-live and aria-atomic="true") on the page.',
      hint: 'Gatsby adds the announcer itself; if it is missing, the page is not rendered by the Gatsby runtime, or a custom `wrapPageElement` removed it.',
    });
  }
});

/**
 * Assert the route announcer has (or has not) announced a page after a
 * client-side navigation. Gatsby announces "Navigated to <name>", where the
 * name is the text of the first h1 of the page, else the page title; give the
 * name only.
 *
 * Example #1: Then the route announcer should announce "Hi from the second page"
 * Example #2: And the route announcer should announce "Welcome to Gatsby!"
 * Example #3: Then the route announcer should not announce "Page two"
 * Example #4: Then route announcer should announce "A long page"
 * Example #5: And the route announcer should announce "404: Not Found"
 */
Then(/^(?:the )?route announcer should( not)* announce "([^"]*)?"$/, async function (notCase, name) {
  const expected = `Navigated to ${name}`;
  let actual;
  const ok = await poll(this, async () => {
    actual = await this.page.evaluate(() => {
      const node = document.getElementById('gatsby-announcer');
      return node ? node.textContent : null;
    });
    return (actual === expected) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the route announcer not to say "${expected}", but it does.`
        : `Expected the route announcer to say "${expected}", but it says ${actual === null ? 'nothing (no #gatsby-announcer on the page)' : `"${actual}"`}.`,
      hint: 'The announcer speaks only after a client-side navigation, not on the first page load; it names the first h1 of the page, else the page title. Click a link without a full page reload first.',
    });
  }
});

/**
 * Assert the page-data of a route has (or has not) been prefetched by the
 * current page. Gatsby prefetches the targets of links in the viewport and of
 * links under the mouse, a few seconds after the page loads; the step looks
 * for the `<link rel="prefetch">` tag or the request of the page-data file.
 * Without a prefetch the negative form waits 4 seconds before it passes.
 *
 * Example #1: Then the page "/page-2/" should be prefetched
 * Example #2: And the page "/using-typescript/" should be prefetched
 * Example #3: But the page "/page-2/" should not be prefetched
 * Example #4: Then page "/using-dsg/" should be prefetched
 * Example #5: And the page "/" should be prefetched
 */
Then(/^(?:the )?page "([^"]*)?" should( not)* be prefetched$/, async function (pagePath, notCase) {
  const suffix = `/page-data/${pageDataSegment(pagePath)}/page-data.json`;
  const prefetched = () => this.page.evaluate((tail) => {
    const tags = Array.from(document.querySelectorAll('link[rel="prefetch"]')).map((link) => link.href);
    const requests = performance.getEntriesByType('resource').map((entry) => entry.name);
    return tags.concat(requests).some((url) => url.split('?')[0].endsWith(tail));
  }, suffix);
  if (notCase) {
    await this.page.waitForTimeout(4000);
    if (await prefetched()) {
      throw friendly({
        message: `Expected "${pagePath}" not to be prefetched, but its page-data (${suffix}) has been requested.`,
        hint: 'Gatsby prefetches every `<Link>` that is in the viewport or hovered; scroll position and hover decide.',
      });
    }
    return;
  }
  if (!(await poll(this, prefetched))) {
    throw friendly({
      message: `Expected the page-data of "${pagePath}" (${suffix}) to be prefetched within ${budget(this)} ms, but it was not.`,
      hint: 'A `<Link>` to the page must be in the viewport or hovered, and the page must be hydrated; plain `<a href>` links are not prefetched.',
    });
  }
});

/**
 * Assert the scroll position of the page was restored after going back. The
 * position is noted by the last "click the link ... without a full page
 * reload" step, Gatsby stores it in the session storage and puts it back when
 * the visitor returns to the page.
 *
 * Example #1: Then the scroll position should be restored
 * Example #2: And the scroll position should be restored
 * Example #3: Then scroll position should be restored
 * Example #4: But the scroll position should not be restored
 * Example #5: And the scroll position should be restored
 */
Then(/^(?:the )?scroll position should( not)* be restored$/, async function (notCase) {
  if (!this.gatsbyScroll) {
    throw friendly({
      message: 'No scroll position was noted.',
      hint: 'Use it after "I click the link ... without a full page reload", which notes where the page was scrolled, and "I go back without a full page reload".',
    });
  }
  const { path, y } = this.gatsbyScroll;
  if (new URL(this.page.url()).pathname !== path) {
    throw friendly({
      message: `The page is "${new URL(this.page.url()).pathname}", not "${path}", where the scroll position was noted.`,
      hint: 'Go back to the page you clicked from first.',
    });
  }
  if (y === 0 && !notCase) {
    throw friendly({
      message: 'The page was not scrolled when the link was clicked, so there is nothing to restore.',
      hint: 'Scroll down first ("I scroll down 1500"), then click a link that is further down the page.',
    });
  }
  let current;
  const ok = await poll(this, async () => {
    current = await this.page.evaluate(() => Math.round(window.scrollY));
    return (Math.abs(current - y) <= 2) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the scroll position not to be restored, but the page is at ${current}px, where it was left.`
        : `Expected the page to be scrolled to ${y}px again, but it is at ${current}px.`,
      hint: 'Gatsby restores the position through its router, so the page must be reached with `<Link>` and the browser history; a full page reload starts at the top.',
    });
  }
});
