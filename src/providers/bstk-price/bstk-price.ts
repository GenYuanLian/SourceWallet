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
    this.priceUrl = 'http://bstkprice.genyuanlian.com:6001/data';
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
      var result = {
        pairName: null as string,
        marketName: null as string,
        priceCny: null as string,
        pricePair: null as string,
        volumeTS: null as string,
        change: null as string,
        changeStyle: null as string
      };

      result.pairName = v.Com_id.split('_')[1];
      result.marketName = v.Market_name === "COIN2COIN" ? "C2C" : v.Market_name;
      result.priceCny = v.Price_display_cny.toFixed(4);
      result.pricePair = v.Price_display;

      var volume = Number(v.Volume_24h);
      var strVolume = '';
      if (volume > 10000) {
        strVolume = String((volume / 10000).toFixed(2)) + '万';
      } else {
        strVolume = volume.toFixed(2);
      }

      result.volumeTS = strVolume;
      result.change = Number(v.Percent_change_display).toFixed(2);
      result.changeStyle = Number(v.Percent_change_display) > 0 ? 'up' : 'down';
      return result;
    }

    let requestData = function () {
      self.http.get(self.priceUrl).subscribe((data: any) => {
        self.logger.info('Update price data success:', data);
        self.priceData = data.summaryData;
        if (Number(self.priceData.Percent_change_display) > 0) {
          self.priceData.changeStyle = "up";
        } else {
          self.priceData.changeStyle = "down";
        }

        // format data display
        self.priceData.Volume_24h = formatValue(self.priceData.Volume_24h);
        self.priceData.Price_usd = self.priceData.Price_usd.toFixed(6);
        self.priceData.Price_btc = self.priceData.Price_btc.toFixed(8);
        self.priceData.Percent_change_display = Number(self.priceData.Percent_change_display).toFixed(2);

        self.priceList = []
        for (var idx in data.listData) {
          // ignore first
          if (Number(idx) > 0) {
            self.priceList.push(formatListData(data.listData[idx]));
          }
        }

      }, (data: any) => {
        self.logger.error('Update price data: ERROR ' + data);
      });
    };

    setInterval(requestData, 60000);
    requestData();
  };
}
