import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, AlertController } from 'ionic-angular';
import { BackupGamePage } from '../backup-game/backup-game';

@Component({
  selector: 'page-backup-warning',
  templateUrl: 'backup-warning.html',
})
export class BackupWarningPage {
  public currentIndex: number;
  private walletId: string;
  private fromOnboarding: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController
  ) {
    this.walletId = this.navParams.get('walletId');
    this.fromOnboarding = this.navParams.get('fromOnboarding');
  }

  openWarningModal() {

    let opts = {
      title: '截屏并不安全',
      message: '如果截屏，你的信息有可能被其它应用窥视. 记录在纸张上是更为安全的方式',
      buttons: [{
        text: '确认',
        handler: () => {
          this.navCtrl.push(BackupGamePage, {walletId: this.walletId, fromOnboarding: this.fromOnboarding});
        }
      }],
    }
    this.alertCtrl.create(opts).present();
  }

}
