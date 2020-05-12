import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Router, NavigationExtras } from '@angular/router';
// config
import { environment } from '../../../environments/environment';

// models
import { ConversationModel } from '../../models/conversation';
import { UserModel } from '../../models/user';

// utils
import { presentModal, closeModal, getParameterByName, convertMessage, windowsMatchMedia } from '../../services/utils/utils';
import { TYPE_POPUP_LIST_CONVERSATIONS } from '../../services/utils/constants';
import { EventsService } from '../../services/events-service';

// pages
import { LoginModal } from '../../modals/authentication/login/login.modal';

// services 
import { DatabaseProvider } from '../../services/database';
import { ChatConversationsHandler } from '../../services/chat-conversations-handler';
import { ChatManager } from '../../services/chat-manager';


@Component({
  selector: 'app-conversation-list',
  templateUrl: './conversation-list.page.html',
  styleUrls: ['./conversation-list.page.scss'],
})
export class ConversationListPage implements OnInit {
  public loggedUser: UserModel;
  public conversations: Array<ConversationModel> = [];
  public uidConvSelected: string;
  public tenant: string;
  public uidReciverFromUrl: string;
  // private conversationsHandler: ChatConversationsHandler;
  public showPlaceholder = true;
  public numberOpenConv: number = 0;

  public loadingIsActive: boolean = true;
  public supportMode = environment['supportMode'];

  public convertMessage = convertMessage;
  user = {
    name: 'Simon Grimm',
    website: 'www.ionicacademy.com',
    address: {
      zip: 48149,
      city: 'Muenster',
      country: 'DE'
    },
    interests: [
      'Ionic', 'Angular', 'YouTube', 'Sports'
    ]
  };
  constructor (
    private router: Router,
    public events: EventsService,
    public modalController: ModalController,
    public databaseProvider: DatabaseProvider,
    public chatConversationsHandler: ChatConversationsHandler,
    public chatManager: ChatManager
  ) { }

   /**
   * 1 - set interface
   * 2 - open popup login
   * 3 - subscibe login/logout
   */
  ngOnInit() {
    console.log('ngOnInit');
    this.tenant = 'tilechat';//this.chatManager.getTenant();
    this.subscriptions();
  }

  openDetailsWithState(conversationSelected) {
    let navigationExtras: NavigationExtras = {
      state: {
        conversationSelected: conversationSelected
      }
    };
    this.router.navigate(['conversation-detail/'+conversationSelected.uid], navigationExtras);
  }

  //------------------------------------------------------------------//
  // BEGIN SUBSCRIPTIONS
  //------------------------------------------------------------------//

  /** */
  subscriptions(){
    this.events.subscribe('loggedUser:login', this.subscribeLoggedUserLogin);
    this.events.subscribe('loggedUser:logout', this.subscribeLoggedUserLogout);
    this.events.subscribe('conversationsChanged', this.conversationsChanged);
  }
  // CALLBACKS //
  /** 
   * ::: subscribeLoggedUserLogin :::
   * effettuato il login: 
   * 1 - imposto loggedUser
   * 2 - dismetto modale
   * 3 - inizializzo elenco conversazioni
  */
  subscribeLoggedUserLogin = (user: any) => {
    console.log('************** subscribeLoggedUserLogin', user);
    this.loggedUser = user;
    try {
      closeModal(this.modalController);
    } catch (err) {
      console.error("-> error:", err)
    }
    this.initialize();
  }

  /** 
   * ::: subscribeLoggedUserLogout :::
   * effettuato il logout:
   * 1 - resetto array conversazioni
   * 2 - resetto conversazione selezionata
   * 3 - mostro modale login
  */
  subscribeLoggedUserLogout = () => {
    console.log('************** subscribeLoggedUserLogout');
    this.conversations = [];
    this.uidConvSelected = null;
    // presentModal(this.modalController, LoginModal, { tenant: this.tenant, enableBackdropDismiss: false });
  }

  /** 
   * ::: conversationsChanged :::
   * evento richiamato su add, change, remove dell'elenco delle conversazioni
   * 1 - aggiorno elenco conversazioni
   * 2 - aggiorno il conto delle nuove conversazioni
   * 4 - se esiste un uidReciverFromUrl (passato nell'url) 
   *    e se esiste una conversazione con lo stesso id di uidReciverFromUrl 
   *    imposto questa come conversazione attiva (operazione da fare una sola volta al caricamento delle conversazioni) 
   *    e la carico nella pagina di dettaglio e azzero la variabile uidReciverFromUrl!!! 
   * 5 - altrimenti se esiste una conversazione con lo stesso id della conversazione attiva 
   *    e la pagina di dettaglio è vuota (placeholder), carico la conversazione attiva (uidConvSelected) nella pagina di dettaglio 
   *    (operazione da fare una sola volta al caricamento delle conversazioni)
  */
  conversationsChanged = (conversations: ConversationModel[]) => {
    console.log('LISTA CONVERSAZIONI »»»»»»»»» conversationsChanged - CONVERSATIONS: ', this.conversations);
    var that = this;
    this.conversations = conversations;
    this.numberOpenConv = this.chatConversationsHandler.countIsNew();
    if (that.uidReciverFromUrl) {
      that.setUidConvSelected(that.uidReciverFromUrl);
      let position = conversations.findIndex(i => i.uid === that.uidReciverFromUrl);
      if (position > -1 ) {
        //console.log('TROVATO');
        // that.openMessageList();
        that.uidReciverFromUrl = null;
        that.showPlaceholder = false;
      } else if(that.showPlaceholder) {
        //console.log('NN LO TROVO ');
        let TEMP = getParameterByName('recipientFullname');
        if (!TEMP) {
          TEMP = that.uidReciverFromUrl;
        }
        // that.navProxy.pushDetail(DettaglioConversazionePage, {
        //   conversationWith: that.uidConvSelected,
        //   conversationWithFullname: TEMP
        // });
        that.showPlaceholder = false;
      }
    } else {      
      if (that.uidConvSelected && that.showPlaceholder === true) {
        const conversationSelected = that.conversations.find(item => item.uid === that.uidConvSelected);
        if (conversationSelected) {
          that.setUidConvSelected(that.uidConvSelected);
          // that.openMessageList();
          that.showPlaceholder = false;
        }
      }
    }
  }
  //------------------------------------------------------------------//
  // END SUBSCRIPTIONS 
  //------------------------------------------------------------------//



  //------------------------------------------------------------------//
  // BEGIN FUNCTIONS
  //------------------------------------------------------------------//
  /**
   * ::: initialize :::
   */
  initialize(){
    this.initVariables();
    this.initConversationsHandler();
    // this.initSubscriptions();
  } 

  /** 
   * ::: initVariables :::
   * al caricamento della pagina:
   * setto BUILD_VERSION prendendo il valore da PACKAGE
   * recupero conversationWith - se vengo da dettaglio conversazione o da users con conversazione attiva ???? sarà sempre undefined da spostare in ionViewDidEnter
   * recupero tenant
   * imposto recipient se esiste nei parametri passati nell'url 
   * imposto uidConvSelected recuperando id ultima conversazione aperta dallo storage 
  */
  initVariables(){
    var that = this;
    let TEMP = getParameterByName('recipient');
    if (TEMP) {
      this.uidReciverFromUrl = TEMP;
    } 
    console.log('uidReciverFromUrl:: ' + this.uidReciverFromUrl);
    console.log('loggedUser:: ' + this.loggedUser);
    console.log('tenant:: ' + this.tenant);

    this.databaseProvider.initialize(this.loggedUser, this.tenant);
    this.databaseProvider.getUidLastOpenConversation()
    .then(function (uid: string) {
      console.log('getUidLastOpenConversation:: ' + uid);
      that.setUidConvSelected(uid);
    })
    .catch((error) => {
      that.setUidConvSelected();
      console.log("error::: ", error);
    });
    console.log('::::tenant:::: ',this.tenant);
    console.log('::::uidReciverFromUrl:::: ',this.uidReciverFromUrl);
  }
  
  /**
   * ::: initConversationsHandler :::
   * inizializzo chatConversationsHandler e archviedConversationsHandler
   * recupero le conversazioni salvate nello storage e pubblico l'evento loadedConversationsStorage
   * imposto uidConvSelected in conversationHandler e chatArchivedConversationsHandler
   * e mi sottoscrivo al nodo conversazioni in conversationHandler e chatArchivedConversationsHandler (connect)
   * salvo conversationHandler in chatManager
   */
  initConversationsHandler() {
    console.log('initConversationsHandler -------------> initConversationsHandler');
    ///const tenant = this.chatManager.getTenant();
    ///const loggedUser = this.chatManager.getLoggedUser();

    // 1 - init chatConversationsHandler and  archviedConversationsHandler
    this.chatConversationsHandler = this.chatConversationsHandler.initWithTenant(this.tenant, this.loggedUser);
    // this.chatArchivedConversationsHandler = this.chatArchivedConversationsHandler.initWithTenant(this.tenant, this.loggedUser);

    // 2 - get conversations from storage
    this.chatConversationsHandler.getConversationsFromStorage();

    // 3 - set uidConvSelected in conversationHandler
    this.chatConversationsHandler.uidConvSelected = this.uidConvSelected
    // this.chatArchivedConversationsHandler.uidConvSelected = this.uidConvSelected

    // 5 - connect conversationHandler and archviedConversationsHandler to firebase event (add, change, remove)
    this.chatConversationsHandler.connect();
    // this.chatArchivedConversationsHandler.connect();

    // 6 - save conversationHandler in chatManager
    this.chatManager.setConversationsHandler(this.chatConversationsHandler);
  }

  /**
   * ::: setUidConvSelected :::
   * @param uidConvSelected 
   */
  setUidConvSelected(uidConvSelected?: string) {
    this.uidConvSelected = uidConvSelected;
    this.chatConversationsHandler.uidConvSelected = uidConvSelected;
  }

  /**
  * ::: openUsersList :::
  * apro pagina elenco users 
  * (metodo richiamato da html) 
  */
  openUsersList(event: any) {
  // this.navCtrl.push(UsersPage, {
  //   contacts: "",
  //   'tenant': this.tenant,
  //   'loggedUser': this.loggedUser
  // });
  }

  /**
   * ::: openMessageList :::
   * 1 - cerco conv con id == this.uidConvSelected e imposto select a FALSE
   * 2 - cerco conv con id == nw uidConvSelected se esiste:  
   * 2.1 - imposto status a 0 come letto
   * 2.2 - seleziono conv selected == TRUE
   * 2.3 - imposto nw uidConvSelected come this.uidConvSelected
   * 2.4 - apro conv
   * 3 salvo id conv nello storage
   * @param uidConvSelected  
   */
  openMessageList(type?: string) {
    const that = this;
    console.log('openMessageList:: >>>> conversationSelected ', that.uidConvSelected);
    
    
    setTimeout(function () {
      const conversationSelected = that.conversations.find(item => item.uid === that.uidConvSelected);
      if (conversationSelected) {
        conversationSelected.is_new = false;
        conversationSelected.status = '0';
        conversationSelected.selected = true;
        // that.navProxy.pushDetail(DettaglioConversazionePage, {
        //   conversationSelected: conversationSelected,
        //   conversationWith: that.uidConvSelected,
        //   conversationWithFullname: conversationSelected.conversation_with_fullname,
        //   channel_type: conversationSelected.channel_type
        // });
        // that.conversationsHandler.setConversationRead(conversationSelected.uid);
        that.openDetailsWithState(conversationSelected);
        that.databaseProvider.setUidLastOpenConversation(that.uidConvSelected);
      } else if (!type) {
        if (windowsMatchMedia()) {
          // that.navProxy.pushDetail(PlaceholderPage, {});
        }
      }
    }, 0);
    // if the conversation from the isConversationClosingMap is waiting to be closed 
    // deny the click on the conversation
    // if (this.tiledeskConversationProvider.getClosingConversation(this.uidConvSelected)) return;
  }

  /**
   * ::: closeConversation :::
   * chiudo conversazione
   * (metodo richiamato da html) 
   * the conversationId is:
   * - se è una conversazione diretta: elimino conversazione 
   * - se è una conversazione di gruppo: chiudo conversazione 
   * @param conversation 
   * https://github.com/chat21/chat21-cloud-functions/blob/master/docs/api.md#delete-a-conversation
   */
  closeConversation(conversation) {
    var conversationId = conversation.uid;
    // var isSupportConversation = conversationId.startsWith("support-group");
    // if (!isSupportConversation) {
    //   this.deleteConversation(conversationId, function (result, data) {
    //     if (result === 'success') {
    //       console.log("ListaConversazioniPage::closeConversation::deleteConversation::response", data);
    //     } else if (result === 'error') {
    //       console.error("ListaConversazioniPage::closeConversation::deleteConversation::error", data);
    //     }
    //   });
    // } else {
    //   this.closeSupportGroup(conversationId, function (result: string, data: any) {
    //     if (result === 'success') {
    //       console.log("ListaConversazioniPage::closeConversation::closeSupportGroup::response", data);
    //     } else if (result === 'error') {
    //       console.error("ListaConversazioniPage::closeConversation::closeSupportGroup::error", data);
    //     }
    //   });
    // }
  }

  /**
   * ::: openArchivedConversationsPage :::
   * Open the archived conversations page
   * (metodo richiamato da html) 
   */
  openArchivedConversationsPage() {
    // this.navCtrl.push(ArchivedConversationsPage, {
    //   'archivedConversations': this.archivedConversations,
    //   'tenant': this.tenant,
    //   'loggedUser': this.loggedUser
    // });
  }


}
