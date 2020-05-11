import { Injectable, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

// firebase
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import 'firebase/database';
import 'firebase/auth';
import 'firebase/storage'
// models
import { UserModel } from '../models/user';
import { ConversationModel } from '../models/conversation';
// services
import { ChatManager } from './chat-manager';
import { EventsService } from './events-service';
import { DatabaseProvider } from './database';
import { AppConfigProvider } from './app-config';
import { TiledeskConversationProvider } from './tiledesk-conversation';
// utils
import { TYPE_GROUP } from './utils/constants';
import { avatarPlaceholder, getColorBck, getImageUrlThumb, imageExists } from './utils/utils';
import { compareValues, getFromNow, conversationsPathForUserId, searchIndexInArrayForUid } from './utils/utils';


@Injectable({ providedIn: 'root' })
export class ChatConversationsHandler {
    public conversations: ConversationModel[] = [];
    public uidConvSelected: String = '';
    private tenant: string;
    private loggedUser: UserModel;
    private userId: string;
    private ref: firebase.database.Query;
    public audio: any;
    private setTimeoutSound: any;

    constructor(
        private events: EventsService,
        public chatManager: ChatManager,
        public translate: TranslateService,
        private tiledeskConversationsProvider : TiledeskConversationProvider,
        // public upSvc: UploadService,
        public zone: NgZone,
        public databaseProvider: DatabaseProvider,
        public appConfig: AppConfigProvider
    ) {
        //this.FIREBASESTORAGE_BASE_URL_IMAGE = this.appConfig.getConfig().storageBucket;
    }

    /**
     * ritorno istanza di conversations handler
     */
    getInstance() {
        return this;
    }
    /**
     * inizializzo conversations handler
     * @param tenant 
     * @param user 
     */
    initWithTenant(tenant, loggedUser):ChatConversationsHandler{
        this.tenant = tenant;
        this.loggedUser = loggedUser;
        this.userId = loggedUser.uid;
        this.conversations = [];
        this.databaseProvider.initialize(this.loggedUser, this.tenant);
        return this;
    }

    /**
     * 
     */
    getConversationsFromStorage(){
        const that = this;
        this.databaseProvider.getConversations()
        .then(function (conversations) {
            that.events.publish('loadedConversationsStorage', conversations);
        })
        .catch((error) => {
            console.log("error::: getConversations:: ", error);
        });
    }

    /**
     * mi connetto al nodo conversations
     * creo la reference
     * mi sottoscrivo a change, removed, added
     */
    connect() {
        const that = this;
        const urlNodeFirebase = conversationsPathForUserId(this.tenant, this.userId);
        console.log('connect ------->', urlNodeFirebase);
        //const urlNodeFirebase = '/apps/'+tenant+'/users/'+this.loggedUser.uid+'/conversations';
        this.ref = firebase.database().ref(urlNodeFirebase).orderByChild('timestamp').limitToLast(200);
        this.ref.on("child_changed", function(childSnapshot) {
            that.changed(childSnapshot);
        });
        this.ref.on("child_removed", function(childSnapshot) {
            that.removed(childSnapshot);
        });
        this.ref.on("child_added", function(childSnapshot) {
            that.added(childSnapshot);
        })
        // SET AUDIO
        this.audio = new Audio();
        this.audio.src = 'assets/pling.mp3';
        this.audio.load(); 
    }


   
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
    /**
     * 1 - aggiungo alla pos 0 la nuova conversazione all'array di conversazioni 
     * 2 - pubblico conversations:update
     * @param childSnapshot 
     */
    added(childSnapshot){
        const childData:ConversationModel = childSnapshot.val();
        childData.uid = childSnapshot.key;
        console.log("child_added conversationS", childSnapshot.val());
        const conversation = this.completeConversation(childData);
        if (this.isValidConversation(childSnapshot.key, conversation)) {
            // add the conversation from the isConversationClosingMap
            this.tiledeskConversationsProvider.setClosingConversation(childSnapshot.key, false);
            const index = searchIndexInArrayForUid(this.conversations, conversation.uid);
            if(index > -1){
                this.conversations.splice(index, 1, conversation);
            } else {
                this.conversations.splice(0, 0, conversation);
                this.databaseProvider.setConversation(conversation);
            }
            this.conversations.sort(compareValues('timestamp', 'desc'));
            this.events.publish('conversationsChanged', this.conversations);
        } else {
            console.error("ChatConversationsHandler::added::conversations with conversationId: ", childSnapshot.key, "is not valid");
        }
        if(conversation.is_new){
            //this.soundMessage();
        }
    }

    /**
     * 1 - cerco indice conversazione nell'array conversation
     * 2 - sostituisco conversazione
     * 3 - pubblico conversations:update
     * @param childSnapshot 
     */
    changed(childSnapshot){
        const childData:ConversationModel = childSnapshot.val();
        childData.uid = childSnapshot.key;
        let conversation = this.completeConversation(childData); 
        if (this.isValidConversation(childSnapshot.key, conversation)) {
            //conversation = this.isConversationSelected(conversation, '1');
            const index = searchIndexInArrayForUid(this.conversations, conversation.uid);
            this.conversations.splice(index, 1, conversation);
            this.conversations.sort(compareValues('timestamp', 'desc'));
            this.databaseProvider.setConversation(conversation);
            this.events.publish('conversationsChanged', this.conversations);
        } else {
            console.error("ChatConversationsHandler::changed::conversations with conversationId: ", childSnapshot.key, "is not valid");
        }
        if(conversation.is_new){
            this.soundMessage();
        }
    }

    /**
     * 1 - cerco indice conversazione da eliminare
     * 2 - elimino conversazione da array conversations
     * 3 - pubblico conversations:update
     * @param childSnapshot 
     */
    removed(childSnapshot){
        console.log("ChatConversationsHandler::onSnapshotRemoved::conversation:", childSnapshot.key);
        const index = searchIndexInArrayForUid(this.conversations, childSnapshot.key);
        if(index>-1){
            this.conversations.splice(index, 1);
            this.conversations.sort(compareValues('timestamp', 'desc'));
            this.databaseProvider.removeConversation(childSnapshot.key);
            this.events.publish('conversationsChanged', this.conversations);
        }
        // remove the conversation from the isConversationClosingMap
        this.tiledeskConversationsProvider.deleteClosingConversation(childSnapshot.key);
    }

    /**
     * Completo conversazione aggiungendo:
     * 1 -  nel caso in cui sender_fullname e recipient_fullname sono vuoti, imposto i rispettivi id come fullname,
     *      in modo da avere sempre il campo fullname popolato
     * 2 -  imposto conversation_with e conversation_with_fullname con i valori del sender o al recipient,
     *      a seconda che il sender corrisponda o meno all'utente loggato. Aggiungo 'tu:' se il sender coincide con il loggedUser
     *      Se il sender NON è l'utente loggato, ma è una conversazione di tipo GROUP, il conversation_with_fullname
     *      sarà uguale al recipient_fullname
     * 3 -  imposto stato conversazione, che indica se ci sono messaggi non letti nella conversazione
     * 4 -  imposto il tempo trascorso tra l'ora attuale e l'invio dell'ultimo messaggio
     * 5 -  imposto avatar, colore e immagine
     * @param conv 
     */
    completeConversation(conv):ConversationModel{
        console.log('completeConversation',conv);
        // 1 
        if(!conv.sender_fullname || conv.sender_fullname === 'undefined' || conv.sender_fullname.trim() === ''){
            conv.sender_fullname = conv.sender;
        }
        if(!conv.recipient_fullname || conv.recipient_fullname === 'undefined' || conv.recipient_fullname.trim() === ''){
            conv.recipient_fullname = conv.recipient;
        }
        // 2 
        var LABEL_TU;
        this.translate.get('LABEL_TU').subscribe((res: string) => {      
            LABEL_TU = res;
        });
        let conversation_with_fullname = conv.sender_fullname;
        let conversation_with = conv.sender;
        conv.last_message_text = conv.last_message_text;
        if(conv.sender === this.loggedUser.uid){
            conversation_with = conv.recipient;
            conversation_with_fullname = conv.recipient_fullname;
            conv.last_message_text = LABEL_TU + conv.last_message_text;
        } 
        // non chiaro !!!!
        else if (conv.channel_type === TYPE_GROUP) {
            conversation_with = conv.recipient;
            conversation_with_fullname = conv.recipient_fullname;
            conv.last_message_text = conv.last_message_text;
        }
        conv.conversation_with_fullname = conversation_with_fullname;
        // 3
        conv.selected = false; // a cosa serve?
        console.log('conv.uid',conv.uid);
        conv.status = this.setStatusConversation(conv.sender, conv.uid);
        // 4
        conv.time_last_message = this.getTimeLastMessage(conv.timestamp);
        // 5
        conv.avatar = avatarPlaceholder(conversation_with_fullname);
        conv.color = getColorBck(conversation_with_fullname);
        try {
            let FIREBASESTORAGE_BASE_URL_IMAGE = this.appConfig.getConfig().FIREBASESTORAGE_BASE_URL_IMAGE;
            let urlImg = getImageUrlThumb(FIREBASESTORAGE_BASE_URL_IMAGE, conversation_with);
            if(imageExists(urlImg)){
                conv.image = urlImg;
            }
        } catch(err) {
            // console.log(err)
        }
        return conv;
    }


    // async getImageUrlThumb(FIREBASESTORAGE_BASE_URL_IMAGE: string, uid: string) {
    //     console.log('ok getImageUrlThumb');
    //     let imageurl = FIREBASESTORAGE_BASE_URL_IMAGE + environment['firebaseConfig'].storageBucket + '/o/profiles/' + uid + '/thumb_photo.jpg?alt=media';
    //     var url = ''
    //     //Using async/await
    //     const ref2 = firebase.storage().refFromURL(imageurl)
    //     try {
    //         const listResult2 = await ref2.getDownloadURL()
    //         url = listResult2;
    //         console.log(url)
    //         // Do whatever
    //         return console.log(url)
    //     } catch(err) {
    //     }
    //     // const listRef = firebase.storage()
    //     // .refFromURL(imageurl)
    //     // .getDownloadURL()
    //     // .then((response) => {
    //     //     // Found it. Do whatever
    //     //     console.log('ok imageurl', imageurl);
    //     //     return imageurl
    //     // })
    //     // .catch((err) => {
    //     //     console.log('ERROR imageurl', imageurl);
    //     //     return 
    //     //     // Didn't exist... or some other error
    //     // })
    // }
    
    // set the remote conversation as read
    setConversationRead(conversationUid) {
        var conversationRef = this.ref.ref.child(conversationUid);
        conversationRef.update ({"is_new" : false});
    }

    
    getConversationByUid(conversationUid) {
        const index = searchIndexInArrayForUid(this.conversations, conversationUid);
        return this.conversations[index];
    }

    setStatusConversation(sender, uid): string {
        let status = '0'; //letto
        if(sender === this.loggedUser.uid || uid === this.uidConvSelected){
            status = '0'; 
        } else {
            status = '1'; // non letto
        }
        return status;
    }

    /**
     * calcolo il tempo trascorso da ora al timestamp passato
     * @param timestamp 
     */
    getTimeLastMessage(timestamp: string) {
        let timestampNumber = parseInt(timestamp) / 1000;
        let time = getFromNow(timestampNumber);
        return time;
    }

    /**
     * dispose reference di conversations
     */
    dispose() {
        this.conversations = [];
        this.uidConvSelected = '';

        this.ref.off();
        this.ref.off("child_changed");
        this.ref.off("child_removed");
        this.ref.off("child_added");
    
        console.log("DISPOSE::: ",this.ref);
    }

    removeByUid(uid) {
        const index = searchIndexInArrayForUid(this.conversations, uid);
        if (index > -1) {
            this.conversations.splice(index, 1);
            this.events.publish('conversationsChanged', this.conversations);
        }
    }

    addConversationListener(uidUser, conversationId) {
        var that = this;
        const tenant = this.chatManager.getTenant();
        const url = '/apps/' + tenant + '/users/' + uidUser + '/conversations/' + conversationId;
        const reference = firebase.database().ref(url);
        console.log("ChatConversationsHandler::addConversationListener::reference:",url, reference.toString());
        reference.on('value', function (snapshot) {
            setTimeout(function () {
                that.events.publish(conversationId + '-listener', snapshot);
            }, 100);
        });
    }

    // check if the conversations is valid or not
    private isValidConversation(convToCheckId, convToCheck: ConversationModel) : boolean {
        //console.log("[BEGIN] ChatConversationsHandler:: convToCheck with uid: ", convToCheckId);
        if (!this.isValidField(convToCheck.uid)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'uid is not valid' ");
            return false;
        }
        if (!this.isValidField(convToCheck.is_new)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'is_new is not valid' ");
            return false;
        }

        if (!this.isValidField(convToCheck.last_message_text)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'last_message_text is not valid' ");
            return false;
        }

        if (!this.isValidField(convToCheck.recipient)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'recipient is not valid' ");
            return false;
        }

        if (!this.isValidField(convToCheck.recipient_fullname)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'recipient_fullname is not valid' ");
            return false;
        }

        if (!this.isValidField(convToCheck.sender)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'sender is not valid' ");
            return false;
        }

        if (!this.isValidField(convToCheck.sender_fullname)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'sender_fullname is not valid' ");
            return false;
        }

        if (!this.isValidField(convToCheck.status)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'status is not valid' ");
            return false;
        }

        if (!this.isValidField(convToCheck.timestamp)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'timestamp is not valid' ");
            return false;
        }

        if (!this.isValidField(convToCheck.channel_type)) {
            //console.error("ChatConversationsHandler::isValidConversation:: 'channel_type is not valid' ");
            return false;
        }

        //console.log("[END] ChatConversationsHandler:: convToCheck with uid: ", convToCheckId);

        // any other case
        return true;
    }

    // checks if a conversation's field is valid or not
    private isValidField(field) : boolean{
        return (field === null || field === undefined) ? false : true;
    }

    /**
     * 
     */
    countIsNew(){
        let num = 0;
        this.conversations.forEach(function(element) {
            if(element.is_new === true){
            num++;
            }
        });   
        return num;
    }
  
    /** */
    soundMessage(){
        console.log('****** soundMessage *****', this.audio);
        const that = this;
        // this.audio = new Audio();
        // this.audio.src = 'assets/pling.mp3';
        // this.audio.load();
        this.audio.pause();
        this.audio.currentTime = 0;

        clearTimeout(this.setTimeoutSound);
        this.setTimeoutSound = setTimeout(function () {
        //setTimeout(function() {
            that.audio.play()
            .then(function() {
                // console.log('****** then *****');
            })
            .catch(function() {
                // console.log('***//tiledesk-dashboard/chat*');
            });
        }, 1000);       
    }
      
}