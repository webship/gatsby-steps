import type { LaunchOptions, BrowserContextOptions } from 'playwright';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

const browser = (process.env.BROWSER || 'chromium') as BrowserName;

const chromiumArgs: string[] = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--disable-web-security',
  '--ignore-certificate-errors',
  '--disable-extensions',
  '--incognito',
  '--disable-infobars',
];

interface PlaywrightConfig {
  browser: BrowserName;
  launchOptions: LaunchOptions;
  contextOptions: BrowserContextOptions;
}

const config: PlaywrightConfig = {
  browser,
  launchOptions: {
    headless: true,
    slowMo: 300,
    args: browser === 'chromium' ? chromiumArgs : [],
  },
  contextOptions: {
    viewport: { width: 1600, height: 1200 },
    ignoreHTTPSErrors: true,
    // The ddev-hosted target site is protected by nginx Basic Auth
    // (admin/admin by default). Playwright answers the auth challenge
    // automatically for both page navigations and this.page.request calls.
    // Harmless against targets with no Basic Auth (e.g. CI's `gatsby serve`).
    httpCredentials: {
      username: process.env.BASIC_AUTH_USER || 'admin',
      password: process.env.BASIC_AUTH_PASS || 'admin',
    },
  },
};

export = config;
