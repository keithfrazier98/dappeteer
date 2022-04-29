import puppeteer from 'puppeteer';

import { launch, LaunchOptions, MetamaskOptions, setupMetamask } from '../index';

import { DappateerConfig } from './global';

export const DAPPETEER_DEFAULT_CONFIG: LaunchOptions = { metamaskVersion: process.env.DEFAULT_MM_VERSION || 'latest' };

//extra conditional logic for 'showTestNets' is to continue support for default set in index.ts
export const DEFAULT_MM_OPTIONS: MetamaskOptions = {
  seed: process.env.DEFAULT_ACCT_SEED,
  password: process.env.DEFAULT_ACCT_PASS,
  showTestNets: process.env.DEFAULT_SHOW_SEED === 'true' ? false : true, 
  hideSeed: process.env.DEFAULT_HIDE_SEED === 'false' 
};

export default async function (jestConfig: DappateerConfig = { dappeteer: DAPPETEER_DEFAULT_CONFIG }): Promise<void> {
  const browser = await launch(puppeteer, jestConfig.dappeteer || DAPPETEER_DEFAULT_CONFIG);
  try {
    await setupMetamask(browser, DEFAULT_MM_OPTIONS);
    global.browser = browser;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    throw error;
  }
  process.env.PUPPETEER_WS_ENDPOINT = browser.wsEndpoint();
}
