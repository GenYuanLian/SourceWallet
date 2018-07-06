import { Component, Input } from "@angular/core";
import { BstkPriceProvider } from '../../providers/bstk-price/bstk-price';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';

@Component({
  selector: 'bstkprice-detail',
  templateUrl: 'bstkprice-detail.html',
})

export class BstkPriceDetailPage {
  constructor (
    private bstkPriceProvider: BstkPriceProvider,
    private externalLinkProvider: ExternalLinkProvider,
  ) {

  }

  get priceList() {
    return this.bstkPriceProvider.priceList;
  }

  public openExchangeWeb(item: any): void {
    console.log('item:', item);
    let bitzExchange = "https://www.bit-z.pro/exchange/bstk_";
    let c2cExchange = "https://coin2coin.jp/exchange/";

    let url = '';
    if (item.marketName === 'C2C') {
      url += c2cExchange + item.pairName + '_BSTK';
    } else {
      url += bitzExchange + item.pairName.toLowerCase();
    }

    let optIn = true;
    let title = null;
    let message = '是否访问交易所页面';
    let okText = '确认';
    let cancelText = '取消';
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }
}