import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';
import { TranslateService } from '@ngx-translate/core';

//providers
import { ConfigProvider } from '../../providers/config/config';
import { BwcProvider } from '../../providers/bwc/bwc';

import * as _ from 'lodash';

@Injectable()
export class FeeProvider {

  private CACHE_TIME_TS: number = 60;
  // Constant fee options to translate
  public feeOpts: any = {
    urgent: this.translate.instant('Urgent'),
    priority: this.translate.instant('Priority'),
    normal: this.translate.instant('Normal'),
    economy: this.translate.instant('Economy'),
    superEconomy: this.translate.instant('Super Economy'),
    custom: this.translate.instant('Custom')
  };
  private cache: any = {
    updateTs: 0,
    coin: ''
  }

  constructor(
    private configProvider: ConfigProvider,
    private logger: Logger,
    private bwcProvider: BwcProvider,
    private translate: TranslateService
  ) {
    this.logger.info('FeeProvider initialized.');
  }

  public getCurrentFeeLevel(): string {
    return this.configProvider.get().wallet.settings.feeLevel || 'normal';
  };

  public getFeeRate(coin: string, network: string, feeLevel: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (feeLevel == 'custom') return resolve();
      network = network || 'livenet';
      this.getFeeLevels(coin).then((response: any) => {
        let feeLevelRate: any;

        if (response.fromCache) {
          feeLevelRate = _.find(response.levels[network], (o) => {
            return o.level == feeLevel;
          });
        } else {
          feeLevelRate = _.find(response.levels[network], (o) => {
            return o.level == feeLevel;
          });
        }
        if (!feeLevelRate || !feeLevelRate.feePerKb) {
          let msg = this.translate.instant('Could not get dynamic fee for level:') + ' ' + feeLevel;
          return reject(msg);
        }

        let feeRate = feeLevelRate.feePerKb;
        if (!response.fromCache) this.logger.debug('Dynamic fee: ' + feeLevel + '/' + network + ' ' + (feeLevelRate.feePerKb / 1000).toFixed() + ' SAT/B');
        return resolve(feeRate);
      }).catch((err) => {
        return reject(err);
      });
    })
  };

  public getCurrentFeeRate(coin: string, network: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getFeeRate(coin, network, this.getCurrentFeeLevel()).then((data: number) => {
        return resolve(data)
      }).catch((err: any) => {
        return reject(err);
      });
    });
  };

  public getFeeLevels(coin: string): Promise<any> {
    return new Promise((resolve, reject) => {
      coin = coin || 'btc';

      if (this.cache.coin == coin && this.cache.updateTs > Date.now() - this.CACHE_TIME_TS * 1000) {
        return resolve({ levels: this.cache.data, fromCache: true });
      }

      let walletClient = this.bwcProvider.getClient(null, {});

      walletClient.getFeeLevels(coin, 'livenet', (errLivenet, levelsLivenet) => {
        if (errLivenet) {
          return reject(this.translate.instant('Could not get dynamic fee'));
        }
        walletClient.getFeeLevels('btc', 'testnet', (errTestnet, levelsTestnet) => {
          if (errTestnet) {
            return reject(this.translate.instant('Could not get dynamic fee'));
          }
          this.cache.updateTs = Date.now();
          this.cache.coin = coin;
          this.cache.data = {
            'livenet': levelsLivenet,
            'testnet': levelsTestnet
          };
          return resolve({ levels: this.cache.data });
        });
      });
    });
  }

}
