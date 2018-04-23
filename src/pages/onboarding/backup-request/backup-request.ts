import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { Logger } from '../../../providers/logger/logger';

import { DisclaimerPage } from '../disclaimer/disclaimer';
import { BackupWarningPage } from '../../backup/backup-warning/backup-warning';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'page-backup-request',
  templateUrl: 'backup-request.html',
})
export class BackupRequestPage {
  private opts: any;
  private walletId: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private log: Logger,
    private translate: TranslateService
  ) {
    this.walletId = this.navParams.get('walletId');
    this.opts = {
      title: '',
      message: '',
      buttons: [],
    }
  }

  ionViewDidLoad() {
    this.log.info('ionViewDidLoad BackupRequestPage');
  }

  initBackupFlow() {
    this.navCtrl.push(BackupWarningPage, { walletId: this.walletId, fromOnboarding: true });
  }

  doBackupLater(confirmed: boolean) {
    this.opts.title = !confirmed ? this.translate.instant('¡Watch Out!') : this.translate.instant('Are you sure you want to skip it?');
    this.opts.message = !confirmed ? this.translate.instant('If this device is replaced or this app is deleted, neither you nor SourceWallet can recover your funds without a backup.') : this.translate.instant('You can create a backup later from your wallet settings.');
    this.opts.buttons = [{
      text: this.translate.instant('Go back'),
      role: 'destructor'
    },
    {
      text: !confirmed ? this.translate.instant('I understand') : this.translate.instant('Yes, skip'),
      handler: () => {
        if (!confirmed) {
          setTimeout(() => {
            this.doBackupLater(true);
          }, 300);
        } else {
          this.navCtrl.push(DisclaimerPage);
        }
      }
    }]
    let alert = this.alertCtrl.create(this.opts);
    alert.present();
  }

}
