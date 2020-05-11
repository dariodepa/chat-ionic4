import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, NavParams } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

// pages
// import { RegisterPage } from '../../authentication/register/register';
// import { ResetpwdPage } from '../../authentication/resetpwd/resetpwd';
// services
import { AuthService } from '../../../services/auth-service';
import { AppConfigProvider } from '../../../services/app-config';
// config
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.modal.html',
  styleUrls: ['./login.modal.scss'],
})
export class LoginModal implements OnInit {
  public loginForm;
  public submitAttempt: boolean = false;
  public loading: any;
  public showPage: boolean;
  public tenant: string;
  public hostname: string;
  supportMode = environment['supportMode']
  emailChanged
  passwordChanged

  constructor(
    public modalCtrl: ModalController,
    // public navParams: NavParams,
    public authService: AuthService, 
    public formBuilder: FormBuilder,
    public alertCtrl: AlertController, 
    public loadingCtrl: LoadingController,
    public appConfig: AppConfigProvider
  ) { 
    this.tenant = 'tilechat';//navParams.get('tenant');
    this.hostname = window.location.hostname;
  }

  /**
   * imposto espressione regolare per verifica email
   * imposto il form della pagina con i campi da validare (email e psw)
   */
  ngOnInit() {
    //console.log('ngOnInit');
    let EMAIL_REGEXP = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.compose([Validators.required, Validators.pattern(EMAIL_REGEXP)])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])]
    });
  }

  /**
   * quando entro nella pagina imposto showPage a true 
   * e visualizzo il div della pagina 
   * controllo se sono già loggato e dismetto la view
   * utile quando vengo dalla registrazione utente
   * show view
   */
  ionViewWillEnter() {
    this.showPage = true;
    // if (this.authService.getUser()){
    //   this.viewCtrl.dismiss({animation:'none'})
    // }
  }

  /**
   * quando esco dalla pagina imposto showPage a false
   * che nasconde il div del login
   */
  ionViewWillLeave(){
    this.showPage = false;
  }

  /**
   * quando scrivo nel campo email o psw
   * richiamo questo metodo che  ???? booohhhh
   * @param input 
   */
  elementChanged(input){
    // let field = input.inputControl.firstname;
    // this[field + "Changed"] = true;
  }

  /**
   * quando premo sul pulsante registrati 
   * richiamo questa func che carica la pagina RegisterPage
   */
  register(){
    // let profileModal = this.modalCtrl.create(RegisterPage, null, { enableBackdropDismiss: false });
    // profileModal.present({animate: false, duration: 0});
  }

  /**
   * quando premo sul pulsante reset psw 
   * richiamo questa func che carica la pagina ResetpwdPage
   */
  resetPwd(){
    // let profileModal = this.modalCtrl.create(ResetpwdPage, null, { enableBackdropDismiss: false });
    // profileModal.present({animate: false, duration: 0});
  }

  /**
   * 
   */
  tiledeskLogin(){
    console.log('this.appConfig.getConfig().DASHBOARD_URL ', this.appConfig.getConfig().DASHBOARD_URL) 
    window.open(this.appConfig.getConfig().DASHBOARD_URL, "_blank");
    //this.loginUserFirebase();
  }
  
  // isHostname(){
  //   // alert( "domain: " + this.hostname + BASE_URL_HOSTNAME);
  //   if(this.hostname === BASE_URL_HOSTNAME){return true}
  //   return false
  // }


  signInWithCustomToken(email, psw) {
    let json = JSON.stringify({
        "email": email,
        "password": psw
    });
    var urlCustomToken = 'https://tiledesk-server-pre.herokuapp.com/firebase/auth/signin';
    var httpRequest = this.createCORSRequest('POST', urlCustomToken,true); //set async to false because loadParams must return when the get is complete
    if (!httpRequest) {
        throw new Error('CORS not supported');
    }
    httpRequest.setRequestHeader('Content-type', 'application/json');
    httpRequest.send(json);
    httpRequest.onload = function() {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
            if (httpRequest.status === 200) {
                try {
                    var response = JSON.parse(httpRequest.responseText);
                    //window.tiledesk.signInWithCustomToken(response);
                }
                catch(err) {
                    console.error(err.message);
                }
                return true;
            } else {
                alert('There was a problem with the request.');
            }
        }         
    };
    httpRequest.onerror = function() {
        console.error('There was an error!');
        return false;
    };
  }

  /** */
  createCORSRequest(method, url, async) {
    console.log("createCORSRequest");
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, async);
        console.log("xhr12");
    } 
//     else if (typeof XDomainRequest != "undefined") {
//          // Otherwise, check if XDomainRequest.
//          // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
//          xhr = new XDomainRequest();
//          xhr.open(method, url);
//          console.log("xhr111");
//     } 
    else {
         // Otherwise, CORS is not supported by the browser.
         xhr = null;
         console.log("xhrnull");
    }
    return xhr;
  }

  /**
   * quando premo sul pulsante login richiamo questa func che:
   * effettuo il login e se riesce chiudo tutte le pg aperte
   * altrimenti apro un alert di errore
   */
  loginUserFirebase(){
    const that = this;
    this.submitAttempt = true;
    console.log("LOGIN", this.loginForm.value);
    if (!this.loginForm.valid){
      console.log("ERRORE LOGIN:: ",this.loginForm.value);
    } else {
      this.authService.doLoginFirebase(this.loginForm.value.email, this.loginForm.value.password)
      .then( user => {
        console.log("register",user);
        //this.userService.setCurrentUserDetails(user.uid, user.email);
        //dismetto la modale ricarico lista conversazioni passando user
        // that.loading.dismiss();
      })
      .catch(error => {
          console.log(error,'ERROR LOGIN FIREBASE');
          this.loading.dismiss().then( () => {
            let alert = this.alertCtrl.create({
              message: error.message,
              buttons: [
                {
                  text: "Ok",
                  role: 'cancel'
                }
              ]
            });
            //alert.present();
          });
      });
      // this.loading = this.loadingCtrl.create({
      //   dismissOnPageChange: true,
      // });
      //this.loading.present();
    }
  }

}
