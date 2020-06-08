import { Injectable } from '@angular/core';
import { Config } from '@ionic/angular';
// import { Storage } from '@ionic/storage';

// firebase
import * as firebase from 'firebase/app';
import 'firebase/messaging';
import 'firebase/database';
import 'firebase/auth';

// singlenton
// 

// services
import { ChatManager } from './chat-manager';
import { ChatPresenceHandler} from './chat-presence-handler';
import { MessagingService } from './messaging-service';
import { EventsService } from './events-service';
import { UserService } from './user';
/*
  Generated class for the AuthService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable({ providedIn: 'root' })
/**
 * DESC PROVIDER
 */
export class AuthService {

  tenant: string;
  public token: any;
  public fireAuth: firebase.auth.Auth;
  public userProfile: firebase.database.Reference;
  public urlNodeFirebase: string;

  constructor(
    //private afAuth: AngularFireAuth, 
    private config: Config, 
    private events: EventsService,
    public chatManager: ChatManager,
    public chatPresenceHandler: ChatPresenceHandler,
    public msgService: MessagingService,
    // private storage: Storage,
    public userService:UserService
  ) {
    console.log('Hello AuthService Provider');
    // recupero tenant
    // console.log('ionViewDidLoad First');
    // this.userProvider.log(); // log First singleton data
    // this.userProvider.set("First singleton data")

    // let appConfig = config.get("appConfig");
    
  }
  
  //Start Firebase Auth//
  
  initialize(){
    this.tenant = 'tiledesk';
    this.fireAuth = firebase.auth();
    this.urlNodeFirebase = '/apps/'+this.tenant+'/contacts/';
    this.userProfile = firebase.database().ref(this.urlNodeFirebase);
    this.onAuthStateChanged();
  }
  // GetUser
  getUser(): firebase.User {
    return this.fireAuth.currentUser;
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
      console.log("UserService::onAuthStateChanged::user:");

      if (!user) {
        console.log(" 3 - PASSO OFFLINE AL CHAT MANAGER");
        this.chatManager.goOffLine();
      }
      else{
        console.log(" 1 - IMPOSTO STATO CONNESSO UTENTE ");
        this.chatPresenceHandler.setupMyPresence(user.uid);
        
        console.log(" 2 - AGGIORNO IL TOKEN ::: ");
        this.updateTokenOnAuthStateIsLogin(user);
        
        console.log(" 3 - CARICO IL DETTAGLIO UTENTE ::: ");
        this.updateUserDetail(user);
        
        console.log(" 4 - PASSO ONLINE AL CHAT MANAGER");
        this.chatManager.goOnLine(user);
      }
    });
  }



  /** */
  updateTokenOnAuthStateIsLogin(userUid){
    console.log(" 2 - AGGIORNO IL TOKEN ::: ");
    const keySubscription = 'eventGetToken';
    this.events.subscribe(keySubscription,  (token) => {
      console.log(" 4 - callbackGetToken");
      this.msgService.updateToken(userUid, token);
      this.token = token;
    });
    this.msgService.getToken();
  }

  /** */
  updateUserDetail(user){
    let that = this;
    const userFirebase = this.userService.initUserDetails(user.uid);
    userFirebase.on('value', function(snapshot) {
      if (snapshot.val()){
        const user = snapshot.val();
        const fullname = user.firstname+" "+user.lastname;
        that.userService.setCurrentUserDetail(user.uid, user.email, user.firstname, user.lastname, fullname, user.imageurl);
        //currentUserDetails = new UserModel(user.uid, user.email, user.firstname, user.lastname, fullname, user.imageurl);
      }
      else {
        that.userService.setCurrentUserDetail(user.uid, user.email, null, null, null, null);
        //currentUserDetails = new UserModel(user.uid, user.email, '', '', user.uid, '');
        that.userService.saveCurrentUserDetail(user.uid, user.email, '', '');
      }
    });
  }
  

  // Create User Anonymous
  // createAnonymousUser(): firebase.Promise<any> {
  //   return this.fireAuth.signInAnonymously();
  // }

  // Login with Email
  doLoginFirebase(email: string, password: string): any {
    // return this.fireAuth.signInWithEmailAndPassword(email, password);
    // var token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsImlhdCI6MTU4OTUzMTU5MSwiZXhwIjoxNTg5NTM1MTkxLCJpc3MiOiJmaXJlYmFzZS1hZG1pbnNkay1hMHIxNkBjaGF0MjEtcHJlLTAxLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwic3ViIjoiZmlyZWJhc2UtYWRtaW5zZGstYTByMTZAY2hhdDIxLXByZS0wMS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVpZCI6IjVhYjBmM2ZhNTcwNjZlMDAxNGJmZDcxZSJ9.ENLxPAwkBfggLY8DT-YRgER8tryegLsse6J_SZ0bjSDzb06FU5MS-9DLYrYXo5C8dzd685DdrhGSXii8XGdUO2uKrQClvDUJIUMO5WYvfZIfo4OFxVJ3Gh0k94ED2clvZnWARNzhIBz9uw5yp2MyC2jUbkhYn1YZ-sqaj7pBSzFGqRhT1ISqPFbhOppBd6SbnzRr5U5trR7-F-mzIMqh1dDW3PoWYxa9XV1Kd2ZdsCxqvH-UQA2O0-EgnVD9PbewQdie40jKTvwwKI-u7d3nOYjQ9jHtr9UZVPWD_TLy8tK1Du9nj1Tksc_HPxizzLiLBM8bB95aK-R8BgSzw7DFWg';
     var token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsImlhdCI6MTU4OTk4NDI5MywiZXhwIjoxNTg5OTg3ODkzLCJpc3MiOiJmaXJlYmFzZS1hZG1pbnNkay1hMHIxNkBjaGF0MjEtcHJlLTAxLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwic3ViIjoiZmlyZWJhc2UtYWRtaW5zZGstYTByMTZAY2hhdDIxLXByZS0wMS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVpZCI6IjVhYjBmM2ZhNTcwNjZlMDAxNGJmZDcxZSJ9.Oh1LUsf8JkFki1Grua1UTvUqYXguv8eZojoWqm5dWXLKD6-Qb6zoyMUG6h7MQGlfQEY-flyEnv0hjaWiLZPCJiIPU7mwYQ775ACYa-p_vbP-U0i9-duwkDrnU2cVKFvcniNjAF6D5a7bwwv7KLmhiMk70nYq7khY7CcW0dx-8umi6re2TRKDN0l-DBcW69Fl8HpOxgzcfRVJYt18_Wr2PQNpOPO-6lT8DWTfVfw5jdPO8gedv5hOIPTHyivd4CfJplt-_Sg9dJMHhBGM3R1YXlD2gDZ6JycsMgzbmFWWJdRU892yJK7mpRKF89v1Nfxb9ayl4AtKgQaPm7HE1cDd6A';
     return this.authenticateFirebaseCustomToken(token)
  }


  authenticateFirebaseCustomToken(token) {
    // var token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJodHRwczovL2lkZW50aXR5dG9vbGtpdC5nb29nbGVhcGlzLmNvbS9nb29nbGUuaWRlbnRpdHkuaWRlbnRpdHl0b29sa2l0LnYxLklkZW50aXR5VG9vbGtpdCIsImlhdCI6MTU4OTUzMTU5MSwiZXhwIjoxNTg5NTM1MTkxLCJpc3MiOiJmaXJlYmFzZS1hZG1pbnNkay1hMHIxNkBjaGF0MjEtcHJlLTAxLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwic3ViIjoiZmlyZWJhc2UtYWRtaW5zZGstYTByMTZAY2hhdDIxLXByZS0wMS5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsInVpZCI6IjVhYjBmM2ZhNTcwNjZlMDAxNGJmZDcxZSJ9.ENLxPAwkBfggLY8DT-YRgER8tryegLsse6J_SZ0bjSDzb06FU5MS-9DLYrYXo5C8dzd685DdrhGSXii8XGdUO2uKrQClvDUJIUMO5WYvfZIfo4OFxVJ3Gh0k94ED2clvZnWARNzhIBz9uw5yp2MyC2jUbkhYn1YZ-sqaj7pBSzFGqRhT1ISqPFbhOppBd6SbnzRr5U5trR7-F-mzIMqh1dDW3PoWYxa9XV1Kd2ZdsCxqvH-UQA2O0-EgnVD9PbewQdie40jKTvwwKI-u7d3nOYjQ9jHtr9UZVPWD_TLy8tK1Du9nj1Tksc_HPxizzLiLBM8bB95aK-R8BgSzw7DFWg';
    const that = this;
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function() {
      // Sign-out successful.
      return that.fireAuth.signInWithCustomToken(token)
      .then(function(response) {
        // that.g.wdLog(['obsLoggedUser - authService.authenticateFirebaseCustomToken']);
        // that.getToken();????
        return response;
      })
      .catch(function(error) {
          const errorCode = error.code;
          const errorMessage = error.message;
      });
    })
    .catch(function(error) {
      console.error('Error setting firebase auth persistence', error);
    });
  }
  
  // Signin with Facebook
  // signInWithFacebook(): any {
  //   return this.afAuth.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider())
  //   .then(res => console.log(res));
  // }


  // Register User with Email
  register(email: string, password: string, firstname: string, lastname: string): any {
    return this.fireAuth.createUserWithEmailAndPassword(email, password); 
  }

  // delete account
  delete(){
    var user = firebase.auth().currentUser;
    user.delete().then(function() {
      // User deleted.
      console.log("delete OK ");
    }).catch(function(error) {
      // An error happened.
      console.log("delete with error: ",error);
    });
  }

  // Reset Password
  resetPassword(email: string): any {
    return this.fireAuth.sendPasswordResetEmail(email);
  }
  
  logoutUser() {
    console.log("AuthService::logoutUser")

    return firebase.auth().signOut()
    //return this.afAuth.auth.signOut();
    // .then((res) => {
    //   console.log("logout1",res);
    //   console.log("logout2", this.getUser());
    // })
    // .catch(function(error) {
    //   console.log("logout failed: " + error.message)
    // });
  }
  //End Firebase Auth//
}
