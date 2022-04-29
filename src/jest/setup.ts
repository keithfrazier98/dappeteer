import puppeteer from 'puppeteer';

import { launch, LaunchOptions, MetamaskOptions, setupMetamask } from '../index';

import { DappateerConfig } from './global';

export const DAPPETEER_DEFAULT_CONFIG: LaunchOptions = { metamaskVersion: process.env.DEFAULT_MM_VERSION };

export const DEFAULT_MM_OPTIONS: MetamaskOptions = {
  seed: process.env.DEFAULT_ACCT_SEED,
  password: process.env.DEFAULT_ACCT_PASS,
  hideSeed: true,
  showTestNets: true,
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
