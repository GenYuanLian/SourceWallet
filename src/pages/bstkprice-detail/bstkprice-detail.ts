import { Component, Input } from "@angular/core";
import { BstkPriceProvider } from '../../providers/bstk-price/bstk-price';

@Component({
  selector: 'bstkprice-detail',
  templateUrl: 'bstkprice-detail.html',
})

export class BstkPriceDetailPage {
  constructor (
    private bstkPriceProvider: BstkPriceProvider
  ) {

  }

  get priceList() {
    return this.bstkPriceProvider.priceList;
  }
}