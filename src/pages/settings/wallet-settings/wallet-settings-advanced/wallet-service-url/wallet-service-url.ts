import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { Logger } from '../../../../../providers/logger/logger';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';

//native
import { SplashScreen } from '@ionic-native/splash-screen';

//providers
import { ProfileProvider } from '../../../../../providers/profile/profile';
import { ConfigProvider } from '../../../../../providers/config/config';
import { AppProvider } from '../../../../../providers/app/app';
import { PersistenceProvider } from '../../../../../providers/persistence/persistence';
import { PlatformProvider } from '../../../../../providers/platform/platform';

@Component({
  selector: 'page-wallet-service-url',
  templateUrl: 'wallet-service-url.html',
})
export class WalletServiceUrlPage {

  public success: boolean = false;
  public wallet: any;
  public appName: string;
  public walletServiceForm: FormGroup;
  private config: any;
  private defaults: any;

  constructor(
    private profileProvider: ProfileProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private configProvider: ConfigProvider,
    private app: AppProvider,
    private logger: Logger,
    private persistenceProvider: PersistenceProvider,
    private formBuilder: FormBuilder,
    private events: Events,
    private splashScreen: SplashScreen,
    private platformProvider: PlatformProvider
  ) {
    this.walletServiceForm = this.formBuilder.group({
      bwsurl: ['', Validators.compose([Validators.minLength(1), Validators.required])]
    });
  }

  ionViewDidLoad() {
    this.logger.info('ionViewDidLoad WalletServiceUrlPage');
  }

  ionViewWillEnter() {
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.defaults = this.configProvider.getDefaults();
    this.config = this.configProvider.get();
    this.appName = this.app.info.nameCase;
    this.walletServiceForm.value.bwsurl = (this.config.bwsFor && this.config.bwsFor[this.wallet.credentials.walletId]) || this.defaults.bws.url
  }

  public resetDefaultUrl(): void {
    this.walletServiceForm.value.bwsurl = this.defaults.bws.url;
  };

  public save(): void {

    let bws;
    switch (this.walletServiceForm.value.bwsurl) {
      case 'prod':
      case 'production':
        // bws = 'https://bws.bitpay.com/bws/api'
        bws= 'http://119.28.19.103:3232/bws/api'
        break;
      case 'sta':
      case 'staging':
        bws = 'https://bws-staging.b-pay.net/bws/api'
        break;
      case 'loc':
      case 'local':
        bws = 'http://localhost:3232/bws/api'
        break;
    };
    if (bws) {
      this.logger.info('Using BWS URL Alias to ' + bws);
      this.walletServiceForm.value.bwsurl = bws;
    }

    let opts = {
      bwsFor: {}
    };
    opts.bwsFor[this.wallet.credentials.walletId] = this.walletServiceForm.value.bwsurl;

    this.configProvider.set(opts);
    this.persistenceProvider.setCleanAndScanAddresses(this.wallet.credentials.walletId);
    this.events.publish('wallet:updated', this.wallet.credentials.walletId);
    this.navCtrl.popToRoot({ animate: false });
    this.navCtrl.parent.select(0);
    this.reload();
  };

  private reload(): void {
    window.location.reload();
    if (this.platformProvider.isCordova) this.splashScreen.show();
  }

}
