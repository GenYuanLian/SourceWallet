import { Component, Input } from "@angular/core";
import { BstkPriceProvider } from '../../../providers/bstk-price/bstk-price';
import { BstkPriceDetailPage } from '../../../pages/bstkprice-detail/bstkprice-detail';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'bstkprice-head',
  templateUrl: 'bstkprice-head.html',
})

export class BstkPriceHeadPage {
  constructor (
    private bstkPriceProvider: BstkPriceProvider,
    private navCtrl: NavController,
    private navParams: NavParams
  ) {

  }

  get priceData() {
    return this.bstkPriceProvider.priceData;
  }

  public openBstkDetail(): void {
    this.navCtrl.push(BstkPriceDetailPage, { });
  }
}