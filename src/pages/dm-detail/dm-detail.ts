import { Component, Input } from "@angular/core";
import { DMProvider } from '../../providers/dm/dm';
import { ExternalLinkProvider } from '../../providers/external-link/external-link';

@Component({
  selector: 'dm-detail',
  templateUrl: 'dm-detail.html',
})

export class DMDetailPage {
  constructor (
    private dmProvider: DMProvider,
    private externalLinkProvider: ExternalLinkProvider,
  ) {

  }

  get dmList() {
    return this.dmProvider.dmList;
  }
}