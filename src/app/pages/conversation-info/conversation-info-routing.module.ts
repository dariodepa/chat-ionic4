import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConversationInfoPage } from './conversation-info.page';

const routes: Routes = [
  {
    path: '',
    component: ConversationInfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConversationInfoPageRoutingModule {}
