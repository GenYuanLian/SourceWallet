import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class DMProvider {
  public dmList: any;
  
  constructor(
    private logger: Logger,
  ) {
    this.logger.info('BstkPriceProvider initialized');
    this.dmList = [];
    this.updateData();
  }

  private updateData(): void {
    let self = this;
    self.dmList.push({
      label: '轨迹数据',
      powerValue: '16537',
      income: '134 BSTK',
      logo: 'assets/img/dm/gps.png'
    });

    self.dmList.push({
      label: '支付宝授权',
      powerValue: '77',
      income: '29 BSTK',
      logo: 'assets/img/dm/zfb.png'
    });
  };
}
