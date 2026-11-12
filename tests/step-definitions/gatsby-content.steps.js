'use strict';

// Step definitions for what a Gatsby build produces for a page: optimized
// images (gatsby-plugin-image), page-data files and the 404 page.
//
// What Gatsby does, and what these steps rely on:
//
//   - gatsby-plugin-image renders `<div data-gatsby-image-wrapper>` around
//     every optimized image. Inside it: a placeholder (`[data-placeholder-image]`),
//     a `<picture>` with one `<source type="image/avif|webp">` per format and
//     the main `<img data-main-image>`, which fades in (`opacity: 1`) once it
//     is loaded. A lazy image is loaded when it nears the viewport.
//   - `gatsby build` writes `public/404.html` and `page-data/404.html/page-data.json`;
//     `gatsby serve` (and a host configured for it) answers an unknown route
//     with that page and the status 404, and the runtime then renders the
//     404 component at the address that was asked for.

const { Then } = require('@cucumber/cucumber');
const {
  budget, pageDataUrl, waitForHydration, poll, actOrExplain, friendly,
} = require('./gatsby-helpers');

const IMAGE_HINT = 'Optimized images come from gatsby-plugin-image (`<StaticImage>` / `<GatsbyImage>`); the page must render one, and the plugin must be in gatsby-config. The steps look at the first image of the page.';

/**
 * Assert an optimized responsive image wrapper is (or is not) present on the
 * page (gatsby-plugin-image renders a `<div data-gatsby-image-wrapper>`
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
      hint: IMAGE_HINT,
    });
  }
});

/**
 * Assert the first optimized image of the page is (or is not) loaded: the main
 * image is decoded and shown (`opacity: 1`) and the placeholder has faded
 * out. A lazy image further down the page is not loaded until the visitor
 * scrolls to it, which the negative form proves.
 *
 * Example #1: Then the optimized image should be loaded
 * Example #2: And the optimized image should be loaded
 * Example #3: But the optimized image should not be loaded
 * Example #4: Then optimized image should be loaded
 * Example #5: And the optimized image should be loaded
 */
Then(/^(?:the )?optimized image should( not)* be loaded$/, async function (notCase) {
  const state = () => this.page.evaluate(() => {
    const wrapper = document.querySelector('[data-gatsby-image-wrapper]');
    if (!wrapper) return { present: false };
    const main = wrapper.querySelector('img[data-main-image]');
    const placeholder = wrapper.querySelector('[data-placeholder-image]');
    return {
      present: true,
      decoded: Boolean(main) && main.complete && main.naturalWidth > 0,
      shown: Boolean(main) && Number(main.style.opacity || getComputedStyle(main).opacity) === 1,
      placeholderGone: !placeholder || Number(getComputedStyle(placeholder).opacity) === 0,
    };
  });
  let seen;
  const ok = await poll(this, async () => {
    seen = await state();
    return (seen.present && seen.decoded && seen.shown && seen.placeholderGone) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: !seen.present
        ? 'The page has no optimized image.'
        : notCase
          ? 'Expected the optimized image not to be loaded yet, but it is shown.'
          : `Expected the optimized image to be loaded, but it is not (decoded: ${seen.decoded}, shown: ${seen.shown}, placeholder hidden: ${seen.placeholderGone}).`,
      hint: IMAGE_HINT,
    });
  }
});

/**
 * Assert the first optimized image of the page does (or does not) offer an
 * image format: gatsby-plugin-image lists one `<source type="image/...">` per
 * format in the `formats` option (`avif`, `webp`; `auto` is the main image).
 *
 * Example #1: Then the optimized image should offer the "avif" format
 * Example #2: And the optimized image should offer the "webp" format
 * Example #3: But the optimized image should not offer the "jpeg" format
 * Example #4: Then optimized image should offer the "webp" format
 * Example #5: And the optimized image should offer the "avif" format
 */
Then(/^(?:the )?optimized image should( not)* offer the "([^"]*)?" format$/, async function (notCase, format) {
  const mime = `image/${format.toLowerCase()}`;
  const ok = await poll(this, async () => {
    const count = await this.page.locator(`[data-gatsby-image-wrapper] source[type="${mime}"]`).count();
    return (count > 0) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? `Expected the optimized image not to offer ${mime}, but it has a source for it.`
        : `Expected the optimized image to offer ${mime}, but no <source type="${mime}"> is in its <picture>.`,
      hint: 'The formats come from the `formats` option of `<StaticImage>` / `<GatsbyImage>` (for example `formats={["auto", "webp", "avif"]}`).',
    });
  }
});

/**
 * Assert the first optimized image of the page has (or has not) a
 * placeholder: the blurred or dominant-colour image shown until the real one
 * has loaded (`placeholder="blurred"`, `"dominantColor"`; `"none"` has none).
 *
 * Example #1: Then the optimized image should have a placeholder
 * Example #2: And the optimized image should have a placeholder
 * Example #3: But the optimized image should not have a placeholder
 * Example #4: Then optimized image should have a placeholder
 * Example #5: And the optimized image should have a placeholder
 */
Then(/^(?:the )?optimized image should( not)* have a placeholder$/, async function (notCase) {
  const ok = await poll(this, async () => {
    const count = await this.page.locator('[data-gatsby-image-wrapper] [data-placeholder-image]').count();
    return (count > 0) === !notCase;
  });
  if (!ok) {
    throw friendly({
      message: notCase
        ? 'Expected an optimized image without a placeholder, but it has one.'
        : 'Expected the optimized image to have a placeholder ([data-placeholder-image]), but it has none.',
      hint: 'Set the `placeholder` option of `<StaticImage>` / `<GatsbyImage>` to "blurred" or "dominantColor".',
    });
  }
});

/**
 * Assert the page-data.json for a given path is (or is not) reachable, meaning
 * the build produced page data for that route. The home page's page-data
 * lives under the "index" segment (page-data/index/page-data.json), every
 * other path under its trimmed slug (page-data/page-2/page-data.json). The
 * file must be JSON, name the same path, and name the component of the page.
 *
 * Example #1: Then the page-data for "/" should be available
 * Example #2: Then the page-data for "/page-2/" should be available
 * Example #3: And the page-data for "/using-typescript/" should be available
 * Example #4: Then the page-data for "/no-such-page/" should not be available
 * Example #5: Then page-data for "/using-ssr/" should be available
 */
Then(/^(?:the )?page-data for "([^"]*)?" should( not)* be available$/, async function (pagePath, notCase) {
  const url = pageDataUrl(this, pagePath);
  const hint = 'page-data.json is written by the build for every page under `public/page-data/<segment>/`; rebuild the site and check the route exists in `src/pages` or is created in gatsby-node.';
  const response = await actOrExplain('fetch', url, hint, () => this.page.request.get(url, { timeout: budget(this) }));
  const type = response.headers()['content-type'] || '';
  const body = response.status() === 200 && /json/.test(type) ? await response.json().catch(() => null) : null;
  if (notCase) {
    if (body && body.path) {
      throw friendly({ message: `Expected no page-data at ${url}, but it answered 200 with the path "${body.path}".`, hint: 'The route exists in the build; use a path that is not a page.' });
    }
    return;
  }
  if (response.status() !== 200) {
    throw friendly({ message: `Expected 200 fetching ${url}, got ${response.status()}.`, hint });
  }
  if (!body || !body.path) {
    throw friendly({ message: `The page-data at ${url} is not JSON with a "path" property (content type "${type}").`, hint: `${hint} A host that answers every address with the home page returns HTML here.` });
  }
  if (!body.componentChunkName) {
    throw friendly({ message: `The page-data at ${url} names no "componentChunkName", so no page component belongs to it.`, hint });
  }
});

/**
 * Assert the 404 page is (or is not) among the pages the build produced:
 * `404.html` is served and its page-data exists.
 *
 * Example #1: Then the 404 page should be available
 * Example #2: And the 404 page should be available
 * Example #3: But the 404 page should not be available
 * Example #4: Then 404 page should be available
 * Example #5: And the 404 page should be available
 */
Then(/^(?:the )?404 page should( not)* be available$/, async function (notCase) {
  const hint = 'Create `src/pages/404.js`; the build then writes `public/404.html` and `page-data/404.html/page-data.json`.';
  const html = await actOrExplain('fetch', '/404.html', hint, () => this.page.request.get(new URL('/404.html', this.page.url()).toString(), { timeout: budget(this) }));
  const data = await actOrExplain('fetch', '/page-data/404.html/page-data.json', hint, () => this.page.request.get(new URL('/page-data/404.html/page-data.json', this.page.url()).toString(), { timeout: budget(this) }));
  const built = html.status() === 200 && data.status() === 200 && /html/.test(html.headers()['content-type'] || '') && /json/.test(data.headers()['content-type'] || '');
  if (built === Boolean(notCase)) {
    throw friendly({
      message: notCase
        ? 'Expected no 404 page, but /404.html and its page-data are served.'
        : `Expected the 404 page to be built, but /404.html answers ${html.status()} and its page-data ${data.status()}.`,
      hint,
    });
  }
});

/**
 * Assert the current page is (or is not) a 404 page of the site: the address
 * answers with the status 404 and the Gatsby 404 page is rendered and
 * hydrated at it. It fails on the development 404 page that `gatsby develop`
 * shows, which a production site never shows.
 *
 * Example #1: Then I should be on a 404 page
 * Example #2: Then we should be on a 404 page
 * Example #3: And I should not be on a 404 page
 * Example #4: Then should be on a 404 page
 * Example #5: And we should be on a 404 page
 */
Then(/^(I |we )*should( not)* be on a 404 page$/, async function (pronounCase, notCase) {
  const url = this.page.url();
  const response = await actOrExplain('fetch', url, 'The address could not be requested.', () => this.page.request.get(url, { timeout: budget(this) }));
  const status = response.status();
  const body = await this.page.locator('body').innerText().catch(() => '');
  if (/Gatsby\.js development 404 page/.test(body)) {
    throw friendly({
      message: `${url} shows the Gatsby development 404 page, not the site's 404 page.`,
      hint: 'That page belongs to `gatsby develop`. Test the production build: `gatsby build` and `gatsby serve`.',
    });
  }
  if (notCase) {
    if (status === 404) {
      throw friendly({ message: `Expected ${url} not to be a 404 page, but it answers 404.`, hint: 'Check the path of the page.' });
    }
    return;
  }
  if (status !== 404) {
    throw friendly({
      message: `Expected ${url} to answer 404, but it answers ${status}.`,
      hint: 'A production site answers an unknown route with the status 404 and `404.html`; a host that rewrites unknown routes to the home page (a single-page-app fallback) hides broken links.',
    });
  }
  const state = await waitForHydration(this);
  if (!state.hydrated) {
    throw friendly({
      message: `${url} answers 404, but the 404 page was not hydrated within ${budget(this)} ms.`,
      hint: 'Check the page scripts load on a 404 address: the runtime needs `page-data/404.html/page-data.json` and the 404 component.',
    });
  }
});

/**
 * Assert the current page is (or is not) the starter's own 404 page, by its
 * "404: Not Found" copy. It is specific to the copy of gatsby-starter-default;
 * use "I should be on a 404 page" for a site with its own 404 page.
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
      hint: 'The default 404 page is `src/pages/404.js` of gatsby-starter-default; a site with its own 404 page should use "I should be on a 404 page" instead.',
    });
  }
});

/**
 * Assert the document title does (or does not) match exactly, as set by the
 * `Head` export of the page (or react-helmet).
 *
 * Example #1: Then the page title should be "Home | Gatsby Default Starter"
 * Example #2: Then the page title should be "404: Not Found | Gatsby Default Starter"
 * Example #3: And the page title should not be "Page two"
 * Example #4: Then the page title should be "Using TypeScript | Gatsby Default Starter"
 * Example #5: Then page title should be "Page two | Gatsby Default Starter"
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
