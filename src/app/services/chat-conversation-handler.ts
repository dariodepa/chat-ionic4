import { Injectable } from '@angular/core';
// import 'rxjs/add/operator/map';
// firebase
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import 'firebase/database';
// models
import { MessageModel } from '../models/message';
import { UserModel } from '../models/user';
// services
// import { BehaviorSubject } from '../../node_modules/rxjs/BehaviorSubject';
import { EventsService } from './events-service';
// utils
import { MSG_STATUS_RECEIVED, TYPE_GROUP } from './utils/constants';
import { htmlEntities, compareValues, nodeTypingsPath, searchIndexInArrayForUid, setHeaderDate, conversationMessagesRef } from './utils/utils';
import { TranslateService } from '@ngx-translate/core';




@Injectable({ providedIn: 'root' })
export class ChatConversationHandler {
  private urlNodeFirebase: string;
  private urlNodeTypings: string;
  private recipientId: string;
  private recipientFullname: string;
  private tenant: string;
  private loggedUser: UserModel;
  private senderId: string;
  public conversationWith: string;
  public messages: any[];
  public messagesRef: firebase.database.Query;
  public listSubsriptions: any[];
  public attributes: any;
  public CLIENT_BROWSER: string;
  // obsAdded: BehaviorSubject<MessageModel>;
  public listMembersInfo: any[];
  private setTimeoutWritingMessages;

  private lastDate: string = "";


  constructor(
    private events: EventsService,
    public translate: TranslateService
  ) {
    console.log("CONSTRUCTOR ChatConversationHandlerProvider", translate);
    this.listSubsriptions = [];
    this.CLIENT_BROWSER = navigator.userAgent;
    // this.obsAdded = new BehaviorSubject<MessageModel>(null);
  }

  /**
   * inizializzo conversation handler
   * @param recipientId 
   * @param recipientFullName 
   */
  initWithRecipient(recipientId,recipientFullName, loggedUser, tenant) {
    this.loggedUser = loggedUser;
    this.tenant = tenant;
    this.recipientId = recipientId;
    this.recipientFullname = recipientFullName;
    if(loggedUser){
      this.senderId = loggedUser.uid;
    }
    
    this.conversationWith = recipientId;
    this.messages = [];
    this.attributes = this.setAttributes();
  }

  setAttributes(): any {
    let attributes: any = JSON.parse(sessionStorage.getItem('attributes'));
    if (!attributes || attributes === 'undefined') {
        attributes = {
            client: this.CLIENT_BROWSER,
            sourcePage: location.href,
            userEmail: this.loggedUser.email,
            userFullname: this.loggedUser.fullname
        };
        console.log('>>>>>>>>>>>>>> setAttributes: ', JSON.stringify(attributes));
        sessionStorage.setItem('attributes', JSON.stringify(attributes));
    }
    return attributes;
  }

  /**
   * mi connetto al nodo messages
   * recupero gli ultimi 100 messaggi
   * creo la reference
   * mi sottoscrivo a change, removed, added
   */
  connect() {
    this.lastDate = '';
    const that = this;
    this.urlNodeFirebase = conversationMessagesRef(this.tenant, this.loggedUser.uid);
    this.urlNodeFirebase = this.urlNodeFirebase+this.conversationWith;
    console.log("urlNodeFirebase *****", this.urlNodeFirebase);
    const firebaseMessages = firebase.database().ref(this.urlNodeFirebase);
    this.messagesRef = firebaseMessages.orderByChild('timestamp').limitToLast(100);
    console.log("this.translate *****", this.translate);

    //// AGGIUNTA MESSAGGIO ////
    this.messagesRef.on("child_added", function (childSnapshot) {
      const itemMsg = childSnapshot.val();
      
      // imposto il giorno del messaggio per visualizzare o nascondere l'header data
      // console.log("that.translate *****", that.translate);
      let calcolaData = setHeaderDate(that.translate, itemMsg['timestamp'], that.lastDate);
      if (calcolaData != null) {
        that.lastDate = calcolaData;
      }
      console.log("calcolaData *****", calcolaData);
      // controllo fatto per i gruppi da rifattorizzare
      (!itemMsg.sender_fullname || itemMsg.sender_fullname == 'undefined') ? itemMsg.sender_fullname = itemMsg.sender : itemMsg.sender_fullname;
      // bonifico messaggio da url
      //let messageText = replaceBr(itemMsg['text']);
      let messageText = itemMsg['text'];
      if (itemMsg['type'] == 'text') {
        //messageText = urlify(itemMsg['text']);
        messageText = htmlEntities(itemMsg['text']);
      }

      if (itemMsg['metadata']) {
        const index = searchIndexInArrayForUid(that.messages, itemMsg['metadata'].uid);
        if (index > -1) {
          that.messages.splice(index, 1);
        }
      }

      let isSender = that.isSender(itemMsg['sender'], that.loggedUser);

      // creo oggetto messaggio e lo aggiungo all'array dei messaggi
      const msg = new MessageModel(
        childSnapshot.key, 
        itemMsg['language'], 
        itemMsg['recipient'], 
        itemMsg['recipient_fullname'], 
        itemMsg['sender'], 
        itemMsg['sender_fullname'], 
        itemMsg['status'], 
        itemMsg['metadata'], 
        messageText, 
        itemMsg['timestamp'], 
        calcolaData, 
        itemMsg['type'], 
        itemMsg['attributes'], 
        itemMsg['channel_type'], 
        isSender
      );
      if (msg.attributes && msg.attributes.subtype && (msg.attributes.subtype === 'info' || msg.attributes.subtype === 'info/support')) {
        that.translateInfoSupportMessages(msg);
      }
      console.log("child_added *****", msg);
      that.messages.push(msg);
      that.messages.sort(compareValues('timestamp', 'asc'));

      // aggiorno stato messaggio
      // questo stato indica che è stato consegnato al client e NON che è stato letto
      that.setStatusMessage(childSnapshot, that.conversationWith);

      console.log("msg.sender ***** " + msg.sender + " that.loggedUser.uid:::" + that.loggedUser.uid);
      if (isSender) {
        that.events.publish('doScroll');
      }

      //that.obsAdded.next(msg);
      that.events.publish('newMessage', msg);
      // pubblico messaggio - sottoscritto in dettaglio conversazione
    })

    //// SUBSRIBE CHANGE ////
    this.messagesRef.on("child_changed", function(childSnapshot) {
      const itemMsg = childSnapshot.val();
      // imposto il giorno del messaggio per visualizzare o nascondere l'header data
      // const calcolaData = setHeaderDate(that.translate, itemMsg['timestamp'], this.lastDate);
      // if (calcolaData != null) {
      //   this.lastDate = calcolaData;
      // }
      // controllo fatto per i gruppi da rifattorizzare
      (!itemMsg.sender_fullname || itemMsg.sender_fullname == 'undefined') ? itemMsg.sender_fullname = itemMsg.sender : itemMsg.sender_fullname;
      // bonifico messaggio da url
      //let messageText = replaceBr(itemMsg['text']);
      let messageText = itemMsg['text'];
      if (itemMsg['type'] == 'text') {
        //messageText = urlify(itemMsg['text']);
        messageText = htmlEntities(itemMsg['text']);
      }
      let isSender = that.isSender(itemMsg['sender'], that.loggedUser);
      // creo oggetto messaggio e lo aggiungo all'array dei messaggi
      const msg = new MessageModel(
        childSnapshot.key, 
        itemMsg['language'], 
        itemMsg['recipient'], 
        itemMsg['recipient_fullname'], 
        itemMsg['sender'], 
        itemMsg['sender_fullname'], 
        itemMsg['status'], 
        itemMsg['metadata'], 
        messageText, 
        itemMsg['timestamp'], 
        null, 
        itemMsg['type'], 
        itemMsg['attributes'], 
        itemMsg['channel_type'], 
        isSender
      );
      const index = searchIndexInArrayForUid(that.messages, childSnapshot.key);

      if (msg.attributes && msg.attributes.subtype && (msg.attributes.subtype === 'info' || msg.attributes.subtype === 'info/support')) {
        that.translateInfoSupportMessages(msg);
      }

     
  
      that.messages.splice(index, 1, msg);
      // aggiorno stato messaggio
      // questo stato indica che è stato consegnato al client e NON che è stato letto
      that.setStatusMessage(childSnapshot, that.conversationWith);
      
      
      // pubblico messaggio - sottoscritto in dettaglio conversazione
      //that.events.publish('listMessages:changed-'+that.conversationWith, that.conversationWith, that.messages);
      //that.events.publish('listMessages:changed-'+that.conversationWith, that.conversationWith, msg);

      if (isSender) {
        that.events.publish('doScroll');
      }
    });

    this.messagesRef.on("child_removed", function(childSnapshot) {
      // al momento non previsto!!!
      const index = searchIndexInArrayForUid(that.messages, childSnapshot.key);
      // controllo superfluo sarà sempre maggiore
      if (index > -1) {
        that.messages.splice(index, 1);
        //this.events.publish('conversations:update-'+that.conversationWith, that.messages);
      }

      // if(!this.isSender(msg)){
      //   that.events.publish('doScroll');
      // }
    });
  } 
   
  private translateInfoSupportMessages(message: MessageModel) {
    // console.log("ChatConversationHandler::translateInfoSupportMessages::message:", message);

    // check if the message has attributes, attributes.subtype and these values
    if (message.attributes && message.attributes.subtype && (message.attributes.subtype === 'info' || message.attributes.subtype === 'info/support')) {
      
      // check if the message attributes has parameters and it is of the "MEMBER_JOINED_GROUP" type
      // [BEGIN MEMBER_JOINED_GROUP]
      if ((message.attributes.messagelabel && message.attributes.messagelabel.parameters && message.attributes.messagelabel.key === 'MEMBER_JOINED_GROUP')) {
        
        var subject:string;
        var verb:string;
        var complement:string;
        if (message.attributes.messagelabel.parameters.member_id === this.loggedUser.uid) {
          this.translate.get('INFO_SUPPORT_USER_ADDED_SUBJECT').subscribe((res: string) => {      
            subject = res;
          });
          this.translate.get('INFO_SUPPORT_USER_ADDED_YOU_VERB').subscribe((res: string) => {      
            verb = res;
          });
          this.translate.get('INFO_SUPPORT_USER_ADDED_COMPLEMENT').subscribe((res: string) => {      
            complement = res;
          });
        } else {
          if (message.attributes.messagelabel.parameters.fullname) {
            // other user has been added to the group (and he has a fullname)
            subject = message.attributes.messagelabel.parameters.fullname;
            this.translate.get('INFO_SUPPORT_USER_ADDED_VERB').subscribe((res: string) => {      
              verb = res;
            });
            this.translate.get('INFO_SUPPORT_USER_ADDED_COMPLEMENT').subscribe((res: string) => {      
              complement = res;
            });
          } else {
            // other user has been added to the group (and he has not a fullname, so use hes useruid)
            subject = message.attributes.messagelabel.parameters.member_id;
            this.translate.get('INFO_SUPPORT_USER_ADDED_VERB').subscribe((res: string) => {      
              verb = res;
            });
            this.translate.get('INFO_SUPPORT_USER_ADDED_COMPLEMENT').subscribe((res: string) => {      
              complement = res;
            });
          }
        }

        // perform translation
        this.translate.get('INFO_SUPPORT_USER_ADDED_MESSAGE', {
          'subject': subject,
          'verb': verb,
          'complement': complement
        }).subscribe((res: string) => {
          message.text = res;
        });

      } // [END MEMBER_JOINED_GROUP]

      // [END CHAT_REOPENED]
      else if ((message.attributes.messagelabel && message.attributes.messagelabel.key === 'CHAT_REOPENED')) {
        this.translate.get('INFO_SUPPORT_CHAT_REOPENED').subscribe((res: string) => {      
          message.text = res;
        });
      }
      // [END CHAT_REOPENED]

      // [END CHAT_CLOSED]
      else if ((message.attributes.messagelabel && message.attributes.messagelabel.key === 'CHAT_CLOSED')) {
        this.translate.get('INFO_SUPPORT_CHAT_CLOSED').subscribe((res: string) => {      
          message.text = res;
        });
      }
      // [END CHAT_CLOSED]
    }
   

  }


  /**
   * arriorno lo stato del messaggio
   * questo stato indica che è stato consegnato al client e NON che è stato letto
   * se il messaggio NON è stato inviato da loggedUser AGGIORNO stato a 200
   * @param item 
   * @param conversationWith 
   */
  setStatusMessage(item,conversationWith){
    if(item.val()['status'] < MSG_STATUS_RECEIVED){
      //const tenant = this.chatManager.getTenant();
      //const loggedUser = this.chatManager.getLoggedUser();
      let msg = item.val();
      if (msg.sender != this.loggedUser.uid && msg.status < MSG_STATUS_RECEIVED){
        const urlNodeMessagesUpdate  = '/apps/'+this.tenant+'/users/'+this.loggedUser.uid+'/messages/'+conversationWith+"/"+item.key;
        console.log("AGGIORNO STATO MESSAGGIO", urlNodeMessagesUpdate);
        firebase.database().ref(urlNodeMessagesUpdate).update({ status: MSG_STATUS_RECEIVED });
      }
    }
  }
  /**
   * controllo se il messaggio è stato inviato da loggerUser
   * richiamato dalla pagina elenco messaggi della conversazione
   * @param sender 
   */
  isSender(sender, currentUser) {
    //const currentUser = this.loggedUser;//this.chatManager.getLoggedUser();
    console.log("isSender::::: ", sender, currentUser.uid);
    if (currentUser){
      if (sender === currentUser.uid) {
        //message.isSender = true;
        return true;
      } else {
        //message.isSender = false;
        return false;
      }
    } else {
      //message.isSender = false;
      return false;
    }
  }

  /**
   * bonifico url in testo messaggio
   * recupero time attuale
   * recupero lingua app
   * recupero sender_fullname e recipient_fullname
   * aggiungo messaggio alla reference
   * @param msg 
   * @param conversationWith 
   * @param conversationWithDetailFullname 
   */
  sendMessage(msg, type, metadata, conversationWith, conversationWithDetailFullname, channel_type) {
    const that = this;
    (!channel_type || channel_type == 'undefined')?channel_type='direct':channel_type;
    console.log('messages: ',  this.messages);
    console.log('loggedUser: ',  this.loggedUser);
    console.log("SEND MESSAGE: ", msg, channel_type);
    const now: Date = new Date();
    // const timestamp = now.valueOf();
    
    const timestamp =  firebase.database.ServerValue.TIMESTAMP;
    console.log('timestamp: ',timestamp);
    console.log('timestamp: ',firebase.database['ServerValue']['TIMESTAMP']);
    
    const language = document.documentElement.lang;
    const sender_fullname = this.loggedUser.email;
    const recipient_fullname = conversationWithDetailFullname;
    const dateSendingMessage = setHeaderDate(this.translate, timestamp);
    let firebaseMessagesCustomUid = firebase.database().ref(this.urlNodeFirebase);
    const message = new MessageModel(
      '',
      language,
      conversationWith,
      recipient_fullname,
      this.loggedUser.uid,
      sender_fullname,
      '',
      metadata,
      msg,
      timestamp,
      dateSendingMessage,
      type,
      this.attributes,
      channel_type,
      true
    ); 

    console.log('messaggio **************',message);
    //firebaseMessages.push(message);
    const messageRef = firebaseMessagesCustomUid.push();
    const key = messageRef.key;
    message.uid = key;
    console.log('messageRef: ', messageRef, key);
    messageRef.set(message, function( error ){
      // Callback comes here
      if (error) {
        // cambio lo stato in rosso: invio nn riuscito!!!
        message.status = '-100';
        console.log('ERRORE', error);
      } else {
        //that.checkWritingMessages();
        message.status = '150';
        console.log('OK MSG INVIATO CON SUCCESSO AL SERVER', message);
      }
      console.log('****** changed *****', that.messages);
    });

  }


  updateMetadataMessage(uid, metadata){
    metadata.status = true;
    const message = {
      metadata: metadata
    };
    let firebaseMessages = firebase.database().ref(this.urlNodeFirebase+uid);
    firebaseMessages.set(message);
  }


  // BEGIN TYPING FUNCTIONS
  /**
   * 
   */
  initWritingMessages() {
    this.urlNodeTypings = nodeTypingsPath(this.tenant, this.conversationWith);
    console.log('checkWritingMessages', this.urlNodeTypings);
  }

  /**
   * check if agent writing
   */
  getWritingMessages() {
    const that = this;
    const ref = firebase.database().ref(this.urlNodeTypings).orderByChild('timestamp').limitToLast(1);
    ref.on("child_changed", function(childSnapshot) {
        //that.changedTypings(childSnapshot);
        //console.log('child_changed key', childSnapshot.key);
        //console.log('child_changed val', childSnapshot.val());
        that.events.publish('isTypings', childSnapshot);
    });
  }

  /**
   * 
   */
  setWritingMessages(str, channel_type?) {
    const that = this;
    //clearTimeout(this.setTimeoutWritingMessages);
    this.setTimeoutWritingMessages = setTimeout(function () {
      let readUrlNodeTypings = nodeTypingsPath(that.tenant, that.loggedUser.uid);
      //let readUrlNodeTypings = that.urlNodeTypings;
      if (channel_type === TYPE_GROUP) {
        console.log('GRUPPO');
        readUrlNodeTypings = that.urlNodeTypings + '/' + that.loggedUser.uid;
      }
      
      console.log('setWritingMessages:', readUrlNodeTypings);
      const timestamp =  firebase.database.ServerValue.TIMESTAMP;
      const precence = {
        'timestamp': timestamp, 
        'message': str
      }
      firebase.database().ref(readUrlNodeTypings).set(precence, function( error ) {
        if (error) {
          console.log('ERRORE', error);
        } else {
          console.log('OK update typing');
        }
      });
    }, 500);
  }
  // END TYPING FUNCTIONS


  /**
   * dispose reference della conversazione
   */
  dispose() {
    this.messagesRef.off();
  }


  unsubscribe(key){
    console.log("unsubscribe: ", key);
    this.listSubsriptions.forEach(sub => {
      console.log("unsubscribe: ", sub.uid, key);
      if(sub.uid === key){
        console.log("unsubscribe: ", sub.uid, key);
        sub.unsubscribe(key, null);
        return;
      }
    });
    
  }

}