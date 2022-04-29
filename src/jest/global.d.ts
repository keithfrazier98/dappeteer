import { Config } from '@jest/types';

import { LaunchOptions, MetamaskOptions } from '..';

export type DappateerConfig = Config.InitialOptions &
  Partial<{
    dappeteer: LaunchOptions;
    metamask: MetamaskOptions;
  }>;
