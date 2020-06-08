import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConversationInfoPageRoutingModule } from './conversation-info-routing.module';

import { ConversationInfoPage } from './conversation-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConversationInfoPageRoutingModule
  ],
  declarations: []
})
export class ConversationInfoPageModule {}
