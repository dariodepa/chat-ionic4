import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';



// @NgModule({
//   declarations: [AppComponent],
//   entryComponents: [],
//   imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
//   providers: [
//     StatusBar,
//     SplashScreen,
//     { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
//   ],
//   bootstrap: [AppComponent]
// })
// export class AppModule {}





// import { HttpModule } from '@angular/http';
// import { IonicStorageModule } from '@ionic/storage';
// import { LinkyModule } from 'ngx-linky';

// import { IonicApp, IonicModule, IonicErrorHandler } from '@ionic/angular';

import { environment } from '../environments/environment';


// import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
// import { SQLite } from '@ionic-native/sqlite/ngx';
// import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// import { HttpClientModule, HttpClient } from '@angular/common/http';

// import ngx-translate and the http loader
import {TranslateLoader, TranslateModule, TranslatePipe} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {HttpClient, HttpClientModule} from '@angular/common/http';

// import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
// import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// import { HttpClientModule, HttpClient } from '@angular/common/http';

// import { UsersPage } from '../pages/users/users';
// import { LoginPage } from '../pages/authentication/login/login';
// import { RegisterPage } from '../pages/authentication/register/register';
// import { ResetpwdPage } from '../pages/authentication/resetpwd/resetpwd';
// import { ListaConversazioniPage } from '../pages/lista-conversazioni/lista-conversazioni';
// import { DettaglioConversazionePage } from '../pages/dettaglio-conversazione/dettaglio-conversazione';
// import { ProfilePage } from '../pages/profile/profile';
// import { InfoConversationPage } from '../pages/info-conversation/info-conversation';
// import { InfoUserPage } from '../pages/info-user/info-user';
// import { InfoMessagePage } from '../pages/info-message/info-message';
// import { InfoAdvancedPage } from '../pages/info-advanced/info-advanced';
// import { PlaceholderPage } from '../pages/placeholder/placeholder';
// import { PopoverPage } from '../pages/popover/popover';
// import { PopoverProfilePage } from '../pages/popover-profile/popover-profile';
// import { UpdateImageProfilePage } from '../pages/update-image-profile/update-image-profile';
// import { ArchivedConversationsPage } from '../pages/archived-conversations/archived-conversations';


// import { AuthService } from '../providers/auth-service';
// import { ChatPresenceHandler } from '../providers/chat-presence-handler';
// import { UploadService } from '../providers/upload-service/upload-service';
// import { NavProxyService } from '../providers/nav-proxy';


// @ionic
// import { StatusBar } from '@ionic-native/status-bar';
// import { SplashScreen } from '@ionic-native/splash-screen';
import { AppConfigProvider } from './services/app-config';
import { MessagingService } from './services/messaging-service';
import { EventsService } from './services/events-service';
import { AuthService } from './services/auth-service';
import { UserService } from './services/user';
import { ChatPresenceHandler } from './services/chat-presence-handler';


import { ConversationListPage } from './pages/conversation-list/conversation-list.page';
import {LoginModalModule} from './modals/authentication/login/login.module';
// import { ConversationDetailPage } from './pages/conversation-detail/conversation-detail.page';
// import { LoginPage } from './pages/authentication/login/login';
// import { LoginPageModule } from './modals/authentication/login/login.module';
// import { ConversationListTestPageModule } from './pages/conversation-list-test/conversation-list-test.module';

// import { UserService } from '../providers/user/user';
// import { GroupService } from '../providers/group/group';
// import { AutosizeDirective } from '../directives/autosize/autosize';
// import { DatabaseProvider } from '../providers/database/database';
// import { ChatConversationsHandler } from '../providers/chat-conversations-handler';
// import { ChatArchivedConversationsHandler } from '../providers/chat-archived-conversations-handler';
// import { ChatConversationHandler } from '../providers/chat-conversation-handler';
// import { ChatManager } from '../providers/chat-manager/chat-manager';
// import { ChatContactsSynchronizer } from '../providers/chat-contacts-synchronizer';
// import { TiledeskConversationProvider } from '../providers/tiledesk-conversation/tiledesk-conversation';

// import { CannedResponsesServiceProvider } from '../providers/canned-responses-service/canned-responses-service';

// export function createTranslateLoader(http: HttpClient) {
//   return new TranslateHttpLoader(http, './assets/i18n/', '.json');
// }


export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

const appInitializerFn = (appConfig: AppConfigProvider) => {
  return () => {
    if (environment['remoteConfig']) {
      console.log('environment.remoteConfig: ', environment['remoteConfig']);
      return appConfig.loadAppConfig();
    }
  };
};


@NgModule({
  declarations: [
    AppComponent,
    ConversationListPage
  ],
  entryComponents: [
    ConversationListPage
  ],
  imports: [
    BrowserModule, 
    FormsModule, 
    ReactiveFormsModule,
    IonicModule.forRoot(), 
    AppRoutingModule,
    HttpClientModule, 
    LoginModalModule,
    TranslateModule.forRoot({ 
      loader: { 
        provide: TranslateLoader, 
        useFactory: (createTranslateLoader),  
        deps: [HttpClient] 
      } 
    }),
    // LinkyModule,
    // IonicStorageModule.forRoot({
    //   name: "tilechat",
    //   storeName: 'settings',
    //   driverOrder: ['indexeddb','sqlite', 'websql', 'indexeddb', 'localstorage']
    // }) 
    // ConversationListTestPageModule
  ],
  bootstrap: [AppComponent],

  providers: [
    AppConfigProvider, // https://juristr.com/blog/2018/01/ng-app-runtime-config/
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFn,
      multi: true,
      deps: [AppConfigProvider]
    },
    //ApplicationContext,
    StatusBar,
    SplashScreen,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // {provide: ErrorHandler, useClass: IonicErrorHandler},
    // DatabaseProvider,
    // SQLitePorter,
    // SQLite,
    // AuthService,
    // ChatPresenceHandler,
    // NavProxyService,
    MessagingService,
    EventsService,
    AuthService,
    UserService,
    ChatPresenceHandler
    // UploadService,
    // ChatManager,
    // ChatConversationsHandler,
    // ChatArchivedConversationsHandler,
    // ChatConversationHandler,
    // ChatContactsSynchronizer,
    // GroupService,
    // TiledeskConversationProvider,
    // CannedResponsesServiceProvider
  ]
})
export class AppModule {}

