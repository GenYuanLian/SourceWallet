import { Component, Input } from "@angular/core";
import { DMProvider } from '../../../providers/dm/dm';
import { DMDetailPage } from '../../../pages/dm-detail/dm-detail';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'dm-head',
  templateUrl: 'dm-head.html',
})

export class DMHeadPage {
  constructor (
    private dmProvider: DMProvider,
    private navCtrl: NavController,
    private navParams: NavParams
  ) {

  }

  public openDMDetail(): void {
    this.navCtrl.push(DMDetailPage, { });
  }
}