import { Component, ViewChild, NgZone, HostListener, ElementRef } from '@angular/core';
import { Config, Platform, IonRouterOutlet, IonSplitPane, NavController, MenuController, AlertController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

import * as firebase from 'firebase/app';
// import { ListaConversazioniPage } from './pages/lista-conversazioni/lista-conversazioni';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
// import {NavProxyService} from './services/nav-proxy';
import { MessagingService } from './services/messaging-service';
import { ChatManager } from './services/chat-manager';
import { TranslateService } from '@ngx-translate/core';

import { AppConfigProvider } from './services/app-config';
import { UserService } from './services/user';
import { EventsService } from './services/events-service';
import { AuthService } from './services/auth-service';


import { ModalController } from '@ionic/angular'
// pages
import { LoginModal } from './modals/authentication/login/login.modal';
// import { ConversationListPage } from './pages/conversation-list/conversation-list.page';
// utils
import { presentModal, closeModal } from './services/utils/utils';

type NewType = IonRouterOutlet;

// import { Component } from '@angular/core';
// import { Platform } from '@ionic/angular';
// import { SplashScreen } from '@ionic-native/splash-screen/ngx';
// import { StatusBar } from '@ionic-native/status-bar/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  @ViewChild('masterNav', {static: false}) masterNav: ElementRef;
  // @ViewChild('masterNav', { read: IonRouterOutlet, static: true })masterNav: IonRouterOutlet;
  // @ViewChild('detailNav', { read: IonRouterOutlet, static: false })detailNav: IonRouterOutlet;

  // @ViewChild('masterNav', {static: false}) masterNav: IonRouterOutlet;
  // @ViewChild('detailNav', {static: false}) detailNav: IonRouterOutlet;

  // masterPage: any = null;
  // detailPage: any = null;

  public notificationsEnabled: boolean;
  public zone: NgZone;
  public isNavBar: string;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private appConfigProvider: AppConfigProvider,
    private msgService: MessagingService,
    private events: EventsService,
    public config: Config,
    public chatManager: ChatManager,
    public translate: TranslateService,
    public alertController: AlertController,
    public navCtrl: NavController,
    public user: UserService,
    public modalController: ModalController,
    public authService: AuthService,
    private router: Router
  ) {
    this.initializeApp();
    // this.onRouterActivate();
    // this.router.navigate([{outlets: {primary: 'path' ,sidebar: 'path'}}]);
    // this.router.navigate(['conversation-list/'], { outlets: { outletName: ['navigatingPath'] }});
    // this.router.navigate([{ outlets: { sidebar: 'conversation-list' } }]);

  }


  // @HostListener('window:resize', ['$event'])
  // onResize(event) {
  //   // this.screenWidth = window.innerWidth;
  //   // this.screenHeight = window.innerHeight;
  //   console.log('width::::', window.innerWidth);

  //   console.log(this.masterNav.nativeElement.offsetWidth);
  //   if(this.masterNav.nativeElement.offsetWidth == 0){
  //     this.router.navigateByUrl('/conversation-list');
  //   }
  // }

  /** */
  // onRouterActivate(): void {
  //   this.masterNav.pop().then(() => {
  //     //this hasn't finish to pop, so it goes to the below route... and then pops it
  //     this.navCtrl.navigateRoot(["", { outlets: { detailNav: "path/to/thing"}}]);
  //   });
  // }

  /** */
  initializeApp() {
    this.notificationsEnabled = true;
    this.zone = new NgZone({});

    this.platform.ready().then(() => {
       
      this.setLanguage();

      this.showNavbar();
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      // init
      this.chatManager.initialize();
      this.msgService.initialize();
      this.authService.initialize();
      
      this.subscriptions();
    });
  }


  // BEGIN SUBSCRIPTIONS //
  /** */
  subscriptions(){
    // this.events.subscribe('requestPermission', this.callbackRequestPermission);
    this.events.subscribe('requestPermission', (permission) => {
      console.log("callbackRequestPermission", permission);
      this.notificationsEnabled = permission;
      this.msgService.getToken();
    });
    this.events.subscribe('loggedUser:login', this.subscribeLoggedUserLogin);
    this.events.subscribe('loggedUser:logout', this.subscribeLoggedUserLogout);
  }

  /** 
   * ::: subscribeLoggedUserLogin :::
   * effettuato il login: 
   * dismetto modale
  */
  subscribeLoggedUserLogin = (user: any) => {
    console.log('************** subscribeLoggedUserLogin', user);
    try {
      closeModal(this.modalController);
    } catch (err) {
      console.error("-> error:", err)
    }
  }

  /** 
   * ::: subscribeLoggedUserLogout :::
   * effettuato il logout:
   * mostro modale login
  */
  subscribeLoggedUserLogout = () => {
    console.log('************** subscribeLoggedUserLogout');
    presentModal(this.modalController, LoginModal, { tenant: 'tilechat', enableBackdropDismiss: false });
  }
  // END SUBSCRIPTIONS //




  // BEGIN MY FUNCTIONS //

  /** */
  initFirebase() {
    if (!this.appConfigProvider.getConfig().firebaseConfig || this.appConfigProvider.getConfig().firebaseConfig.apiKey === 'CHANGEIT') {
      throw new Error('firebase config is not defined. Please create your firebase-config.json. See the Chat21-Web_widget Installation Page');
    }
    console.log(this.appConfigProvider.getConfig().firebaseConfig);
    firebase.initializeApp(this.appConfigProvider.getConfig().firebaseConfig);
  }

  /** */
  showNavbar(){
    let TEMP = location.search.split('navBar=')[1];
    if (TEMP) { this.isNavBar = TEMP.split('&')[0]; }
  }
  
  /** */
  setLanguage(){
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    console.log('navigator.language: ', navigator.language);
    var language;
    if(navigator.language.indexOf('-') != -1){
      language = navigator.language.substring(0, navigator.language.indexOf('-'));
    } else if(navigator.language.indexOf('_') != -1){
      language = navigator.language.substring(0, navigator.language.indexOf('_'));
    } else {
      language = navigator.language;
    }
    this.translate.use(language);
    console.log('language: ', language);
  }

  /** */
  hideAlert(){
    console.log("hideAlert");
    this.notificationsEnabled = true;
  }
  // END MY FUNCTIONS //
  

}