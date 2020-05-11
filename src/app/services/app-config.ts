import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppConfigProvider {
  private appConfig: any;
  constructor(public http: HttpClient) {
    this.appConfig = environment;
  }

  /** */
  loadAppConfig() {
    const that = this;
    return this.http.get(this.appConfig.remoteConfigUrl)
      .toPromise()
      .then(data => {
        that.appConfig = data;
        console.log('----------------------------------> firebaseConfig:');
        console.log(this.appConfig.firebaseConfig);
      }).catch(err => {
        console.log('error loadAppConfig' + err);
      });
  }

  /** */
  getConfig() {
    return this.appConfig;
  }

}
