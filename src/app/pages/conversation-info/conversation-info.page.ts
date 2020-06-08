import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

import { AppConfigProvider } from '../../services/app-config';
import { DomSanitizer} from '@angular/platform-browser';

@Component({
  selector: 'app-conversation-info',
  templateUrl: './conversation-info.page.html',
  styleUrls: ['./conversation-info.page.scss'],
})
export class ConversationInfoPage implements OnInit {
  // ========= begin:: Input/Output values ============//
  @Output() eventClose = new EventEmitter();
  // @Output() eventOpenInfoAdvanced = new EventEmitter<any>();
  // @Input() tenant: string;
  @Input() attributes: any = {};
  @Input() conversationWith: string;
  // @Input() channelType: string;
  // ========= end:: Input/Output values ============//

  private DASHBOARD_URL: string;
  private projectID: string;
  public urlConversation: any;
  
  constructor(
    private appConfig: AppConfigProvider,
    private sanitizer: DomSanitizer
  ) { 
    this.DASHBOARD_URL = this.appConfig.getConfig().DASHBOARD_URL;
  }

  ngOnInit() {
    this.urlConversation = "";
    this.setUrlIframe();
  }

  setUrlIframe(){
    if (this.attributes && this.attributes.projectId){
      this.projectID = this.attributes.projectId;
    }
    if(this.projectID && this.conversationWith) {
      console.log('conversationWith::', this.conversationWith);
      console.log('projectId::', this.projectID);
      var urlConversationTEMP = this.sanitizer.bypassSecurityTrustResourceUrl(this.DASHBOARD_URL+"#/project/"+this.projectID+"/request-for-panel/"+this.conversationWith);
      this.urlConversation = urlConversationTEMP;
    } else {
      this.urlConversation = this.sanitizer.bypassSecurityTrustResourceUrl(this.DASHBOARD_URL);
    }
  }

  onCloseInfoPage() {
    this.eventClose.emit();
  }

}
