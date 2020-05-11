import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginModal } from './login.modal';

const routes: Routes = [
  {
    path: '',
    component: LoginModal
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
