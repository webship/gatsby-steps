'use strict';

// Shared helpers for the Gatsby step files.
//
// Not a step file: it registers no step definitions, except the Before hook
// that records hydration errors. It holds the plumbing the step files use:
// the wait budget, the hydration check, the page-data address of a route and
// polling with a friendly error.
//
// What the steps rely on, from the Gatsby 5 runtime (`gatsby/cache-dir`):
//
//   - `#___gatsby` is the React root and `#gatsby-focus-wrapper` the first
//     element of the page. The server HTML contains both; React attaches to
//     them only after the page scripts have run, and leaves its marker
//     (`__reactContainer$...`, `__reactFiber$...`) on the DOM nodes.
//   - Every page has `page-data/<path>/page-data.json` (the home page is
//     `page-data/index/page-data.json`, the 404 page `page-data/404.html/...`)
//     and the site has `page-data/app-data.json` with the build hash, which
//     the page also carries as `window.___webpackCompilationHash`.
//
// A note on `window.___gatsby`: that is NOT a Gatsby global. Browsers expose
// every element with an `id` as a property of `window`, so it is the `<div>`
// of the server HTML and is set before React has run.

const { friendly } = require('webship-js/tests/step-definitions/webship');
const { Before } = require('@cucumber/cucumber');

/**
 * The per-assertion wait budget: `minWaitTime.page` from cucumber.js, and at
 * least 10 seconds, because hydration and prefetching happen after the load.
 *
 * @param {object} world
 * @returns {number}
 */
function budget(world) {
  return Math.max((world.minWaitTime && world.minWaitTime.page) || 0, 10000);
}

/**
 * Escape a literal string for use inside a RegExp.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The page-data segment of a route: "/" is "index", "/page-2/" is "page-2",
 * "/404.html" is "404.html".
 *
 * @param {string} pagePath
 * @returns {string}
 */
function pageDataSegment(pagePath) {
  const trimmed = String(pagePath).replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? 'index' : trimmed;
}

/**
 * The absolute address of the page-data file of a route, on the site of the
 * current page.
 *
 * @param {object} world
 * @param {string} pagePath
 * @returns {string}
 */
function pageDataUrl(world, pagePath) {
  return new URL(`/page-data/${pageDataSegment(pagePath)}/page-data.json`, world.page.url()).toString();
}

/**
 * Runs in the page. Describes how far the Gatsby runtime has got:
 * `root` (the `#___gatsby` element exists), `wrapper` (the
 * `#gatsby-focus-wrapper` element exists), `loader` (the runtime script has
 * run: `window.___loader`) and `hydrated` (React has attached to the root and
 * to the page elements).
 *
 * @returns {{root: boolean, wrapper: boolean, loader: boolean, hydrated: boolean}}
 */
function runtimeState() {
  const root = document.getElementById('___gatsby');
  const wrapper = document.getElementById('gatsby-focus-wrapper');
  const marked = (node, prefix) => Boolean(node) && Object.keys(node).some((key) => key.startsWith(prefix));
  return {
    root: Boolean(root),
    wrapper: Boolean(wrapper),
    loader: typeof window.___loader === 'object' && window.___loader !== null,
    hydrated: marked(root, '__reactContainer$') && marked(wrapper, '__reactFiber$'),
  };
}

/**
 * Wait until React has hydrated the page. Resolves with the runtime state; it
 * does not throw, so a step can word its own error from what is missing.
 *
 * @param {object} world
 * @param {number} [timeout]
 * @returns {Promise<{root: boolean, wrapper: boolean, loader: boolean, hydrated: boolean}>}
 */
async function waitForHydration(world, timeout = budget(world)) {
  try {
    await world.page.waitForFunction(`(${runtimeState.toString()})().hydrated`, undefined, { timeout });
  } catch {
    // The caller reads the state below and explains what is missing.
  }
  return world.page.evaluate(runtimeState);
}

/**
 * Poll a condition evaluated in Node until it holds or the budget is spent.
 *
 * @param {object} world
 * @param {() => Promise<boolean>} condition
 * @param {number} [timeout]
 * @returns {Promise<boolean>}
 */
async function poll(world, condition, timeout = budget(world)) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if (await condition()) return true;
    if (Date.now() >= deadline) return false;
    await world.page.waitForTimeout(100);
  }
}

/**
 * Run an action on the page and turn a Playwright error into a friendly one.
 *
 * @param {string} action
 * @param {string} target
 * @param {string} hint
 * @param {() => Promise<*>} fn
 */
async function actOrExplain(action, target, hint, fn) {
  try {
    return await fn();
  } catch (cause) {
    throw friendly({ action, target, cause, hint });
  }
}

// The messages React writes when the HTML of the server and the first render
// of the browser differ. React 18 and 19 minify them in a production build
// (errors #418, #419, #421, #422, #423, #425).
const HYDRATION_ERROR = /hydrat|did not match|does not match server-rendered|Minified React error #(?:418|419|421|422|423|425)\b/i;

// Records the hydration errors of the scenario: the listener is attached for
// every scenario, whatever the JavaScript error mode of webship-js is.
Before({ order: 210 }, function () {
  this.gatsbyHydrationErrors = [];
  if (!this.page) return;
  const record = (text) => {
    if (HYDRATION_ERROR.test(text)) this.gatsbyHydrationErrors.push(text.split('\n')[0]);
  };
  this.page.on('pageerror', (error) => record(String((error && error.message) || error)));
  this.page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') record(message.text());
  });
});

module.exports = {
  budget,
  escapeRegExp,
  pageDataSegment,
  pageDataUrl,
  runtimeState,
  waitForHydration,
  poll,
  actOrExplain,
  friendly,
};
