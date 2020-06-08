import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { createTranslateLoader } from '../../services/utils/utils';

import { ConversationListPageRoutingModule } from './conversations-list-routing.module';
import { ConversationListPage } from './conversations-list.page';
// import {LoginModalModule} from '../../modals/authentication/login/login.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConversationListPageRoutingModule,
    // LoginModalModule,
    TranslateModule.forChild({ 
      loader: { 
        provide: TranslateLoader, 
        useFactory: (createTranslateLoader),  
        deps: [HttpClient] 
      } 
    })
  ],
  declarations: [ConversationListPage]
})
export class ConversationListPageModule {}