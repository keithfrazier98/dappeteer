# dAppeteer with jest

dAppeteer is Puppeteer with Metamask. Using it with jest is pretty similar to `jest-puppeteer`.

## Use preset

You can use jest [preset](https://jestjs.io/docs/configuration#preset-string) provided by dappeteer without installing additional packages

```json
{
  "preset": "@chainsafe/dappeteer"
}
```


The preset setup script uses the following envrionment vairables contitionally:

```
DEFAULT_ACCT_SEED = "your seed"
DEFAULT_ACCT_PASS = "your password"
DEFAULT_MM_VERSION = "v10.8.1 OR your specified version OR omit to defailt to 'latest'"
DEFAULT_HIDE_SEED = 'true' OR 'false' OR omit entirely will equal false
DEFAULT_TEST_NETS = 'true' OR 'false' OR omit entirely will equal false
```
**React apps need not append 'REACT_APP_' to these environment variables**

If not supplied, dApeeteer will use a hardcoded values. Omitting the version will default to 'latest' which results in unexpected behavior as metamask updates. It is recommended to supply your seed and password so your account is immediately available after setup. 

When using the preset, dAppeteer injects `metamask`, `browser`, and `page` in the global scope of the test enviornment. You can use these variables directly after setup.

```js
describe('some test suite', () => {
  beforeAll(async () => {
    let browser = global.browser;
    let metamask = global.metamask;
    let page = global.page;
  });
});
```

Write your test
```js
describe('Google', () => {
  beforeAll(async () => {
    await page.goto('https://ethereum.org/en/');
  });

  it('should be titled "Google"', async () => {
    await expect(page.title()).resolves.toMatch('Home | ethereum.org');
  });
});
```

## Custom example without preset

In case you need more customisable use case you can rebuild it from scratch.

First lets define or entry `jest.config.js`

```js
// jest.config.js

module.exports = {
  globalSetup: './setup.js',
  globalTeardown: './teardown.js',
  testEnvironment: './environment.js',
};
```

Then create `setup.js` wit responsibility to start Puppeteer with Metamask and `teardown.js` for clean up after test's

```js
// setup.js

const { writeFile } = require('fs').promises;
const os = require('os');
const path = require('path');

const { launch, setupMetamask } = require('@chainsafe/dappeteer');
const mkdirp = require('mkdirp');
const puppeteer = require('puppeteer');

const { metamaskOptions, PUPPETEER_CONFIG } = require('./jest.config');

const DIR = path.join(os.tmpdir(), 'jest_dappeteer_global_setup');

module.exports = async function () {
  const browser = await launch(puppeteer, PUPPETEER_CONFIG);
  try {
    await setupMetamask(browser, metamaskOptions);
    global.browser = browser;
  } catch (error) {
    console.log(error);
    throw error;
  }

  mkdirp.sync(DIR);
  await writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint());
};
```

```js
// teardown.js

const os = require('os');
const path = require('path');
const rimraf = require('rimraf');

const DIR = path.join(os.tmpdir(), 'jest_dappeteer_global_setup');

module.exports = async function () {
  // close the browser instance
  await global.browser.close();

  // clean-up the wsEndpoint file
  rimraf.sync(DIR);
};
```

And for the end we need a custom Test Environment for dAppeteer to inject features into the tests

```js
// environment.js

const { readFile } = require('fs').promises;
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');
const NodeEnvironment = require('jest-environment-node');
const { getMetamaskWindow } = require('@chainsafe/dappeteer');

const DIR = path.join(os.tmpdir(), 'jest_dappeteer_global_setup');

class DappeteerEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    // get the wsEndpoint
    const wsEndpoint = await readFile(path.join(DIR, 'wsEndpoint'), 'utf8');
    if (!wsEndpoint) throw new Error('wsEndpoint not found');

    // connect to puppeteer
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
    });
    this.global.browser = browser;
    this.global.metamask = await getMetamaskWindow(browser);
  }
}

module.exports = DappeteerEnvironment;
```
