import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConversationDetailPageRoutingModule } from './conversation-detail-routing.module';

import { ConversationDetailPage } from './conversation-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConversationDetailPageRoutingModule
  ],
  declarations: [ConversationDetailPage]
})
export class ConversationDetailPageModule {}
