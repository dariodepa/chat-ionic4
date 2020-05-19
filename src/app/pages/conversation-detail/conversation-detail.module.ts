import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ConversationDetailPageRoutingModule } from './conversation-detail-routing.module';
import { ConversationDetailPage } from './conversation-detail.page';


import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { createTranslateLoader } from '../../services/utils/utils';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConversationDetailPageRoutingModule,
    TranslateModule.forChild({ 
      loader: { 
        provide: TranslateLoader, 
        useFactory: (createTranslateLoader),  
        deps: [HttpClient] 
      },
    })
  ],
  declarations: [ConversationDetailPage]
})
export class ConversationDetailPageModule {}
