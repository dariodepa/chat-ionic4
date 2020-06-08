import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ConversationListPage } from './pages/conversations-list/conversations-list.page';
// import { ConversationDetailPage } from './pages/conversation-detail/conversation-detail.page';
// import { DetailsPage } from './pages/details/details.page';

const routes: Routes = [
  { path: '', redirectTo: 'detail', pathMatch: 'full' },
  { path: '', component: ConversationListPage, outlet:'sidebar' },
  {
    path: 'conversations-list',
    //loadChildren: './pages/conversations-list/conversation-slist.module'
    loadChildren: () => import('./pages/conversations-list/conversations-list.module').then( m => m.ConversationListPageModule)
  },
  {
    path: 'conversation-detail/:IDConv',
    loadChildren: () => import('./pages/conversation-detail/conversation-detail.module').then( m => m.ConversationDetailPageModule)
  },
  {
    path: 'conversation-detail',
    loadChildren: () => import('./pages/conversation-detail/conversation-detail.module').then( m => m.ConversationDetailPageModule)
  },

  // {
  //   path: 'detail/:IDConv',
  //   loadChildren: () => import('./pages/details/details.module').then( m => m.DetailsPageModule),
  //   // loadChildren: './pages/details/details.module',
  // },
  {
    path: 'detail',
    loadChildren: () => import('./pages/details/details.module').then( m => m.DetailsPageModule),
    // loadChildren: './pages/details/details.module',
  },
  {
    path: 'conversation-info',
    loadChildren: () => import('./pages/conversation-info/conversation-info.module').then( m => m.ConversationInfoPageModule)
  },
  
];



@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
