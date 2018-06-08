import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Logger } from '../../providers/logger/logger';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class OnGoingProcessProvider {

  private loading: any;
  private processNames: any;
  private pausedOngoingProcess: any;
  private ongoingProcess: any;

  constructor(
    private loadingCtrl: LoadingController,
    private logger: Logger,
    private translate: TranslateService
  ) {
    this.logger.info('OnGoingProcessProvider initialized.');
    // TODO GET - CLEAR - CHECK DecimalPipe for FILTER WITH TRANSLATE
    this.processNames = {
      'broadcastingTx':'Broadcasting transaction...',
      'calculatingFee':'Calculating fee...',
      'connectingCoinbase':'Connecting to Coinbase...',
      'connectingGlidera': 'Connecting to Glidera...',
      'connectingShapeshift': 'Connecting to Shapeshift...',
      'creatingTx': 'Creating transaction...',
      'creatingWallet': 'Creating Wallet...',
      'deletingWallet': 'Deleting Wallet...',
      'extractingWalletInfo': 'Extracting Wallet information...',
      'fetchingPayPro': 'Fetching payment information',
      'generatingCSV': 'Generating .csv file...',
      'gettingFeeLevels': 'Getting fee levels...',
      'importingWallet': 'Importing Wallet...',
      'joiningWallet': 'Joining Wallet...',
      'recreating': 'Recreating Wallet...',
      'rejectTx': 'Rejecting payment proposal...',
      'removeTx': 'Deleting payment proposal...', 
      'retrievingInputs': 'Retrieving inputs information...',
      'scanning': 'Scanning Wallet funds...',
      'sendingTx': 'Sending transaction...',
      'signingTx': 'Signing transaction...',
      'sweepingWallet': 'Sweeping Wallet...',
      'validatingWords': 'Validating recovery phrase...',
      'loadingTxInfo': 'Loading transaction info...',
      'sendingFeedback': 'Sending feedback...',
      'generatingNewAddress': 'Generating new address...',
      'sendingByEmail': 'Preparing addresses...',
      'sending2faCode': 'Sending 2FA code...',
      'buyingBitcoin': 'Buying Bitcoin...',
      'sellingBitcoin': 'Selling Bitcoin...',
      'fetchingBitPayAccount': 'Fetching BitPay Account...',
      'updatingGiftCards': 'Updating Gift Cards...',
      'updatingGiftCard': 'Updating Gift Card...',
      'cancelingGiftCard': 'Canceling Gift Card...',
      'creatingGiftCard': 'Creating Gift Card...',
      'buyingGiftCard': 'Buying Gift Card...',
      'topup':'Top up in progress...',
      'duplicatingWallet': 'Duplicating wallet...',
    };
    this.ongoingProcess = {};
  }

  public clear() {
    this.ongoingProcess = {};
    this.loading.dismiss();
    this.loading = null;
    this.logger.debug('ongoingProcess clear');
  }

  public pause(): void {
    this.pausedOngoingProcess = this.ongoingProcess;
    this.clear();
  }

  public resume(): void {
    this.ongoingProcess = this.pausedOngoingProcess;
    _.forEach(this.pausedOngoingProcess, (v, k) => {
      this.set(k, v);
      return;
    });
    this.pausedOngoingProcess = {};
  }

  public set(processName: string, isOn: boolean): void {
    this.logger.debug('ongoingProcess', processName, isOn);
    this.ongoingProcess[processName] = isOn;
    let showName = this.translate.instant(this.processNames[processName] || processName);
    if (!isOn) {
      delete (this.ongoingProcess[processName]);
      if (_.isEmpty(this.ongoingProcess)) {
        this.loading.dismiss();
        this.loading = null;
      }
    } else {
      if (!this.loading) {
        this.loading = this.loadingCtrl.create();
      }
      this.loading.setContent(showName);
      this.loading.present();
    }
  }
}
