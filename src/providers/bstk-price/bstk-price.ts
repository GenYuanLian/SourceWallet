import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Logger } from '../../providers/logger/logger';

@Injectable()
export class BstkPriceProvider {
  public priceData: any;
  public priceList: any;
  public test: any;
  private priceUrl: any;

  constructor(
    private logger: Logger,
    private http: HttpClient
  ) {
    this.logger.info('BstkPriceProvider initialized');
    this.priceUrl = 'http://bstkprice.genyuanlian.com:6001/';
    this.priceData = null;
    this.priceList = null;
    this.updateData();
  }

  private updateData(): void {
    let self = this;

    let formatValue = function (v) {
      return (v / 10000).toFixed(2) + '万';
    }

    let formatListData = function (v) {
      var result = {};
      result.pairName = v.Com_id.split('_')[1];
      result.marketName = v.Market_name === "COIN2COIN" ? "C2C" : v.Market_name;
      result.priceCny = v.Price_display_cny.toFixed(4);
      result.pricePair = v.Price_display;

      var volume = Number(v.Volume_24h);
      if (volume > 10000) {
        volume = (volume / 10000).toFixed(2) + '万';
      }

      result.volumeTS = volume;
      result.change = Number(v.Percent_change_display).toFixed(2);
      result.changeStyle = Number(v.Percent_change_display) > 0 ? 'up' : 'down';
      return result;
    }

    let requestData = function () {
      self.http.get(self.priceUrl + '/data').subscribe((data: any) => {
        self.logger.info('Update price data success:', data);
        self.priceData = data;
        if (Number(data.Percent_change_display) > 0) {
          data.changeStyle = "up";
        } else {
          data.changeStyle = "down";
        }

        // format data display
        data.Volume_24h = formatValue(data.Volume_24h);
        data.Price_usd = data.Price_usd.toFixed(6);
        data.Price_btc = data.Price_btc.toFixed(8);
        data.Percent_change_display = Number(data.Percent_change_display).toFixed(2);

      }, (data: any) => {
        self.logger.error('Update price data: ERROR ' + data);
      });

      self.http.get(self.priceUrl + '/list').subscribe((data: any) => {
        self.logger.info('Update price list success:', data);
        self.priceList = []
        for (var idx in data) {
          // ignore first
          if (Number(idx) > 0) {
            self.priceList.push(formatListData(data[idx]));
          }
        }
      }, (data: any) => {
        self.logger.error('Update price list: ERROR ' + data);
      });
    };

    setInterval(requestData, 60000);
    requestData();
  };
}
