import { Component } from '@angular/core';
import { NavController, NavParams, Events, ModalController } from 'ionic-angular';
import { Logger } from '../../../../providers/logger/logger';

//pages
import { SuccessModalPage } from '../../../success/success';

//providers
import { PlatformProvider } from '../../../../providers/platform/platform';
import { PopupProvider } from '../../../../providers/popup/popup';
import { OnGoingProcessProvider } from '../../../../providers/on-going-process/on-going-process';
import { GlideraProvider } from '../../../../providers/glidera/glidera';
import { ProfileProvider } from '../../../../providers/profile/profile';
import { TxFormatProvider } from '../../../../providers/tx-format/tx-format';
import { WalletProvider } from '../../../../providers/wallet/wallet';

import * as _ from 'lodash';

@Component({
  selector: 'page-buy-glidera',
  templateUrl: 'buy-glidera.html',
})
export class BuyGlideraPage {

  public isCordova: boolean;
  public token: string;
  public isFiat: boolean;
  public network: string;
  public wallet: any;
  public wallets: any;
  public amountUnitStr: string;
  public buyInfo: any;

  private currency: string;
  private amount: number;
  private coin: string;

  constructor(
    private platformProvider: PlatformProvider,
    private events: Events,
    private logger: Logger,
    private popupProvider: PopupProvider,
    private navCtrl: NavController,
    private navParams: NavParams,
    private onGoingProcessProvider: OnGoingProcessProvider,
    private glideraProvider: GlideraProvider,
    private profileProvider: ProfileProvider,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider,
    private modalCtrl: ModalController
  ) {
    this.coin = 'btc';
    this.isCordova = this.platformProvider.isCordova;
  }

  ionViewWillEnter() {
    this.isFiat = this.navParams.data.currency != 'BTC' ? true : false;
    this.amount = this.navParams.data.amount;
    this.currency = this.navParams.data.currency;

    this.network = this.glideraProvider.getNetwork();
    this.wallets = this.profileProvider.getWallets({
      onlyComplete: true,
      network: this.network,
      coin: this.coin
    });

    if (_.isEmpty(this.wallets)) {
      this.showErrorAndBack('No wallets available');
      return;
    }
    this.onWalletSelect(this.wallets[0]); // Default first wallet
  }

  private showErrorAndBack(err): void {
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err || '';
    this.popupProvider.ionicAlert('Error', err).then(() => {
      this.navCtrl.pop();
    });
  }

  private showError(err): void {
    this.logger.error(err);
    err = err.errors ? err.errors[0].message : err;
    this.popupProvider.ionicAlert('Error', err);
  }

  private processPaymentInfo(): void {
    this.onGoingProcessProvider.set('connectingGlidera', true);
    this.glideraProvider.init((err, data) => {
      if (err) {
        this.onGoingProcessProvider.set('connectingGlidera', false);
        this.showErrorAndBack(err);
        return;
      }
      this.token = data.token;
      var price: any = {};
      if (this.isFiat) {
        price.fiat = this.amount;
      } else {
        price.qty = this.amount;
      }
      this.glideraProvider.buyPrice(this.token, price, (err, buy) => {
        this.onGoingProcessProvider.set('connectingGlidera', false);
        if (err) {
          this.showErrorAndBack(err);
          return;
        }
        this.buyInfo = buy;
      });
    });
  }

  private ask2FaCode(mode, cb): Function {
    if (mode != 'NONE') {
      // SHOW PROMPT
      var title = 'Please, enter the code below';
      var message;
      if (mode == 'PIN') {
        message = 'You have enabled PIN based two-factor authentication.';
      } else if (mode == 'AUTHENTICATOR') {
        message = 'Use an authenticator app (Authy or Google Authenticator).';
      } else {
        message = 'A SMS containing a confirmation code was sent to your phone.';
      }
      this.popupProvider.ionicPrompt(title, message).then((twoFaCode) => {
        if (typeof twoFaCode == 'undefined') return cb();
        return cb(twoFaCode);
      });
    } else {
      return cb();
    }
  }

  public buyConfirm(): void {
    let message = 'Buy bitcoin for ' + this.amount + ' ' + this.currency;
    let okText = 'Confirm';
    let cancelText = 'Cancel';
    this.popupProvider.ionicConfirm(null, message, okText, cancelText).then((ok) => {
      if (!ok) return;
      this.onGoingProcessProvider.set('buyingBitcoin', true);
      this.glideraProvider.get2faCode(this.token, (err, tfa) => {
        if (err) {
          this.onGoingProcessProvider.set('buyingBitcoin', false);
          this.showError(err);
          return;
        }
        this.ask2FaCode(tfa.mode, (twoFaCode) => {
          if (tfa.mode != 'NONE' && _.isEmpty(twoFaCode)) {
            this.onGoingProcessProvider.set('buyingBitcoin', false);
            this.showError('No code entered');
            return;
          }

          this.walletProvider.getAddress(this.wallet, false).then((walletAddr) => {
            let data = {
              destinationAddress: walletAddr,
              qty: this.buyInfo.qty,
              priceUuid: this.buyInfo.priceUuid,
              useCurrentPrice: false,
              ip: null
            };
            this.glideraProvider.buy(this.token, twoFaCode, data, (err, data) => {
              this.onGoingProcessProvider.set('buyingBitcoin', false);
              if (err) return this.showError(err);
              this.logger.info(data);
              this.openSuccessModal();
            });
          }).catch(() => {
            this.onGoingProcessProvider.set('buyingBitcoin', false);
            this.showError(err);
          });
        });
      });
    });
  }

  public showWallets(): void {
    let id = this.wallet ? this.wallet.credentials.walletId : null;
    this.events.publish('showWalletsSelectorEvent', this.wallets, id, 'Receive in');
    this.events.subscribe('selectWalletEvent', (wallet: any) => {
      if (!_.isEmpty(wallet)) this.onWalletSelect(wallet);
      this.events.unsubscribe('selectWalletEvent');
    });
  }

  public onWalletSelect(wallet): void {
    this.wallet = wallet;
    let parsedAmount = this.txFormatProvider.parseAmount(
      this.coin,
      this.amount,
      this.currency);

    this.amount = parsedAmount.amount;
    this.currency = parsedAmount.currency;
    this.amountUnitStr = parsedAmount.amountUnitStr;
    this.processPaymentInfo();
  }

  public openSuccessModal(): void {
    let successText = 'Bought';
    let successComment = 'A transfer has been initiated from your bank account. Your bitcoins should arrive to your wallet in 2-4 business day';
    let modal = this.modalCtrl.create(SuccessModalPage, { successText: successText, successComment: successComment }, { showBackdrop: true, enableBackdropDismiss: false });
    modal.present();
    modal.onDidDismiss(() => {
      this.navCtrl.remove(3, 1);
      this.navCtrl.pop();
    })
  }
}
