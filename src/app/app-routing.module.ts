import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'conversation-detail/41', pathMatch: 'full' },
  {
    path: 'conversation-list',
    loadChildren: () => import('./pages/conversation-list/conversation-list.module').then( m => m.ConversationListPageModule)
  },
  {
    path: 'conversation-detail/:IDConv',
    loadChildren: () => import('./pages/conversation-detail/conversation-detail.module').then( m => m.ConversationDetailPageModule)
  },
  
 
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
