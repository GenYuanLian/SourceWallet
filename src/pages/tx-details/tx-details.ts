import { Component } from "@angular/core";
import { NavController, NavParams, Events } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import * as _ from "lodash";
import { TranslateService } from '@ngx-translate/core';

// Providers
import { AddressBookProvider } from '../../providers/address-book/address-book';
import { ConfigProvider } from '../../providers/config/config';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';
import { OnGoingProcessProvider } from "../../providers/on-going-process/on-going-process";
import { PopupProvider } from '../../providers/popup/popup';
import { ProfileProvider } from '../../providers/profile/profile';
import { TxConfirmNotificationProvider } from '../../providers/tx-confirm-notification/tx-confirm-notification';
import { TxFormatProvider } from '../../providers/tx-format/tx-format';
import { WalletProvider } from '../../providers/wallet/wallet';

@Component({
  selector: 'page-tx-details',
  templateUrl: 'tx-details.html'
})
export class TxDetailsPage {
  private txId: string;
  private config: any;
  private blockexplorerUrl: string;

  public wallet: any;
  public btx: any;
  public actionList: Array<any>;
  public isShared: boolean;
  public title: string;
  public alternativeIsoCode: string;
  public rateDate: any;
  public rate: any;
  public txNotification: any;
  public color: string;
  public copayerId: string;
  public txsUnsubscribedForNotifications: boolean;
  public toName: string;

  constructor(
    private addressBookProvider: AddressBookProvider,
    private configProvider: ConfigProvider,
    private events: Events,
    private externalLinkProvider: ExternalLinkProvider,
    private logger: Logger,
    private navCtrl: NavController,
    private navParams: NavParams,
    private onGoingProcess: OnGoingProcessProvider,
    private popupProvider: PopupProvider,
    private profileProvider: ProfileProvider,
    private txConfirmNotificationProvider: TxConfirmNotificationProvider,
    private txFormatProvider: TxFormatProvider,
    private walletProvider: WalletProvider,
    private translate: TranslateService
  ) {
    this.config = this.configProvider.get();

    this.txId = this.navParams.data.txid;
    this.title = this.translate.instant('Transaction');
    this.wallet = this.profileProvider.getWallet(this.navParams.data.walletId);
    this.color = this.wallet.color;
    this.copayerId = this.wallet.credentials.copayerId;
    this.isShared = this.wallet.credentials.n > 1;
    this.txsUnsubscribedForNotifications = this.config.confirmedTxsNotifications ? !this.config.confirmedTxsNotifications.enabled : true;

    let defaults = this.configProvider.getDefaults();
    if (this.wallet.coin == 'bch') {
      this.blockexplorerUrl = defaults.blockExplorerUrl.bch;
    } else {
      this.blockexplorerUrl = defaults.blockExplorerUrl.btc;
    }

    this.txConfirmNotificationProvider.checkIfEnabled(this.txId).then((res: any) => {
      this.txNotification = {
        value: res
      };
    });

    this.updateTx();
  }

  ionViewWillEnter() {
    this.events.subscribe('bwsEvent', (walletId: string, type: string, n: any) => {
      if (type == 'NewBlock' && n && n.data && n.data.network == 'livenet') this.updateTxDebounced({ hideLoading: true });
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe('bwsEvent');
  }

  public readMore(): void {
    let url = 'https://github.com/bitpay/copay/wiki/COPAY---FAQ#amount-too-low-to-spend';
    let optIn = true;
    let title = null;
    let message = this.translate.instant('Read more in our Wiki');
    let okText = this.translate.instant('Open');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  private updateMemo(): void {
    this.walletProvider.getTxNote(this.wallet, this.btx.txid).then((note: any) => {
      if (!note || note.body == "") return;
      this.btx.note = note;
    }).catch((err: any) => {
      this.logger.warn('Could not fetch transaction note: ' + err);
      return;
    });
  }

  private initActionList(): void {
    this.actionList = [];
    if (this.btx.action != 'sent' && this.btx.action != 'moved' || !this.isShared) return;

    let actionDescriptions = {
      created: this.translate.instant('Proposal Created'),
      accept: this.translate.instant('Accepted'),
      reject: this.translate.instant('Rejected'),
      broadcasted: this.translate.instant('Broadcasted')
    };

    this.actionList.push({
      type: 'created',
      time: this.btx.createdOn,
      description: actionDescriptions.created,
      by: this.btx.creatorName
    });

    _.each(this.btx.actions, (action: any) => {
      this.actionList.push({
        type: action.type,
        time: action.createdOn,
        description: actionDescriptions[action.type],
        by: action.copayerName
      });
    });

    this.actionList.push({
      type: 'broadcasted',
      time: this.btx.time,
      description: actionDescriptions.broadcasted,
    });

    setTimeout(() => {
      this.actionList.reverse();
    }, 10);
  }

  private updateTxDebounced = _.debounce(this.updateTx, 1000);

  private updateTx(opts?: any): void {
    opts = opts ? opts : {};
    if (!opts.hideLoading) this.onGoingProcess.set('loadingTxInfo', true);
    this.walletProvider.getTx(this.wallet, this.txId).then((tx: any) => {
      if (!opts.hideLoading) this.onGoingProcess.set('loadingTxInfo', false);

      //this.wallet.coin --> BSTK
      this.btx = this.txFormatProvider.processTx('BSTK', tx, this.walletProvider.useLegacyAddress());
      let v: string = this.txFormatProvider.formatAlternativeStr(this.wallet.coin, tx.fees);
      this.btx.feeFiatStr = v;
      this.btx.feeRateStr = (this.btx.fees / (this.btx.amount + this.btx.fees) * 100).toFixed(2) + '%';

      if (this.btx.action != 'invalid') {
        if (this.btx.action == 'sent') this.title = this.translate.instant('Sent Funds');
        if (this.btx.action == 'received') this.title = this.translate.instant('Received Funds');
        if (this.btx.action == 'moved') this.title = this.translate.instant('Moved Funds');
      }

      this.updateMemo();
      this.initActionList();
      this.getFiatRate();
      this.contact();

      this.walletProvider.getLowAmount(this.wallet).then((amount: number) => {
        this.btx.lowAmount = tx.amount < amount;
      }).catch((err: any) => {
        this.logger.warn('Error getting low amounts: ' + err);
        return;
      });
    }).catch((err: any) => {
      if (!opts.hideLoading) this.onGoingProcess.set('loadingTxInfo', false);
      this.logger.warn('Error getting transaction: ' + err);
      this.navCtrl.pop();
      return this.popupProvider.ionicAlert('Error', this.translate.instant('Transaction not available at this time'));
    });
  }

  public showCommentPopup(): void {
    let opts: any = {};
    if (this.btx.message) {
      opts.defaultText = this.btx.message;
    }
    if (this.btx.note && this.btx.note.body) opts.defaultText = this.btx.note.body;

    this.popupProvider.ionicPrompt(this.wallet.name, this.translate.instant('Memo'), opts).then((text: string) => {
      if (text == null) return;

      this.btx.note = {
        body: text
      };
      this.logger.debug('Saving memo');

      let args = {
        txid: this.btx.txid,
        body: text
      };

      this.walletProvider.editTxNote(this.wallet, args).then((res: any) => {
        this.logger.info('Tx Note edited: ', res);
      }).catch((err: any) => {
        this.logger.debug('Could not save tx comment ' + err);
      });
    });
  }

  public viewOnBlockchain(): void {
    let btx = this.btx;
    let url = 'https://' + (this.getShortNetworkName() == 'test' ? 'test-' : '') + this.blockexplorerUrl + '/tx/' + btx.txid;
    let optIn = true;
    let title = null;
    let message = this.translate.instant('View Transaction on Insight');
    let okText = this.translate.instant('Open Insight');
    let cancelText = this.translate.instant('Go Back');
    this.externalLinkProvider.open(url, optIn, title, message, okText, cancelText);
  }

  public getShortNetworkName(): string {
    let n: string = this.wallet.credentials.network;
    return n.substring(0, 4);
  }

  private getFiatRate(): void {
    this.alternativeIsoCode = this.wallet.status.alternativeIsoCode;
    this.wallet.getFiatRate({
      code: this.alternativeIsoCode,
      ts: this.btx.time * 1000
    }, (err, res) => {
      if (err) {
        this.logger.debug('Could not get historic rate');
        return;
      }
      if (res && res.rate) {
        this.rateDate = res.fetchedOn;
        this.rate = res.rate;
      }
    });
  }

  public txConfirmNotificationChange(): void {
    if (this.txNotification.value) {
      this.txConfirmNotificationProvider.subscribe(this.wallet, {
        txid: this.txId
      });
    } else {
      this.txConfirmNotificationProvider.unsubscribe(this.wallet, this.txId);
    }
  }

  private contact(): void {
    let addr = this.btx.addressTo;
    this.addressBookProvider.get(addr).then((ab: any) => {
      if (ab) {
        let name = _.isObject(ab) ? ab.name : ab;
        this.toName = name;
      } else {
        this.toName = addr;
      }
    }).catch((err: any) => {
      this.logger.warn(err);
    });
  }

}
