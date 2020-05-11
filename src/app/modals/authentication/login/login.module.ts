import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateLoader, TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { createTranslateLoader } from '../../../services/utils/utils';
// // import { createTranslateLoader } from '../../../app.module';

// import { LoginPageRoutingModule } from './login-routing.module';
import { LoginModal } from './login.modal';



@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // LoginPageRoutingModule,
    TranslateModule.forRoot({ 
      loader: { 
        provide: TranslateLoader, 
        useFactory: (createTranslateLoader),  
        deps: [HttpClient] 
      } 
    })
  ],
  declarations: [LoginModal],
  entryComponents: [LoginModal]
})
export class LoginModalModule {}
