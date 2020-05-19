import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ConversationListPage } from './pages/conversation-list/conversation-list.page';
// import { ConversationDetailPage } from './pages/conversation-detail/conversation-detail.page';
import { DetailsPage } from './pages/details/details.page';

const routes: Routes = [
  { path: '', redirectTo: 'conversation-detail/10', pathMatch: 'full' },
  // { path: '', redirectTo: 'details', pathMatch: 'full'},
  { path: '', component: ConversationListPage, outlet:'sidebar' },
  {
    path: 'conversation-list',
    //loadChildren: './pages/conversation-list/conversation-list.module'
    loadChildren: () => import('./pages/conversation-list/conversation-list.module').then( m => m.ConversationListPageModule)
  },
  {
    path: 'conversation-detail/:IDConv',
    loadChildren: () => import('./pages/conversation-detail/conversation-detail.module').then( m => m.ConversationDetailPageModule)
  },

  {
    path: 'details',
    loadChildren: () => import('./pages/details/details.module').then( m => m.DetailsPageModule),
    // loadChildren: './pages/details/details.module',
  },
  
];



@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
