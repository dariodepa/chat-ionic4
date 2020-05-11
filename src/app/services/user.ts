import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
// models
import { UserModel } from '../models/user';
// firebase
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import 'firebase/database';
import 'firebase/auth';

// utils
import { getNowTimestamp, contactsRef } from '../services/utils/utils';
import { SYSTEM, URL_NO_IMAGE, LABEL_NOICON } from '../services/utils/constants';


// services
import { ChatManager } from './chat-manager';
import { ChatPresenceHandler} from './chat-presence-handler';
import { MessagingService } from './messaging-service';
import { EventsService } from './events-service';
/**
 * DESC PROVIDER
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  public currentUserDetails: UserModel;
  public urlNodeContacts: string;
  public uidLastOpenConversation: string;
  public token: string;
  public userUid: string;


  constructor(
    public platform: Platform,
    private events: EventsService,
    public chatManager: ChatManager,
    public chatPresenceHandler: ChatPresenceHandler,
    public msgService: MessagingService
  ) {
    /**
     * 1 - controllo se l'utente è autenticato e rimango in ascolto
     * 2 - recupero tenant e impoto url contatti 
     */
    console.log('UserService constructor');
    platform.ready().then(() => {
      const tenant = this.chatManager.getTenant();
      this.urlNodeContacts = '/apps/'+tenant+'/contacts/';
    });
  }


  setCurrentUserDetail(uid, email?, firstname?, lastname?, fullname?, imageurl?){
    this.currentUserDetails = new UserModel(uid, email, firstname, lastname, fullname, imageurl);
  }
  
  /** */
  saveCurrentUserDetail(uid: string, email: string, firstname: string, lastname: string){
    let timestamp = getNowTimestamp();
    console.log("saveCurrentUserDetail: ",this.urlNodeContacts, uid, firstname, lastname);
    return firebase.database().ref(this.urlNodeContacts)
    .child(uid).set({uid:uid, email:email, firstname:firstname, lastname:lastname, timestamp:timestamp, imageurl:''})
  }

  /**
   * RECUPERO DETTAGLIO UTENTE 
   * @param uid 
   * 1 - leggo nodo contacts con uid passato
   * 2 - creo un model userDetails vouto e rimango in attesa
   * 3 - recupero il dettaglio utente se esiste
   * 4 - pubblico dettaglio utente (subscribe in profile.ts)
   */
  loadUserDetail(uid){
    console.log("loadUserDetail: ", uid);
    const userFirebase = this.initUserDetails(uid);
    return userFirebase.once('value');
  }

  getUserDetail(uid): any {
    const tenant = this.chatManager.getTenant();
    const urlNodeConcacts = contactsRef(tenant) + uid;
    var ref =  firebase.database().ref(urlNodeConcacts).once('value');
    console.log("UserService::getUserDetail::ref:", urlNodeConcacts);
    return ref;
  }

  getListMembers(members): UserModel[]{ 
    let arrayMembers = [];
    members.forEach(member => {
      console.log("loadUserDetail: ", member);
      let userDetail = new UserModel(member, '', '', member, '', URL_NO_IMAGE);
      if (member.trim() !== '' && member.trim() !== SYSTEM) {
        this.getUserDetail(member)
        .then(function(snapshot) { 
          if (snapshot.val()){
            const user = snapshot.val();
            const fullname = user.firstname+" "+user.lastname;  
            let imageUrl =  URL_NO_IMAGE;
            if(user.imageurl && user.imageurl !== LABEL_NOICON){
              imageUrl = user.imageurl;
            }
            userDetail = new UserModel(
              snapshot.key, 
              user.email, 
              user.firstname, 
              user.lastname, 
              fullname.trim(), 
              imageUrl
            );  
            console.log("userDetail: ", userDetail)
          }
          console.log("---------------> : ", member);
          arrayMembers.push(userDetail);
        })
        .catch(function(err) {
          console.log('Unable to get permission to notify.', err);
        });
      }
    });
    return arrayMembers;
  }

  /**
   * CONTROLLO SE L'UTENTE E' AUTENTICATO
   * rimango in ascolto sul login logout
   * LOGOUT:
   * 1 - cancello utente dal nodo presenze
   * 2 - rimuovo il token
   * 3 - passo lo stato offline al chatmanager
   * LOGIN:
   * 1 - imposto stato di connessione utente
   * 2 - aggiorno il token
   * 3 - carico il dettaglio utente (o ne creo uno nuovo)
   * 4 - passo lo stato online al chatmanager
   */
  onAuthStateChanged(){
    console.log("UserService::onAuthStateChanged");

    firebase.auth().onAuthStateChanged(user => {
      console.log("UserService::onAuthStateChanged::user:", user);

      if (!user) {
        console.log(" 3 - PASSO OFFLINE AL CHAT MANAGER");
        this.chatManager.goOffLine();
      }
      else{
        this.userUid = user.uid;
        console.log(" 1 - IMPOSTO STATO CONNESSO UTENTE ");
        this.chatPresenceHandler.setupMyPresence(user.uid);
        console.log(" 2 - AGGIORNO IL TOKEN ::: ", user);
        const keySubscription = 'eventGetToken';
        this.events.subscribe(keySubscription, this.callbackGetToken);
        //this.addSubscription(keySubscription);
        //this.msgService.getToken();
        
        this.msgService.getToken(); //this.getToken(); // perchè???
        console.log(" 3 - CARICO IL DETTAGLIO UTENTE ::: ");
        let that = this;
        const userFirebase = this.initUserDetails(user.uid);
        userFirebase.on('value', function(snapshot) {
          if (snapshot.val()){
            const user = snapshot.val();
            const fullname = user.firstname+" "+user.lastname;
            that.currentUserDetails = new UserModel(user.uid, user.email, user.firstname, user.lastname, fullname, user.imageurl);
          }
          else {
            that.currentUserDetails = new UserModel(user.uid, user.email, '', '', user.uid, '');
            that.saveCurrentUserDetail(user.uid, user.email, '', '');
          }
          console.log(" 4 - PASSO ONLINE AL CHAT MANAGER");
          that.chatManager.goOnLine(that.currentUserDetails);
        });
      }
    });
  }

  callbackGetToken: any = (token) => {
    console.log(" 4 - callbackGetToken");
    this.msgService.updateToken(this.userUid, token);
    this.token = token;
  }


  returnToken():string{
    return this.token;
  }

  /**
   * IMPOSTO FIREBASE REFERENCE
   * imposto la reference al nodo di firebase dettaglio utente uid
   * @param uid 
   */
  initUserDetails(uid) {
    this.userUid = uid;
    const urlNodeFirebase = this.urlNodeContacts+uid;
    return firebase.database().ref(urlNodeFirebase);
  } 

  initGroupDetails(uidUser, uidGroup) {
    const tenant = this.chatManager.getTenant();
    const urlNodeContacts = '/apps/'+tenant+'/users/'+uidUser+'/groups/'+uidGroup;
    return firebase.database().ref(urlNodeContacts);
  } 

  getUidLastOpenConversation(): string {
    return this.uidLastOpenConversation;
  }

  /**
   * LOGUOT FIREBASE
   * al logout vado in automatico su onAuthStateChanged
   */
  logoutUser() {
    console.log("UserService::logoutUser");
    console.log(" 1 - CANCELLO L'UTENTE DAL NODO PRESENZE");
    this.chatPresenceHandler.goOffline();
    console.log(" 2 - RIMUOVO IL TOKEN");
    this.msgService.removeToken();
    return firebase.auth().signOut();
  }

}